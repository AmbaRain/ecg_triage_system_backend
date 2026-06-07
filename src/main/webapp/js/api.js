/**
 * api.js
 * ECG Triage — Real Backend API Client
 *
 * Mirrors the mock-api.js surface so api-adapter.js can switch between
 * mock and servlet-backed implementations without changing callers.
 */

import { CONFIG } from "./config.js";

const BASE_URL = CONFIG.API_BASE_URL.replace(/\/$/, "");

function buildUrl(path, params = {}) {
  const url = new URL(path, BASE_URL + "/");
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      url.searchParams.set(key, String(value));
    }
  });
  return url.toString();
}

async function parseError(response) {
  try {
    const data = await response.clone().json();
    return (
      data.message ||
      data.error ||
      `Request failed with status ${response.status}`
    );
  } catch {
    return `Request failed with status ${response.status}`;
  }
}

async function requestJson(path, options = {}) {
  const response = await fetch(buildUrl(path, options.query), {
    credentials: "include",
    ...options,
    headers: {
      ...(options.body && !(options.body instanceof FormData)
        ? { "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8" }
        : {}),
      ...(options.headers || {}),
    },
  });

  if (!response.ok) {
    throw { status: response.status, message: await parseError(response) };
  }

  return response.json();
}

async function requestBlob(path, options = {}) {
  const response = await fetch(buildUrl(path, options.query), {
    credentials: "include",
    ...options,
    headers: options.headers || {},
  });

  if (!response.ok) {
    throw { status: response.status, message: await parseError(response) };
  }

  return response.blob();
}

function toFormBody(payload = {}) {
  const form = new URLSearchParams();
  Object.entries(payload).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      form.set(key, String(value));
    }
  });
  return form;
}

export async function login(username, password) {
  return requestJson("/auth/login", {
    method: "POST",
    body: toFormBody({ username, password }),
  });
}

export async function logout() {
  return requestJson("/auth/logout", {
    method: "POST",
    body: toFormBody({}),
  });
}

export async function getMe() {
  return requestJson("/auth/me", { method: "GET" });
}

export async function uploadECGcsv(csvFile, patientId) {
  const form = new FormData();
  form.set("file", csvFile);
  form.set("patient_id", patientId);
  form.set("format", "csv");

  return requestJson("/ecg/upload", {
    method: "POST",
    body: form,
  });
}

export async function uploadECGwfdb(datFile, heaFile, patientId) {
  const form = new FormData();
  form.set("dat_file", datFile);
  form.set("hea_file", heaFile);
  form.set("patient_id", patientId);
  form.set("format", "wfdb");

  return requestJson("/ecg/upload", {
    method: "POST",
    body: form,
  });
}

export async function getPrediction(predictionId) {
  return requestJson(`/predictions/${encodeURIComponent(predictionId)}`, {
    method: "GET",
  });
}

export async function getPatients({ page = 1, limit = 20, search = "" } = {}) {
  return requestJson("/patients", {
    method: "GET",
    query: { page, limit, search },
  });
}

export async function getPatient(patientId) {
  return requestJson(`/patients/${encodeURIComponent(patientId)}`, {
    method: "GET",
  });
}

export async function getPatientPredictions(patientId) {
  return requestJson(`/patients/${encodeURIComponent(patientId)}/predictions`, {
    method: "GET",
  });
}

export async function getAlerts({ page = 1, limit = 20, severity = "" } = {}) {
  return requestJson("/alerts", {
    method: "GET",
    query: { page, limit, severity },
  });
}

export async function dismissAlert(alertId) {
  return requestJson("/alerts/dismiss", {
    method: "POST",
    body: toFormBody({ alert_id: alertId }),
  });
}

export async function getReports({
  page = 1,
  limit = 20,
  from = "",
  to = "",
} = {}) {
  return requestJson("/reports", {
    method: "GET",
    query: { page, limit, from, to },
  });
}

export async function getReportsSummary() {
  return requestJson("/reports/summary", { method: "GET" });
}

export async function exportReport(reportId) {
  return requestBlob(`/reports/${encodeURIComponent(reportId)}/export`, {
    method: "GET",
  });
}

export async function exportReportsBulk({ from = "", to = "" } = {}) {
  return requestBlob("/reports/export", {
    method: "GET",
    query: { from, to },
  });
}

export async function createReport(body) {
  return requestJson("/reports", {
    method: "POST",
    body: toFormBody(body),
  });
}

export async function getSettings() {
  return requestJson("/settings", { method: "GET" });
}

export async function saveSettings(preferences) {
  return requestJson("/settings", {
    method: "POST",
    body: toFormBody(preferences),
  });
}
