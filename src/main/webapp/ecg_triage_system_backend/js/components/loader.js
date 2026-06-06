/**
 * components/loader.js
 * ECG Triage — Loading Overlay & Spinner
 *
 * Manages a full-screen loading overlay that blocks interaction during
 * file uploads and ECG analysis. The overlay message can be updated
 * mid-flight (e.g. "Uploading…" → "Analyzing ECG…") without hiding
 * and re-showing the overlay.
 *
 * Usage:
 *   import { showLoader, hideLoader, setLoaderMessage } from './js/components/loader.js';
 *
 *   showLoader('Uploading ECG data...');
 *   setLoaderMessage('Analyzing ECG...');  // update in-flight
 *   hideLoader();
 *
 * Sprint 1, Step 8 of 25.
 */

/** @type {HTMLElement|null} Cached reference to the overlay element */
let loaderEl = null;

/**
 * Creates the loader overlay element on first call and appends it to
 * <body>. Subsequent calls return the cached reference.
 *
 * @returns {HTMLElement}
 */
function ensureLoader() {
  if (loaderEl) return loaderEl;

  loaderEl = document.createElement('div');
  loaderEl.id = 'global-loader';
  loaderEl.className = 'loader-overlay hidden';
  loaderEl.setAttribute('role', 'status');
  loaderEl.setAttribute('aria-live', 'polite');
  loaderEl.setAttribute('aria-label', 'Loading');

  loaderEl.innerHTML = `
    <div class="loader-content">
      <div class="ecg-pulse" aria-hidden="true">
        <span></span><span></span><span></span><span></span><span></span>
      </div>
      <div class="loader-spinner" aria-hidden="true"></div>
      <p class="loader-message" id="loader-message">Loading...</p>
    </div>
  `;

  document.body.appendChild(loaderEl);
  return loaderEl;
}

/**
 * Show the loading overlay with an optional message.
 * Safe to call multiple times — idempotent.
 *
 * @param {string} [message='Loading...']
 */
export function showLoader(message = 'Loading...') {
  const el = ensureLoader();
  setLoaderMessage(message);
  el.classList.remove('hidden');
}

/**
 * Hide the loading overlay.
 * Safe to call even if the loader was never shown.
 */
export function hideLoader() {
  const el = ensureLoader();
  el.classList.add('hidden');
}

/**
 * Update the message text without toggling visibility.
 * Used when the operation phase changes mid-request
 * (e.g. upload complete → inference running).
 *
 * @param {string} message
 */
export function setLoaderMessage(message) {
  ensureLoader();
  const msgEl = document.getElementById('loader-message');
  if (msgEl) msgEl.textContent = message;
}
