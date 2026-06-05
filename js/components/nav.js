/**
 * components/nav.js
 * ECG Triage — Shared Navigation Injector
 *
 * Injects the sidebar HTML into every protected page and highlights the
 * active link based on window.location.pathname.
 *
 * Usage (in every protected page <body>, first child):
 *   <div id="nav-container"></div>
 *   <script type="module">
 *     import { injectNav } from './js/components/nav.js';
 *     injectNav(document.getElementById('nav-container'));
 *   </script>
 *
 * Sprint 1, Step 6 of 25.
 */

/** Navigation link definitions — drives the sidebar render */
const NAV_LINKS = [
  {
    href: '/dashboard.html',
    label: 'Dashboard',
    icon: `<svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
      <path d="M2 10a8 8 0 1116 0A8 8 0 012 10zm6-1a1 1 0 00-1 1v3a1 1 0 102 0v-3a1 1 0 00-1-1zm4-3a1 1 0 10-2 0v6a1 1 0 102 0V6z"/>
    </svg>`,
  },
  {
    href: '/upload.html',
    label: 'Upload ECG',
    icon: `<svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
      <path fill-rule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clip-rule="evenodd"/>
    </svg>`,
  },
  {
    href: '/patients.html',
    label: 'Patients',
    icon: `<svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
      <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z"/>
    </svg>`,
  },
  {
    href: '/alerts.html',
    label: 'Alerts',
    id: 'nav-link-alerts',
    icon: `<svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
      <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z"/>
    </svg>`,
  },
  {
    href: '/reports.html',
    label: 'Reports',
    icon: `<svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
      <path fill-rule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clip-rule="evenodd"/>
    </svg>`,
  },
  {
    href: '/settings.html',
    label: 'Settings',
    icon: `<svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
      <path fill-rule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clip-rule="evenodd"/>
    </svg>`,
  },
];

/**
 * Determines whether a nav link href matches the current page.
 * Uses an exact pathname match so /patients.html doesn't also
 * activate on /patient.html.
 *
 * @param {string} href
 * @returns {boolean}
 */
function isActive(href) {
  return window.location.pathname === href ||
         window.location.pathname.endsWith(href);
}

/**
 * Builds the sidebar HTML string.
 * @returns {string}
 */
function buildSidebarHTML() {
  const links = NAV_LINKS.map(link => `
    <a
      href="${link.href}"
      class="nav-item${isActive(link.href) ? ' active' : ''}"
      aria-current="${isActive(link.href) ? 'page' : 'false'}"
      id="nav-link-${link.label.toLowerCase().replace(/\s+/g, '-')}"
    >
      <span class="nav-item__icon">${link.icon}</span>
      <span class="nav-item__label">${link.label}</span>
    </a>
  `).join('');

  return `
    <aside class="sidebar" id="sidebar" role="navigation" aria-label="Main navigation">

      <!-- Logo -->
      <div class="sidebar__logo">
        <svg class="sidebar__logo-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
          <polyline points="2 12 6 12 8 4 10 20 12 12 14 16 16 12 22 12"/>
        </svg>
        <div class="sidebar__logo-text-group">
          <div class="sidebar__logo-text">ECG Triage</div>
          <div class="sidebar__logo-sub">AI Diagnostic Platform</div>
        </div>
      </div>

      <!-- Main nav links -->
      <nav class="sidebar__nav" aria-label="Page navigation">
        ${links}
      </nav>

      <!-- Logout at bottom -->
      <div class="sidebar__bottom">
        <button
          class="nav-item"
          id="nav-logout-btn"
          type="button"
          aria-label="Sign out"
        >
          <span class="nav-item__icon">
            <svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
              <path fill-rule="evenodd" d="M3 3a1 1 0 00-1 1v12a1 1 0 102 0V4a1 1 0 00-1-1zm10.293 9.293a1 1 0 001.414 1.414l3-3a1 1 0 000-1.414l-3-3a1 1 0 10-1.414 1.414L14.586 9H7a1 1 0 100 2h7.586l-1.293 1.293z" clip-rule="evenodd"/>
            </svg>
          </span>
          <span class="nav-item__label">Sign Out</span>
        </button>
      </div>

    </aside>
  `;
}

/**
 * Injects the sidebar into the given container element and wires up
 * the logout button.
 *
 * @param {HTMLElement} container
 */
export async function injectNav(container) {
  if (!container) return;

  container.innerHTML = buildSidebarHTML();

  // Wire logout — import auth lazily to avoid a circular dependency
  // between nav.js and auth.js during early Sprint 1 loading.
  const logoutBtn = document.getElementById('nav-logout-btn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', async () => {
      try {
        const { logout } = await import('../auth.js');
        await logout();
      } catch {
        // auth.js does not exist yet in Sprint 1; graceful fallback
        sessionStorage.clear();
        window.location.href = '/login.html';
      }
    });
  }

  // ── Alerts unreviewed-count badge (Sprint 5) ──────────────────────────────
  // Fire-and-forget: never blocks nav render, never throws.
  (async () => {
    try {
      const { API } = await import('../api-adapter.js');
      const data = await API.getAlerts({ limit: 1 });
      if (data.unreviewed_count > 0) {
        const alertsLink = document.getElementById('nav-link-alerts');
        if (alertsLink) {
          const badge = document.createElement('span');
          badge.className = 'nav-alert-badge';
          badge.textContent = data.unreviewed_count;
          alertsLink.style.position = 'relative';
          alertsLink.appendChild(badge);
        }
      }
    } catch { /* silently ignore */ }
  })();
}
