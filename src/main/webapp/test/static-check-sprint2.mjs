// static-check-sprint2.mjs
// Runs offline structural checks for Sprint 2 files (no browser required).
// Usage: node test/static-check-sprint2.mjs

import { readFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');

const checks = [];
function pass(name)               { checks.push({ status: 'PASS', name }); }
function fail(name, reason)       { checks.push({ status: 'FAIL', name, reason }); }
function check(name, cond, reason){ cond ? pass(name) : fail(name, reason); }

function read(rel) {
  return readFileSync(path.join(root, rel), 'utf8');
}

// ── auth.js ──────────────────────────────────────────────────────────────────
const auth = read('js/auth.js');
check('auth.js · exports redirector object',               auth.includes('export const redirector'),                 'redirector not exported');
check('auth.js · redirector.navigate(url) method',         auth.includes('navigate(url)'),                           'navigate method missing on redirector');
check('auth.js · requireAuth uses redirector.navigate',    auth.includes("redirector.navigate('/login.html')"),       'requireAuth still uses window.location directly');
check('auth.js · redirectIfAuthenticated uses redirector', auth.includes("redirector.navigate('/dashboard.html')"),   'redirectIfAuthenticated still uses window.location');
check('auth.js · logout uses redirector',                  auth.includes('logout') && auth.includes("redirector.navigate('/login.html')"), 'logout still uses window.location');
check('auth.js · exports getAuthToken',                    auth.includes('export function getAuthToken'),             'getAuthToken not exported');
check('auth.js · exports getCurrentUser',                  auth.includes('export function getCurrentUser'),           'getCurrentUser not exported');
check('auth.js · exports isAuthenticated',                 auth.includes('export function isAuthenticated'),          'isAuthenticated not exported');
check('auth.js · exports login',                           auth.includes('export async function login'),              'login not exported');
check('auth.js · exports logout',                          auth.includes('export async function logout'),             'logout not exported');
check('auth.js · exports requireAuth',                     auth.includes('export function requireAuth'),              'requireAuth not exported');
check('auth.js · exports redirectIfAuthenticated',         auth.includes('export function redirectIfAuthenticated'),  'redirectIfAuthenticated not exported');
check('auth.js · exports getCurrentUserRole',              auth.includes('export function getCurrentUserRole'),       'getCurrentUserRole not exported');
check('auth.js · exports hasRole (always returns true)',   auth.includes('export function hasRole') && auth.includes('return true'),  'hasRole not present or not returning true');
check('auth.js · getCurrentUser catches bad JSON',         auth.includes('} catch'),                                  'no try/catch in getCurrentUser');
// window.location.href = url is allowed exactly once — inside redirector.navigate(). 
// Strip that one sanctioned occurrence, then check no others remain.
const authWithoutNavigateBody = auth.replace(/navigate\(url\)\s*\{[^}]*window\.location\.href[^}]*\}/, '');
check('auth.js · no raw window.location.href outside redirector.navigate', !authWithoutNavigateBody.includes('window.location.href ='), 'raw window.location.href found outside of redirector.navigate — use redirector.navigate()');

// ── router.js ─────────────────────────────────────────────────────────────────
const router = read('js/router.js');
check('router.js · exports getQueryParam',     router.includes('export function getQueryParam'),     'getQueryParam not exported');
check('router.js · exports getAllQueryParams', router.includes('export function getAllQueryParams'),  'getAllQueryParams not exported');
check('router.js · exports buildUrl',          router.includes('export function buildUrl'),          'buildUrl not exported');
check('router.js · exports currentPage',       router.includes('export function currentPage'),       'currentPage not exported');
check('router.js · buildUrl omits null',       router.includes('v !== null'),                        'null values not excluded in buildUrl');
check('router.js · buildUrl omits undefined',  router.includes('v !== undefined'),                   'undefined values not excluded in buildUrl');

// ── login.html ────────────────────────────────────────────────────────────────
const login = read('login.html');
check('login.html · <title> contains "Sign In"',             login.includes('Sign In'),                                         'title missing "Sign In"');
check('login.html · id="login-form"',                        login.includes('id="login-form"'),                                 '#login-form missing');
check('login.html · id="input-username"',                    login.includes('id="input-username"'),                             '#input-username missing');
check('login.html · id="input-password"',                    login.includes('id="input-password"'),                             '#input-password missing');
check('login.html · id="toggle-password"',                   login.includes('id="toggle-password"'),                            '#toggle-password missing');
check('login.html · id="btn-signin"',                        login.includes('id="btn-signin"'),                                 '#btn-signin missing');
check('login.html · id="login-error"',                       login.includes('id="login-error"'),                                '#login-error missing');
check('login.html · .demo-hint present',                     login.includes('demo-hint'),                                       '.demo-hint missing');
check('login.html · imports auth.js',                        login.includes('auth.js'),                                         'auth.js import missing');
check('login.html · calls redirectIfAuthenticated()',        login.includes('redirectIfAuthenticated'),                          'redirectIfAuthenticated not called');
check('login.html · <meta name="description"> present',     login.includes('name="description"'),                              'meta description missing');
check('login.html · id="icon-eye-closed"',                   login.includes('id="icon-eye-closed"'),                            '#icon-eye-closed missing');
check('login.html · id="icon-eye-open"',                     login.includes('id="icon-eye-open"'),                              '#icon-eye-open missing');
check('login.html · .hero-ecg__path SVG present',            login.includes('hero-ecg__path'),                                  '.hero-ecg__path missing');
check('login.html · at least 3 .hero-stat elements',         (login.match(/hero-stat/g) || []).length >= 3,                     'fewer than 3 .hero-stat elements');

// ── dashboard.html ────────────────────────────────────────────────────────────
const dash = read('dashboard.html');
check('dashboard.html · <title> contains "Dashboard"',       dash.includes('Dashboard'),                                        'Dashboard missing from title');
check('dashboard.html · id="app-shell"',                     dash.includes('id="app-shell"'),                                   '#app-shell missing');
check('dashboard.html · id="nav-container"',                 dash.includes('id="nav-container"'),                               '#nav-container missing');
check('dashboard.html · id="stat-total-patients"',           dash.includes('id="stat-total-patients"'),                         '#stat-total-patients missing');
check('dashboard.html · id="stat-predictions"',              dash.includes('id="stat-predictions"'),                            '#stat-predictions missing');
check('dashboard.html · id="patients-tbody"',                dash.includes('id="patients-tbody"'),                              '#patients-tbody missing');
check('dashboard.html · id="patients-loading"',              dash.includes('id="patients-loading"'),                            '#patients-loading missing');
check('dashboard.html · #btn-quick-upload → upload.html',    dash.includes('id="btn-quick-upload"') && dash.includes('upload.html'), '#btn-quick-upload or upload.html link missing');
check('dashboard.html · id="global-search"',                 dash.includes('id="global-search"'),                               '#global-search missing');
check('dashboard.html · id="topbar-avatar"',                 dash.includes('id="topbar-avatar"'),                               '#topbar-avatar missing');
check('dashboard.html · id="dashboard-date"',                dash.includes('id="dashboard-date"'),                              '#dashboard-date missing');
check('dashboard.html · calls requireAuth()',                 dash.includes('requireAuth'),                                      'requireAuth not called');
check('dashboard.html · imports auth.js',                    dash.includes('auth.js'),                                          'auth.js import missing');
check('dashboard.html · imports nav.js',                     dash.includes('nav.js'),                                           'nav.js import missing');
check('dashboard.html · <meta name="description"> present',  dash.includes('name="description"'),                               'meta description missing');

// ── 404.html ──────────────────────────────────────────────────────────────────
const notFound = read('404.html');
check('404.html · <title> contains "404"',                   notFound.includes('404'),                                          'title missing 404');
check('404.html · "Signal lost" text present',               notFound.includes('Signal lost'),                                  '"Signal lost" text missing');
check('404.html · id="btn-dashboard"',                       notFound.includes('id="btn-dashboard"'),                           '#btn-dashboard missing');
check('404.html · id="btn-back"',                            notFound.includes('id="btn-back"'),                                '#btn-back missing');
check('404.html · .flatline-path SVG element',               notFound.includes('flatline-path'),                                '.flatline-path missing');
check('404.html · .error-ecg__label contains "404"',         notFound.includes('error-ecg__label') && notFound.includes('404'), '.error-ecg__label or 404 text missing');
check('404.html · no ES module imports (static page)',       !(notFound.includes('type="module"') && notFound.includes('import ')), '404.html should be static — ES module import found');
check('404.html · #btn-dashboard href → dashboard.html',     notFound.includes('dashboard.html'),                               '#btn-dashboard href missing dashboard.html');

// ── index.html ────────────────────────────────────────────────────────────────
const index = read('index.html');
check('index.html · imports auth.js',                        index.includes('auth.js'),                                         'auth.js import missing');
check('index.html · calls isAuthenticated()',                index.includes('isAuthenticated'),                                  'isAuthenticated not called');
check('index.html · contains login.html redirect',           index.includes('login.html'),                                      'login.html redirect missing');
check('index.html · contains dashboard.html redirect',       index.includes('dashboard.html'),                                  'dashboard.html redirect missing');
check('index.html · uses location.replace()',                index.includes('replace'),                                         'window.location.replace not used');

// ── test/test-sprint2.html ────────────────────────────────────────────────────
const harness = read('test/test-sprint2.html');
check('test-sprint2.html · imports redirector',              harness.includes('redirector'),                                    'redirector not imported in test harness');
check('test-sprint2.html · stubs redirector.navigate',       harness.includes('redirector.navigate ='),                         'redirector.navigate not stubbed in test harness');

// ── Print results ─────────────────────────────────────────────────────────────
console.log('\n═══════════════════════════════════════════════════════════');
console.log('  ECG Triage — Sprint 2 Static Check Results');
console.log('═══════════════════════════════════════════════════════════\n');

let currentFile = '';
let passed = 0, failed = 0;

for (const c of checks) {
  const [file] = c.name.split(' · ');
  if (file !== currentFile) {
    currentFile = file;
    console.log(`  ${file}`);
  }
  if (c.status === 'PASS') {
    passed++;
    console.log(`    ✓  ${c.name.split(' · ')[1]}`);
  } else {
    failed++;
    console.log(`    ✗  ${c.name.split(' · ')[1]}`);
    console.log(`       → ${c.reason}`);
  }
}

console.log('\n───────────────────────────────────────────────────────────');
const total = passed + failed;
if (failed === 0) {
  console.log(`  ✓ All ${total} checks passed`);
} else {
  console.log(`  ${passed}/${total} passed   |   ${failed} FAILED`);
}
console.log('───────────────────────────────────────────────────────────\n');

process.exit(failed > 0 ? 1 : 0);
