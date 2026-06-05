/**
 * alerts.js
 * ECG Triage — Alerts List Controller
 * Sprint 5, Step 3 of 9.
 */

import { API } from './api-adapter.js';
import { requireAuth } from './auth.js';
import { showToast } from './components/toast.js';

if (!requireAuth()) throw new Error('Unauthenticated');

// ─── State ───────────────────────────────────────────────────────────────────
let currentFilter = 'all'; // 'all' | 'critical' | 'warning' | 'info' | 'reviewed'

// ─── DOM refs ────────────────────────────────────────────────────────────────
const listEl      = document.getElementById('alerts-list');
const emptyEl     = document.getElementById('alerts-empty');
const loadingEl   = document.getElementById('alerts-loading');
const countEl     = document.getElementById('unreviewed-count');

// ─── Severity config ─────────────────────────────────────────────────────────
const SEVERITY_CONFIG = {
  critical: { modifier: 'alert-card--critical', iconMod: 'alert-card__icon--critical', badgeMod: 'alert-severity-badge--critical', pillMod: 'alert-pill--critical', label: 'Critical', icon: '⚡' },
  warning:  { modifier: 'alert-card--warning',  iconMod: 'alert-card__icon--warning',  badgeMod: 'alert-severity-badge--warning',  pillMod: 'alert-pill--warning',  label: 'Warning',  icon: '⚠' },
  info:     { modifier: 'alert-card--info',     iconMod: 'alert-card__icon--info',     badgeMod: 'alert-severity-badge--info',     pillMod: '',                     label: 'Info',     icon: 'ℹ' },
  reviewed: { modifier: 'alert-card--reviewed', iconMod: 'alert-card__icon--reviewed', badgeMod: '',                               pillMod: '',                     label: '',         icon: '✓' },
};

// ─── Helpers ─────────────────────────────────────────────────────────────────
function formatRelativeTime(iso) {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60)         return 'Just now';
  if (diff < 3600)       return `${Math.floor(diff / 60)} min ago`;
  if (diff < 86400)      return `${Math.floor(diff / 3600)}h ago`;
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

function buildUrl(base, params = {}) {
  const u = new URL(base, window.location.origin);
  Object.entries(params).forEach(([k, v]) => v && u.searchParams.set(k, v));
  return u.pathname + u.search;
}

// ─── Render ───────────────────────────────────────────────────────────────────
function renderAlertCard(alert) {
  const isReviewed = alert.status === 'reviewed';
  const cfg = SEVERITY_CONFIG[isReviewed ? 'reviewed' : alert.severity] || SEVERITY_CONFIG.info;
  const conf = Math.round(alert.confidence * 100);

  const card = document.createElement('div');
  card.className = `alert-card ${cfg.modifier}`;
  card.setAttribute('data-alert-id', alert.alert_id);

  card.innerHTML = `
    <div class="alert-card__icon ${cfg.iconMod}" aria-hidden="true">${cfg.icon}</div>
    <div class="alert-card__body">
      <div class="alert-card__row1">
        <h3 class="alert-card__title">${escapeHtml(alert.title)}</h3>
        ${!isReviewed ? `<span class="alert-severity-badge ${cfg.badgeMod}">${cfg.label}</span>` : ''}
        ${isReviewed ? `<span class="alert-resolved-badge">✓ Resolved</span>` : ''}
      </div>
      <p class="alert-card__patient">${escapeHtml(alert.patient_name)}</p>
      <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">
        <span class="alert-pill ${cfg.pillMod}">${escapeHtml(alert.diagnosis_label)}</span>
        <span class="alert-pill" style="background:var(--color-surface-2)">${conf}% confidence</span>
        <span class="alert-time">${formatRelativeTime(alert.timestamp)}</span>
      </div>
    </div>
    <div class="alert-card__actions">
      <a href="${buildUrl('/results.html', { prediction_id: alert.prediction_id })}"
         class="btn btn--ghost btn--sm" id="view-ecg-${alert.alert_id}">View ECG</a>
      ${!isReviewed
        ? `<button class="btn btn--primary btn--sm js-dismiss-alert"
               data-alert-id="${alert.alert_id}"
               id="resolve-${alert.alert_id}"
               aria-label="Resolve alert for ${escapeHtml(alert.patient_name)}">Resolve</button>`
        : ''}
    </div>
  `;
  return card;
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// ─── Load ─────────────────────────────────────────────────────────────────────
async function loadAlerts() {
  loadingEl.style.display = '';
  emptyEl.style.display   = 'none';
  listEl.innerHTML         = '';

  try {
    // For 'all' and 'reviewed' we fetch everything and filter client-side
    const severity = (currentFilter === 'all' || currentFilter === 'reviewed') ? '' : currentFilter;
    const data = await API.getAlerts({ severity });

    let alerts = data.alerts;
    if (currentFilter === 'reviewed') {
      alerts = alerts.filter(a => a.status === 'reviewed');
    } else if (currentFilter !== 'all') {
      alerts = alerts.filter(a => a.status !== 'reviewed');
    }

    // Update unreviewed badge
    if (countEl) {
      if (data.unreviewed_count > 0) {
        countEl.textContent = `${data.unreviewed_count} unreviewed`;
        countEl.style.display = '';
      } else {
        countEl.style.display = 'none';
      }
    }

    loadingEl.style.display = 'none';

    if (alerts.length === 0) {
      emptyEl.style.display = '';
      return;
    }

    const frag = document.createDocumentFragment();
    alerts.forEach(a => frag.appendChild(renderAlertCard(a)));
    listEl.appendChild(frag);

  } catch (err) {
    loadingEl.style.display = 'none';
    showToast(err?.message || 'Failed to load alerts.', 'error');
  }
}

// ─── Handle dismiss ───────────────────────────────────────────────────────────
async function handleDismiss(alertId) {
  try {
    await API.dismissAlert(alertId);
    showToast('Alert marked as resolved.', 'success');
    loadAlerts();
  } catch (err) {
    showToast(err?.message || 'Failed to resolve alert.', 'error');
  }
}

// ─── Wire filter buttons ──────────────────────────────────────────────────────
document.querySelectorAll('.filter-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('filter-btn--active'));
    btn.classList.add('filter-btn--active');
    currentFilter = btn.dataset.filter;
    loadAlerts();
  });
});

// ─── Wire dismiss (event delegation) ─────────────────────────────────────────
listEl.addEventListener('click', e => {
  const btn = e.target.closest('.js-dismiss-alert');
  if (!btn) return;
  handleDismiss(btn.dataset.alertId);
});

// ─── Init ─────────────────────────────────────────────────────────────────────
loadAlerts();
