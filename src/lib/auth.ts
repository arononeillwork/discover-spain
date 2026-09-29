// Auth helpers shared by the login form, server actions and the /auth/confirm route.

export type LoginState = {
  status: "idle" | "sent" | "error";
  email?: string;
  message?: string;
};

const SAFE_BASE = "http://next.invalid";

/**
 * Only allow same-site relative paths as post-sign-in / sign-out destinations. Blocks open
 * redirects such as "//evil.example", "https://evil.example", "/\\evil.example" and
 * "/<TAB>/evil.example" (browsers strip tabs and newlines from URLs, which turns that into
 * "//evil.example"). Returns a normalised path + query + hash, or "/".
 */
export function safeNextPath(value: FormDataEntryValue | string | null | undefined): string {
  if (typeof value !== "string" || !value.startsWith("/") || value.length > 2048) return "/";
  // Control characters (tab, CR, LF, ...) and backslashes never belong in a path we redirect to.
  if (/[\u0000-\u001F\u007F\\]/.test(value)) return "/";

  let url: URL;
  try {
    url = new URL(value, SAFE_BASE);
  } catch {
    return "/";
  }
  // Anything that resolves to another origin (e.g. "//evil.example") is not a same-site path.
  if (url.origin !== SAFE_BASE) return "/";

  // Never bounce back into the auth flow itself.
  const path = url.pathname;
  if (path.startsWith("/auth/") || path === "/login" || path.startsWith("/login/")) return "/";
  return `${path}${url.search}${url.hash}`;
}

export function isValidEmail(email: string) {
  return email.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/** Error codes /auth/confirm passes to /login?error=… and what the login page says about them. */
export const LOGIN_ERRORS: Record<string, string> = {
  link: "That sign-in link didn't work. It may have been used already, or opened in a different browser from the one you requested it in. Request a new link below.",
  expired: "That sign-in link has expired or has already been used. Request a new one below.",
};
