export function extractArray<T>(data: unknown, ...keys: string[]): T[] {
  if (Array.isArray(data)) return data;
  if (!data || typeof data !== 'object') return [];
  const obj = data as Record<string, unknown>;
  for (const key of keys) {
    if (Array.isArray(obj[key])) return obj[key] as T[];
  }
  const found = Object.values(obj).find((v) => Array.isArray(v));
  return (found as T[]) || [];
}

const OBJECT_ID_REGEX = /^[0-9a-fA-F]{24}$/;

export function isValidObjectId(id: unknown): boolean {
  return typeof id === 'string' && OBJECT_ID_REGEX.test(id);
}

interface ApiErrorLike {
  success?: boolean;
  message?: string;
  data?: unknown;
}

function formatValidationDetails(data: unknown): string | null {
  if (!Array.isArray(data)) return null;
  const messages = data
    .map((entry) => {
      if (entry && typeof entry === 'object' && typeof (entry as { message?: unknown }).message === 'string') {
        return (entry as { message: string }).message;
      }
      return null;
    })
    .filter((m): m is string => Boolean(m));
  return messages.length > 0 ? messages.join('; ') : null;
}

export function getErrorMessage(error: unknown, fallback: string): string {
  if (error && typeof error === 'object') {
    const maybe = error as ApiErrorLike;
    if (typeof maybe.message === 'string' && maybe.message.trim()) {
      const detail = formatValidationDetails(maybe.data);
      return detail ? `${maybe.message}: ${detail}` : maybe.message;
    }
    if (error instanceof Error && error.message && error.message !== 'Failed to fetch') {
      return error.message;
    }
    if (error instanceof Error && error.message === 'Failed to fetch') {
      return 'Network error. Please check your connection and try again.';
    }
  }
  return fallback;
}

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}
