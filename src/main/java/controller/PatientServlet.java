package controller;

import java.io.IOException;
import java.util.ArrayList;
import java.util.List;

import javax.servlet.ServletException;
import javax.servlet.annotation.WebServlet;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import util.ServletResponseUtil;

@WebServlet(name = "PatientServlet", urlPatterns = {"/api/patients/*"})
public class PatientServlet extends HttpServlet {

    private static final List<String[]> PATIENTS = new ArrayList<>();

    static {
        PATIENTS.add(new String[] {"p_001", "Amaka Adeyemi", "1978-04-12", "2026-06-07T08:50:00Z", "4"});
        PATIENTS.add(new String[] {"p_002", "Chidi Okonkwo", "1981-11-04", "2026-06-06T14:20:00Z", "2"});
        PATIENTS.add(new String[] {"p_003", "Fatima Al-Rashid", "1974-09-19", "2026-06-05T10:05:00Z", "1"});
        PATIENTS.add(new String[] {"p_004", "Priya Nair", "1988-01-23", "2026-06-04T16:15:00Z", "3"});
    }

    @Override
    protected void doGet(HttpServletRequest request, HttpServletResponse response) throws ServletException, IOException {
        String pathInfo = request.getPathInfo();

        if (pathInfo == null || "/".equals(pathInfo)) {
            ServletResponseUtil.writeJson(response, HttpServletResponse.SC_OK, listPatients(request));
            return;
        }

        String patientId = extractPathId(pathInfo);
        if (patientId == null) {
            ServletResponseUtil.writeJson(response, HttpServletResponse.SC_BAD_REQUEST,
                    "{\"error\":\"patient id is required\"}");
            return;
        }

        if (pathInfo.endsWith("/predictions")) {
            ServletResponseUtil.writeJson(response, HttpServletResponse.SC_OK, patientPredictions(patientId));
            return;
        }

        ServletResponseUtil.writeJson(response, HttpServletResponse.SC_OK, patientDetail(patientId));
    }

    private String extractPathId(String pathInfo) {
        String candidate = pathInfo.startsWith("/") ? pathInfo.substring(1) : pathInfo;
        if (candidate.endsWith("/predictions")) {
            candidate = candidate.substring(0, candidate.length() - "/predictions".length());
        }
        candidate = candidate.trim();
        return candidate.isEmpty() ? null : candidate;
    }

    private String listPatients(HttpServletRequest request) {
        String search = request.getParameter("search");
        int page = parseInt(request.getParameter("page"), 1);
        int limit = parseInt(request.getParameter("limit"), 20);

        List<String[]> filtered = new ArrayList<>();
        for (String[] patient : PATIENTS) {
            if (search == null || search.isBlank() || patient[1].toLowerCase().contains(search.toLowerCase())) {
                filtered.add(patient);
            }
        }

        int total = filtered.size();
        int start = Math.max(0, (page - 1) * limit);
        int end = Math.min(total, start + limit);

        StringBuilder sb = new StringBuilder();
        sb.append("{");
        sb.append("\"patients\":[");
        for (int i = start; i < end; i++) {
            if (i > start) sb.append(',');
            appendPatient(sb, filtered.get(i));
        }
        sb.append("],");
        sb.append("\"total\":").append(total).append(',');
        sb.append("\"page\":").append(page).append(',');
        sb.append("\"limit\":").append(limit);
        sb.append("}");
        return sb.toString();
    }

    private String patientDetail(String patientId) {
        String[] patient = findPatient(patientId);
        if (patient == null) {
            patient = PATIENTS.get(0);
        }

        StringBuilder sb = new StringBuilder();
        appendPatient(sb, patient);
        return sb.toString();
    }

    private String patientPredictions(String patientId) {
        return "{"
                + "\"patient_id\":\"" + ServletResponseUtil.escapeJson(patientId) + "\"," 
                + "\"predictions\":["
                + "{"
                + "\"prediction_id\":\"pred_001\"," 
                + "\"patient_id\":\"" + ServletResponseUtil.escapeJson(patientId) + "\"," 
                + "\"timestamp\":\"2026-06-07T09:15:00Z\"," 
                + "\"status\":\"success\"," 
                + "\"diagnosis\":{\"primary_label\":\"Atrial Fibrillation\",\"confidence\":0.91,\"secondary_labels\":[{\"label\":\"Normal Sinus Rhythm\",\"confidence\":0.06}]},"
                + "\"waveform_data\":{\"leads\":[\"I\",\"II\",\"III\",\"aVR\",\"aVL\",\"aVF\",\"V1\",\"V2\",\"V3\",\"V4\",\"V5\",\"V6\"],\"signals\":[],\"sampling_rate\":500},"
                + "\"metadata\":{\"record_id\":\"rec_001\",\"duration_seconds\":10,\"num_leads\":12,\"source_format\":\"csv\"}"
                + "}"
                + "]"
                + "}";
    }

    private String[] findPatient(String patientId) {
        for (String[] patient : PATIENTS) {
            if (patient[0].equals(patientId)) {
                return patient;
            }
        }
        return null;
    }

    private void appendPatient(StringBuilder sb, String[] patient) {
        sb.append("{");
        sb.append("\"patient_id\":\"").append(ServletResponseUtil.escapeJson(patient[0])).append("\",");
        sb.append("\"full_name\":\"").append(ServletResponseUtil.escapeJson(patient[1])).append("\",");
        sb.append("\"date_of_birth\":\"").append(ServletResponseUtil.escapeJson(patient[2])).append("\",");
        sb.append("\"last_prediction_date\":\"").append(ServletResponseUtil.escapeJson(patient[3])).append("\",");
        sb.append("\"prediction_count\":").append(patient[4]);
        sb.append("}");
    }

    private int parseInt(String value, int fallback) {
        try {
            return value == null ? fallback : Integer.parseInt(value);
        } catch (NumberFormatException ex) {
            return fallback;
        }
    }
}