/**
 * router.js
 * ECG Triage — URL Parameter Utilities
 *
 * Provides helpers for reading query params and building URLs.
 * These are the canonical cross-page state transfer mechanism (MPA design).
 * sessionStorage is the secondary fallback only — see Section 9 of blueprint.
 *
 * No dependencies. Safe to import from any page script.
 *
 * Sprint 2, Step 11 of 25.
 */

// ─────────────────────────────────────────────────────────────────────────────
// Query parameter reads
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Read a single URL query parameter by key.
 *
 * @param {string} key
 * @returns {string|null}
 *
 * @example
 * // URL: /results.html?prediction_id=pred_001
 * getQueryParam('prediction_id'); // → 'pred_001'
 */
export function getQueryParam(key) {
  return new URLSearchParams(window.location.search).get(key);
}

/**
 * Read all query parameters as a plain object.
 *
 * @returns {Record<string, string>}
 *
 * @example
 * // URL: /results.html?prediction_id=pred_001&tab=waveform
 * getAllQueryParams(); // → { prediction_id: 'pred_001', tab: 'waveform' }
 */
export function getAllQueryParams() {
  const params = {};
  new URLSearchParams(window.location.search).forEach((value, key) => {
    params[key] = value;
  });
  return params;
}

// ─────────────────────────────────────────────────────────────────────────────
// URL construction
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Build a URL with query parameters appended.
 * Handles both absolute paths and relative paths.
 *
 * @param {string} base   e.g. '/results.html' or 'results.html'
 * @param {Record<string, string|number>} params
 * @returns {string}  Fully-qualified URL string.
 *
 * @example
 * buildUrl('results.html', { prediction_id: 'pred_001' });
 * // → 'http://localhost:5173/ecg_triage_system_backend/results.html?prediction_id=pred_001'
 */
export function buildUrl(base, params = {}) {
  const url = new URL(base, window.location.href);
  Object.entries(params).forEach(([k, v]) => {
    if (v !== null && v !== undefined) url.searchParams.set(k, String(v));
  });
  return url.toString();
}

/**
 * Navigate to a page with query params, replacing the current history entry.
 * Use for redirects (e.g. post-login) where pressing Back should skip the page.
 *
 * @param {string} path    e.g. 'dashboard.html'
 * @param {Record<string, string|number>} [params]
 */
export function redirectTo(path, params = {}) {
  window.location.replace(buildUrl(path, params));
}

/**
 * Navigate to a page with query params, pushing a new history entry.
 * Use for normal navigation where Back should work.
 *
 * @param {string} path
 * @param {Record<string, string|number>} [params]
 */
export function navigateTo(path, params = {}) {
  window.location.href = buildUrl(path, params);
}

// ─────────────────────────────────────────────────────────────────────────────
// Page context helpers
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Returns the current page filename without the leading slash.
 * Useful for active-link detection and page-specific init logic.
 *
 * @returns {string}  e.g. 'dashboard.html', 'results.html'
 *
 * @example
 * currentPage(); // → 'results.html'
 */
export function currentPage() {
  return window.location.pathname.split("/").pop() || "index.html";
}
