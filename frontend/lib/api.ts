import { env } from "@/config/env";
import { cookies } from "./cookies";
export const API_BASE = env.baseURL;

interface ApiResponse<T = unknown> {
  success: boolean;
  data: T;
  message: string;
}

/**
 * ApiClient — security-hardened token flow.
 *
 * - The access token lives ONLY in memory + a short-lived JS cookie (for
 *   proxy.ts gating). Never localStorage (XSS-safe).
 * - The refresh token is an HttpOnly cookie scoped to /api/auth on the API
 *   origin; the browser sends it automatically via credentials: "include".
 */
class ApiClient {
  private accessToken: string | null = null;
  private refreshPromise: Promise<boolean> | null = null;

  constructor() {
    if (typeof window !== "undefined") {
      this.accessToken = cookies.get("accessToken");
    }
  }

  private buildUrl(endpoint: string, params?: Record<string, string>) {
    const url = new URL(`${API_BASE}${endpoint}`);
    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        if (v !== undefined && v !== null && v !== "")
          url.searchParams.set(k, v);
      });
    }
    return url.toString();
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit & { params?: Record<string, string> } = {},
    retry = true,
  ): Promise<ApiResponse<T>> {
    const hasFormData = options.body instanceof FormData;
    const headers: Record<string, string> = {
      ...(hasFormData ? {} : { "Content-Type": "application/json" }),
      ...(options.headers as Record<string, string>),
    };

    if (this.accessToken) {
      headers["Authorization"] = `Bearer ${this.accessToken}`;
    }

    const url = this.buildUrl(endpoint, options.params);

    let res = await fetch(url, { ...options, method: options.method || "GET", headers });

    // Access token expired → try one silent refresh, then replay the request.
    if (res.status === 401 && retry) {
      const refreshed = await this.refreshAccessToken();
      if (refreshed) {
        return this.request<T>(endpoint, options, false);
      }
    }

    const data = await res.json();
    return data;
  }

  /** Silent refresh via HttpOnly refresh cookie. Returns true on success. */
  private async refreshAccessToken(): Promise<boolean> {
    if (this.refreshPromise) return this.refreshPromise;

    this.refreshPromise = (async () => {
      try {
        const res = await fetch(`${API_BASE}/auth/refresh-token`, {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({}),
        });
        const data = await res.json();
        if (res.ok && data.success && data.data?.accessToken) {
          this.setTokens(data.data.accessToken);
          return true;
        }
        this.clearTokens();
        return false;
      } catch {
        return false;
      }
    })();

    try {
      return await this.refreshPromise;
    } finally {
      this.refreshPromise = null;
    }
  }

  setTokens(accessToken: string) {
    this.accessToken = accessToken;
    cookies.set("accessToken", accessToken, 15);
  }

  clearTokens() {
    this.accessToken = null;
    cookies.remove("accessToken");
  }

  get<T>(endpoint: string, params?: Record<string, string>) {
    return this.request<T>(endpoint, { params });
  }

  post<T>(endpoint: string, body?: unknown, headers?: Record<string, string>) {
    return this.request<T>(endpoint, {
      method: "POST",
      headers: headers as Record<string, string>,
      body:
        body instanceof FormData
          ? body
          : body
            ? JSON.stringify(body)
            : undefined,
    });
  }

  patch<T>(endpoint: string, body?: unknown, headers?: Record<string, string>) {
    return this.request<T>(endpoint, {
      method: "PATCH",
      headers: headers as Record<string, string>,
      body:
        body instanceof FormData
          ? body
          : body
            ? JSON.stringify(body)
            : undefined,
    });
  }

  put<T>(endpoint: string, body?: unknown, headers?: Record<string, string>) {
    return this.request<T>(endpoint, {
      method: "PUT",
      headers: headers as Record<string, string>,
      body:
        body instanceof FormData
          ? body
          : body
            ? JSON.stringify(body)
            : undefined,
    });
  }

  delete<T>(endpoint: string) {
    return this.request<T>(endpoint, { method: "DELETE" });
  }

  /** Raw fetch pre-configured for auth endpoints that rely on the refresh cookie. */
  async postWithCredentials<T>(endpoint: string): Promise<ApiResponse<T>> {
    const res = await fetch(this.buildUrl(endpoint), {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
    });
    return res.json();
  }

  getAccessToken() {
    return this.accessToken;
  }

  isAuthenticated() {
    return !!this.accessToken || !!cookies.get("accessToken");
  }
}

export const api = new ApiClient();
