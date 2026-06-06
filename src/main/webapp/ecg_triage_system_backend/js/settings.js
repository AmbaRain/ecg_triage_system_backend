/**
 * settings.js
 * ECG Triage — Settings Controller
 * Sprint 5, Step 7 of 9.
 *
 * Tabbed settings page: Account | Notifications | Security
 * Preferences persist to backend via API.saveSettings().
 */

import { API } from './api-adapter.js';
import { requireAuth } from './auth.js';
import { showToast } from './components/toast.js';

if (!requireAuth()) throw new Error('Unauthenticated');

// ─── Tab switching ────────────────────────────────────────────────────────────
const tabs    = document.querySelectorAll('.settings-tab');
const panels  = document.querySelectorAll('.settings-panel-section');

function activateTab(tabId) {
  tabs.forEach(t => {
    const isActive = t.dataset.tab === tabId;
    t.classList.toggle('settings-tab--active', isActive);
    t.setAttribute('aria-selected', isActive);
  });
  panels.forEach(p => {
    p.style.display = p.id === `panel-${tabId}` ? '' : 'none';
  });
}

tabs.forEach(t => {
  t.addEventListener('click', () => activateTab(t.dataset.tab));
});

// ─── Helpers ──────────────────────────────────────────────────────────────────
function setVal(id, val) {
  const el = document.getElementById(id);
  if (!el) return;
  if (el.type === 'checkbox') el.checked = Boolean(val);
  else el.value = val ?? '';
}

function getVal(id) {
  const el = document.getElementById(id);
  if (!el) return undefined;
  if (el.type === 'checkbox') return el.checked;
  if (el.type === 'number') return parseFloat(el.value);
  return el.value;
}

function setSaveStatus(msg, persist = false) {
  const el = document.getElementById('settings-save-status');
  if (!el) return;
  el.textContent = msg;
  if (!persist) setTimeout(() => { el.textContent = ''; }, 3000);
}

// ─── Load settings ────────────────────────────────────────────────────────────
async function loadSettings() {
  try {
    const s = await API.getSettings();

    // Account tab
    setVal('setting-display-name', s.display_name);
    setVal('setting-email',        s.email);
    setVal('setting-specialty',    s.specialty);
    setVal('setting-hospital',     s.hospital);

    // Update avatar initials
    const avatarEl = document.getElementById('settings-avatar-initials');
    if (avatarEl && s.display_name) {
      const parts = s.display_name.replace(/^Dr\.\s*/i, '').trim().split(' ');
      avatarEl.textContent = parts.map(p => p[0]).slice(0, 2).join('').toUpperCase();
    }
    const nameEl = document.getElementById('settings-avatar-name');
    if (nameEl) nameEl.textContent = s.display_name || '';
    const roleEl = document.getElementById('settings-avatar-role');
    if (roleEl) roleEl.textContent = s.specialty || 'Clinician';

    // Notifications tab
    setVal('setting-critical-alerts',       s.critical_alerts);
    setVal('setting-warning-alerts',        s.warning_alerts);
    setVal('setting-patient-updates',       s.patient_updates);
    setVal('setting-report-generated',      s.report_generated);
    setVal('setting-email-notifications',   s.email_notifications);
    setVal('setting-alert-threshold',       s.alert_threshold_confidence);
    checkThresholdWarning(s.alert_threshold_confidence);

  } catch (err) {
    showToast(err?.message || 'Failed to load settings. Defaults shown.', 'error');
  }
}

// ─── Threshold HIPAA warning ──────────────────────────────────────────────────
function checkThresholdWarning(value) {
  const warnEl = document.getElementById('threshold-warning');
  if (!warnEl) return;
  warnEl.classList.toggle('hidden', parseFloat(value) >= 0.80);
}

document.getElementById('setting-alert-threshold')?.addEventListener('input', e => {
  checkThresholdWarning(e.target.value);
});

// ─── Account form save ────────────────────────────────────────────────────────
document.getElementById('account-form')?.addEventListener('submit', async e => {
  e.preventDefault();
  const btn = e.target.querySelector('[type="submit"]');
  btn.disabled = true;
  setSaveStatus('Saving…', true);
  try {
    await API.saveSettings({
      display_name: getVal('setting-display-name'),
      email:        getVal('setting-email'),
      specialty:    getVal('setting-specialty'),
      hospital:     getVal('setting-hospital'),
    });
    setSaveStatus('✓ Saved');
    showToast('Account settings saved.', 'success');
  } catch (err) {
    setSaveStatus('');
    showToast(err?.message || 'Failed to save settings.', 'error');
  } finally {
    btn.disabled = false;
  }
});

// ─── Notifications form save ──────────────────────────────────────────────────
document.getElementById('notifications-form')?.addEventListener('submit', async e => {
  e.preventDefault();
  const threshold = getVal('setting-alert-threshold');
  if (threshold < 0.50 || threshold > 1.00) {
    showToast('Alert threshold must be between 0.50 and 1.00.', 'error'); return;
  }
  const btn = e.target.querySelector('[type="submit"]');
  btn.disabled = true;
  setSaveStatus('Saving…', true);
  try {
    await API.saveSettings({
      critical_alerts:             getVal('setting-critical-alerts'),
      warning_alerts:              getVal('setting-warning-alerts'),
      patient_updates:             getVal('setting-patient-updates'),
      report_generated:            getVal('setting-report-generated'),
      email_notifications:         getVal('setting-email-notifications'),
      alert_threshold_confidence:  threshold,
    });
    setSaveStatus('✓ Saved');
    showToast('Notification settings saved.', 'success');
  } catch (err) {
    setSaveStatus('');
    showToast(err?.message || 'Failed to save settings.', 'error');
  } finally {
    btn.disabled = false;
  }
});

// ─── Init ─────────────────────────────────────────────────────────────────────
activateTab('account');
loadSettings();
