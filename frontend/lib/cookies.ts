/**
 * Client-side cookie helpers.
 *
 * NOTE: the refresh token lives in an HttpOnly cookie managed entirely by the
 * backend (path /api/auth) and is never readable here. Only the short-lived
 * access token is mirrored in a JS-readable cookie so middleware/proxy route
 * gating can work without touching localStorage.
 */
function setCookie(name: string, value: string, minutes: number = 15) {
  if (typeof document === 'undefined') return;
  const expires = new Date(Date.now() + minutes * 60 * 1000).toUTCString();
  const secure = window.location.protocol === 'https:' ? '; Secure' : '';
  document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/; SameSite=Lax${secure}`;
}

function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

function removeCookie(name: string) {
  if (typeof document === 'undefined') return;
  document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; SameSite=Lax`;
}

export const cookies = { set: setCookie, get: getCookie, remove: removeCookie };
