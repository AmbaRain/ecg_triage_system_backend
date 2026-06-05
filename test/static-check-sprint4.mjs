// static-check-sprint4.mjs
// Offline structural checks for Sprint 4 deliverables.
// Usage: node test/static-check-sprint4.mjs

import { readFileSync, existsSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root      = path.resolve(__dirname, '..');

const checks = [];
let currentSuite = null;

function describe(name) { currentSuite = name; }
function pass(name)       { checks.push({ status: 'PASS', suite: currentSuite, name }); }
function fail(name, r)    { checks.push({ status: 'FAIL', suite: currentSuite, name, reason: r }); }
function check(name, cond, reason) { cond ? pass(name) : fail(name, reason); }

function read(rel)   { return readFileSync(path.join(root, rel), 'utf8'); }
function exists(rel) { return existsSync(path.join(root, rel)); }

// ══════════════════════════════════════════════════════════════════════════════
// js/components/patient-card.js
// ══════════════════════════════════════════════════════════════════════════════
describe('patient-card.js');
const pc = read('js/components/patient-card.js');

check('file exists',                               exists('js/components/patient-card.js'),              'file not found');
check('exports createPatientCard',                 pc.includes('export function createPatientCard'),     'createPatientCard not exported');
check('exports createPatientCardSkeletons',        pc.includes('export function createPatientCardSkeletons'), 'createPatientCardSkeletons not exported');
check('builds <a> element (HTMLAnchorElement)',     pc.includes("createElement('a')"),                   '<a> element not created');
check('uses .patient-card class',                  pc.includes("'patient-card'"),                       '.patient-card class missing');
check('uses .patient-card__avatar',                pc.includes('patient-card__avatar'),                 '.patient-card__avatar missing');
check('uses .patient-card__name',                  pc.includes('patient-card__name'),                   '.patient-card__name missing');
check('uses .patient-card__id',                    pc.includes('patient-card__id'),                     '.patient-card__id missing');
check('uses .patient-card__badge',                 pc.includes('patient-card__badge'),                  '.patient-card__badge missing');
check('selected variant class',                    pc.includes('patient-card--selected'),               '.patient-card--selected missing');
check('getInitials helper defined',                pc.includes('function getInitials'),                 'getInitials() missing');
check('fmtDate helper defined',                    pc.includes('function fmtDate'),                     'fmtDate() missing');
check('skeleton uses createDocumentFragment',      pc.includes('createDocumentFragment'),               'createDocumentFragment not used');
check('href links to /patient.html',               pc.includes('/patient.html?patient_id='),            '/patient.html href not built');
check('aria-label on card',                        pc.includes('aria-label'),                           'aria-label missing');
check('prediction_count in badge',                 pc.includes('prediction_count'),                     'prediction_count not used');

// ══════════════════════════════════════════════════════════════════════════════
// js/patients.js
// ══════════════════════════════════════════════════════════════════════════════
describe('patients.js');
const pj = read('js/patients.js');

check('file exists',                          exists('js/patients.js'),                        'file not found');
check('exports initPatientsPage',             pj.includes('export function initPatientsPage'), 'initPatientsPage not exported');
check('imports CONFIG',                       pj.includes("from './config.js'"),               'config.js not imported');
check('imports API',                          pj.includes("from './api-adapter.js'"),          'api-adapter not imported');
check('imports setState',                     pj.includes("from './state.js'"),               'state.js not imported');
check('imports navigateTo',                   pj.includes("from './router.js'"),              'router.js not imported');
check('imports showToast',                    pj.includes("from './components/toast.js'"),    'toast.js not imported');
check('imports patient-card skeletons',       pj.includes("from './components/patient-card.js'"), 'patient-card.js not imported');
check('calls API.getPatients()',              pj.includes('API.getPatients('),               'API.getPatients not called');
check('CONFIG.PATIENTS_PER_PAGE used',        pj.includes('CONFIG.PATIENTS_PER_PAGE'),        'PATIENTS_PER_PAGE not used');
check('debounce on search (debounceTimer)',   pj.includes('_debounceTimer'),                  'search debounce missing');
check('renderRows function',                  pj.includes('function renderRows'),             'renderRows not defined');
check('renderPagination function',            pj.includes('function renderPagination'),       'renderPagination not defined');
check('pagination: prev button wired',        pj.includes('btn-page-prev'),                   '#btn-page-prev not referenced');
check('pagination: next button wired',        pj.includes('btn-page-next'),                   '#btn-page-next not referenced');
check('page-buttons container',              pj.includes('page-buttons'),                    '#page-buttons not referenced');
check('navigateTo called for row click',     pj.includes('navigateTo('),                    'navigateTo not called');
check('empty state shown',                   pj.includes('patients-empty'),                  '#patients-empty not handled');
check('window.history.replaceState',         pj.includes('replaceState'),                   'URL sync via replaceState missing');
check('setState patientList',                pj.includes("setState('patientList'"),          "setState('patientList') not called");
check('getQueryParam used for seed',         pj.includes('getQueryParam('),                 'getQueryParam not used');

// ══════════════════════════════════════════════════════════════════════════════
// patients.html
// ══════════════════════════════════════════════════════════════════════════════
describe('patients.html');
const ph = read('patients.html');

check('file exists',                              exists('patients.html'),                          'file not found');
check('<title> contains Patients',                ph.includes('Patients'),                          'Patients in title missing');
check('#app-shell exists',                        ph.includes('id="app-shell"'),                    '#app-shell missing');
check('#nav-container exists',                    ph.includes('id="nav-container"'),               '#nav-container missing');
check('#patients-search input',                   ph.includes('id="patients-search"'),              '#patients-search missing');
check('#patients-loading skeleton container',     ph.includes('id="patients-loading"'),             '#patients-loading missing');
check('#patients-table-wrap',                     ph.includes('id="patients-table-wrap"'),          '#patients-table-wrap missing');
check('#patients-tbody',                          ph.includes('id="patients-tbody"'),               '#patients-tbody missing');
check('#patients-empty state',                    ph.includes('id="patients-empty"'),               '#patients-empty missing');
check('#btn-page-prev button',                    ph.includes('id="btn-page-prev"'),               '#btn-page-prev missing');
check('#btn-page-next button',                    ph.includes('id="btn-page-next"'),               '#btn-page-next missing');
check('#page-buttons container',                  ph.includes('id="page-buttons"'),                '#page-buttons missing');
check('#pagination-info span',                    ph.includes('id="pagination-info"'),              '#pagination-info missing');
check('#btn-new-ecg links to upload.html',        ph.includes('upload.html'),                       'Upload link missing');
check('calls requireAuth()',                      ph.includes('requireAuth'),                       'requireAuth not called');
check('imports initPatientsPage',                 ph.includes('initPatientsPage'),                  'initPatientsPage not imported');
check('imports injectNav',                        ph.includes('injectNav'),                         'injectNav not imported');
check('<meta name="description">',                ph.includes('name="description"'),                'meta description missing');
check('.data-table table element',                ph.includes('class="data-table"'),                '.data-table missing');
check('table has 5 column headers',              (ph.match(/<th/g) || []).length >= 5,             'Expected ≥5 <th> columns');
check('aria-label on table',                      ph.includes('aria-label="Registered patients"'), 'table aria-label missing');

// ══════════════════════════════════════════════════════════════════════════════
// patient.html
// ══════════════════════════════════════════════════════════════════════════════
describe('patient.html');
const pd = read('patient.html');

check('file exists',                                exists('patient.html'),                              'file not found');
check('<title> contains Patient Record',            pd.includes('Patient Record'),                       'title missing Patient Record');
check('#app-shell exists',                          pd.includes('id="app-shell"'),                       '#app-shell missing');
check('#nav-container exists',                      pd.includes('id="nav-container"'),                  '#nav-container missing');
check('#patient-profile-header',                    pd.includes('id="patient-profile-header"'),          '#patient-profile-header missing');
check('#profile-avatar',                            pd.includes('id="profile-avatar"'),                  '#profile-avatar missing');
check('#profile-name',                              pd.includes('id="profile-name"'),                    '#profile-name missing');
check('#profile-fields',                            pd.includes('id="profile-fields"'),                  '#profile-fields missing');
check('#stat-total-predictions',                    pd.includes('id="stat-total-predictions"'),          '#stat-total-predictions missing');
check('#stat-last-prediction',                      pd.includes('id="stat-last-prediction"'),            '#stat-last-prediction missing');
check('#stat-patient-id',                           pd.includes('id="stat-patient-id"'),                 '#stat-patient-id missing');
check('#predictions-loading skeleton',              pd.includes('id="predictions-loading"'),             '#predictions-loading missing');
check('#predictions-list container',                pd.includes('id="predictions-list"'),                '#predictions-list missing');
check('#predictions-empty state',                   pd.includes('id="predictions-empty"'),               '#predictions-empty missing');
check('#predictions-count-badge',                   pd.includes('id="predictions-count-badge"'),         '#predictions-count-badge missing');
check('#waveform-container',                        pd.includes('id="waveform-container"'),              '#waveform-container missing');
check('#waveform-replay-label',                     pd.includes('id="waveform-replay-label"'),           '#waveform-replay-label missing');
check('#waveform-replay-panel',                     pd.includes('id="waveform-replay-panel"'),           '#waveform-replay-panel missing');
check('#btn-view-full-results link',                pd.includes('id="btn-view-full-results"'),           '#btn-view-full-results missing');
check('#latest-label (sidebar diagnosis)',          pd.includes('id="latest-label"'),                    '#latest-label missing');
check('#latest-confidence-fill',                    pd.includes('id="latest-confidence-fill"'),          '#latest-confidence-fill missing');
check('#latest-confidence-pct',                     pd.includes('id="latest-confidence-pct"'),           '#latest-confidence-pct missing');
check('#btn-view-latest-results',                   pd.includes('id="btn-view-latest-results"'),         '#btn-view-latest-results missing');
check('#info-rows sidebar',                         pd.includes('id="info-rows"'),                       '#info-rows missing');
check('breadcrumb back link',                       pd.includes('id="breadcrumb-patients"'),             '#breadcrumb-patients missing');
check('breadcrumb patient name',                    pd.includes('id="breadcrumb-patient-name"'),         '#breadcrumb-patient-name missing');
check('calls requireAuth()',                        pd.includes('requireAuth'),                          'requireAuth not called');
check('loads plotly.min.js',                        pd.includes('plotly.min.js'),                        'plotly.min.js not loaded');
check('imports renderWaveform',                     pd.includes('renderWaveform'),                       'renderWaveform not imported');
check('imports destroyWaveform',                    pd.includes('destroyWaveform'),                      'destroyWaveform not imported');
check('calls API.getPatient()',                     pd.includes('API.getPatient('),                      'API.getPatient not called');
check('calls API.getPatientPredictions()',          pd.includes('API.getPatientPredictions('),           'API.getPatientPredictions not called');
check('calls getQueryParam for patient_id',         pd.includes("getQueryParam('patient_id')"),          'patient_id param not read');
check('calls setState currentPatient',             pd.includes("setState('currentPatient'"),            "setState('currentPatient') not called");
check('calls injectNav',                            pd.includes('injectNav'),                            'injectNav not called');
check('<meta name="description">',                  pd.includes('name="description"'),                   'meta description missing');
check('skeleton loading state',                     pd.includes('skeleton'),                             'skeleton loading state missing');
check('.patient-detail-layout grid',               pd.includes('patient-detail-layout'),               '.patient-detail-layout missing');
check('.waveform-replay-panel section',            pd.includes('waveform-replay-panel'),               '.waveform-replay-panel missing');

// ══════════════════════════════════════════════════════════════════════════════
// styles.css — Sprint 4 classes
// ══════════════════════════════════════════════════════════════════════════════
describe('styles.css (Sprint 4 additions)');
const css = read('css/styles.css');

check('.patient-card',                    css.includes('.patient-card {'),                   '.patient-card missing');
check('.patient-card__avatar',            css.includes('.patient-card__avatar'),             '.patient-card__avatar missing');
check('.patient-card__name',              css.includes('.patient-card__name'),               '.patient-card__name missing');
check('.patient-card--selected',          css.includes('.patient-card--selected'),           '.patient-card--selected missing');
check('.patients-page',                   css.includes('.patients-page {'),                  '.patients-page missing');
check('.patients-page__title',            css.includes('.patients-page__title'),             '.patients-page__title missing');
check('.patients-empty',                  css.includes('.patients-empty {'),                 '.patients-empty missing');
check('.patient-profile-header',         css.includes('.patient-profile-header {'),         '.patient-profile-header missing');
check('.patient-profile-header__avatar', css.includes('.patient-profile-header__avatar'),   '.patient-profile-header__avatar missing');
check('.patient-field',                   css.includes('.patient-field {'),                  '.patient-field missing');
check('.prediction-history',              css.includes('.prediction-history {'),             '.prediction-history missing');
check('.prediction-history-item',         css.includes('.prediction-history-item {'),        '.prediction-history-item missing');
check('.prediction-history-item__dot',    css.includes('.prediction-history-item__dot'),     '.prediction-history-item__dot missing');
check('.waveform-replay-panel',           css.includes('.waveform-replay-panel {'),          '.waveform-replay-panel missing');
check('.patient-detail-layout',           css.includes('.patient-detail-layout {'),          '.patient-detail-layout missing');
check('.info-row',                        css.includes('.info-row {'),                       '.info-row missing');
check('.stat-grid',                       css.includes('.stat-grid {'),                      '.stat-grid missing');
check('responsive media query 900px',     css.includes('900px'),                            'responsive breakpoint for patient layout missing');

// ── Print ─────────────────────────────────────────────────────────────────────
console.log('\n═══════════════════════════════════════════════════════════');
console.log('  ECG Triage — Sprint 4 Static Check Results');
console.log('═══════════════════════════════════════════════════════════\n');

let prevSuite = '', passed = 0, failed = 0;

for (const c of checks) {
  if (c.suite !== prevSuite) {
    prevSuite = c.suite;
    console.log(`  ${c.suite}`);
  }
  if (c.status === 'PASS') {
    passed++;
    console.log(`    ✓  ${c.name}`);
  } else {
    failed++;
    console.log(`    ✗  ${c.name}`);
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
