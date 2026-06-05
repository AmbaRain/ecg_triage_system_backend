/**
 * auth.js
 * ECG Triage — Authentication & Route Protection
 *
 * This is the ONLY file that reads/writes auth state in sessionStorage.
 * Every other module calls these functions; none touches sessionStorage directly.
 *
 * See Section 5 of the blueprint for the full token lifecycle and the
 * ⚠️ HIPAA note about sessionStorage XSS risk.
 *
 * Sprint 2, Step 9 of 25.
 */

import { CONFIG } from "./config.js";
import { API } from "./api-adapter.js";

// ─────────────────────────────────────────────────────────────────────────────
// Token & user reads (synchronous)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Returns the raw JWT string, or null if no session exists.
 * @returns {string|null}
 */
export function getAuthToken() {
  return sessionStorage.getItem(CONFIG.AUTH_TOKEN_KEY);
}

/**
 * Returns the parsed current-user object, or null if not logged in.
 * Shape: { user_id, username, full_name, role }
 * @returns {Object|null}
 */
export function getCurrentUser() {
  const raw = sessionStorage.getItem(CONFIG.AUTH_USER_KEY);
  try {
    return raw ? JSON.parse(raw) : null;
  } catch {
    // Corrupted storage entry — treat as unauthenticated
    return null;
  }
}

/**
 * Returns true if a token is present in sessionStorage.
 * Does NOT validate the token against the server.
 * @returns {boolean}
 */
export function isAuthenticated() {
  return !!getAuthToken();
}

// ─────────────────────────────────────────────────────────────────────────────
// Role helpers
// See Section 8 of the blueprint for the single-role-system rationale.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Returns the current user's role string, defaulting to 'clinician'.
 * @returns {string}
 */
export function getCurrentUserRole() {
  const user = getCurrentUser();
  return user?.role || "clinician";
}

/**
 * Role check hook — currently always returns true (single-role system).
 * When multi-role support is introduced, update this function only.
 * All page-level guard code references hasRole() and requires no other changes.
 *
 * @param {string} _requiredRole  Unused until multi-role is implemented.
 * @returns {boolean}
 */
export function hasRole(_requiredRole) {
  // Single-role system: all authenticated users are clinicians.
  // Future: return getCurrentUserRole() === _requiredRole;
  return true;
}

// ─────────────────────────────────────────────────────────────────────────────
// Auth actions (async)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Authenticate the user, persist the token and user object, and return the user.
 *
 * @param {string} username
 * @param {string} password
 * @returns {Promise<Object>} Resolved user object.
 * @throws {{ status: number, message: string }} On invalid credentials.
 */
export async function login(username, password) {
  const data = await API.login(username, password);
  sessionStorage.setItem(CONFIG.AUTH_TOKEN_KEY, data.token);
  sessionStorage.setItem(CONFIG.AUTH_USER_KEY, JSON.stringify(data.user));
  return data.user;
}

export const redirector = {
  navigate(url) {
    window.location.href = url;
  },
};

/**
 * Sign the user out: calls the API (best-effort), then unconditionally
 * clears local session state and redirects to login.
 * The finally block guarantees the redirect even if the server call fails.
 *
 * @returns {Promise<void>}
 */
export async function logout() {
  try {
    await API.logout();
  } finally {
    // ⚠️ Always clear, even on network error — never leave a stale token.
    sessionStorage.removeItem(CONFIG.AUTH_TOKEN_KEY);
    sessionStorage.removeItem(CONFIG.AUTH_USER_KEY);
    redirector.navigate("login.html");
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Route protection
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Call at the top of every protected page (before any other JS executes).
 * Redirects to login.html immediately if no token is found.
 * Returns false after redirecting so callers can short-circuit their own init.
 *
 * Usage in every protected page <head>:
 *   <script type="module">
 *     import { requireAuth } from './js/auth.js';
 *     requireAuth();
 *   </script>
 *
 * @returns {boolean}  true if authenticated, false after redirect.
 */
export function requireAuth() {
  if (!isAuthenticated()) {
    redirector.navigate("login.html");
    return false;
  }
  return true;
}

/**
 * Call at the top of login.html.
 * Redirects to dashboard.html if the user is already authenticated,
 * so pressing Back after login doesn't return to the login form.
 *
 * @returns {boolean}  true if redirected (already logged in), false if not.
 */
export function redirectIfAuthenticated() {
  if (isAuthenticated()) {
    redirector.navigate("dashboard.html");
    return true;
  }
  return false;
}
