/**
 * components/toast.js
 * ECG Triage — Global Toast Notification System
 *
 * Creates accessible, auto-dismissing toast notifications that slide in
 * from the bottom-right corner. No dependencies.
 *
 * Usage:
 *   import { showToast } from './js/components/toast.js';
 *   showToast('File uploaded successfully.', 'success');
 *   showToast('Invalid file type.', 'error');
 *   showToast('Analysis may take up to 45s.', 'warning');
 *   showToast('12-lead ECG loaded.', 'info');
 *
 * Sprint 1, Step 7 of 25.
 */

/**
 * @typedef {'success'|'error'|'warning'|'info'} ToastType
 */

/**
 * Returns (creating if absent) the persistent toast container element.
 * @returns {HTMLElement}
 */
function getContainer() {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    container.setAttribute('aria-live', 'polite');
    container.setAttribute('aria-atomic', 'false');
    document.body.appendChild(container);
  }
  return container;
}

/**
 * Display a toast notification.
 *
 * @param {string}    message   Text to display. Keep under ~80 characters.
 * @param {ToastType} [type='info']
 * @param {number}    [duration=5000]  Auto-dismiss delay in ms.
 */
export function showToast(message, type = 'info', duration = 5000) {
  const container = getContainer();

  const toast = document.createElement('div');
  toast.className = `toast toast--${type}`;
  toast.setAttribute('role', 'alert');
  toast.setAttribute('aria-live', 'assertive');

  // Icon prefix per severity
  const icons = {
    success: '✓',
    error:   '✕',
    warning: '⚠',
    info:    'ℹ',
  };

  toast.innerHTML = `
    <span class="toast__icon" aria-hidden="true">${icons[type] ?? icons.info}</span>
    <span class="toast__message">${escapeHtml(message)}</span>
    <button class="toast__close" aria-label="Dismiss notification" type="button">×</button>
  `;

  // Dismiss on close button click
  toast.querySelector('.toast__close').addEventListener('click', () => {
    dismiss(toast);
  });

  container.appendChild(toast);

  // Trigger CSS transition on next frame
  requestAnimationFrame(() => {
    requestAnimationFrame(() => toast.classList.add('toast--visible'));
  });

  // Auto-dismiss
  const timer = setTimeout(() => dismiss(toast), duration);

  // Cancel auto-dismiss while user hovers (gives them time to read)
  toast.addEventListener('mouseenter', () => clearTimeout(timer));
  toast.addEventListener('mouseleave', () => {
    setTimeout(() => dismiss(toast), 2000);
  });
}

/**
 * Slides a toast out and removes it from the DOM after the transition.
 * @param {HTMLElement} toast
 */
function dismiss(toast) {
  if (!toast.parentNode) return;
  toast.classList.remove('toast--visible');
  toast.addEventListener('transitionend', () => toast.remove(), { once: true });
}

/**
 * Escapes user-facing message strings to prevent XSS via toast content.
 * @param {string} str
 * @returns {string}
 */
function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
