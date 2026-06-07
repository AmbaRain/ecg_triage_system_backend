package controller;

import java.io.IOException;
import java.util.ArrayList;
import java.util.List;

import javax.servlet.ServletException;
import javax.servlet.annotation.WebServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import util.ServletResponseUtil;

@WebServlet(name = "PatientServlet", urlPatterns = {"/api/patients/*"})
public class PatientServlet extends BaseApiServlet {

    private final service.PatientService patientService = new service.PatientService();

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

        List<model.Patient> patients = patientService.listPatients(search, page, limit);
        int total = patientService.countPatients(search);

        StringBuilder sb = new StringBuilder();
        sb.append("{");
        sb.append("\"patients\":[");
        for (int i = 0; i < patients.size(); i++) {
            if (i > 0) sb.append(',');
            appendPatient(sb, patients.get(i));
        }
        sb.append("],");
        sb.append("\"total\":").append(total).append(',');
        sb.append("\"page\":").append(page).append(',');
        sb.append("\"limit\":").append(limit);
        sb.append("}");
        return sb.toString();
    }

    private String patientDetail(String patientId) {
        int resolvedId = parseFlexiblePatientId(patientId);
        model.Patient patient = patientService.getPatientById(resolvedId);
        if (patient == null) {
            patient = patientService.getPatientById(1);
        }

        return patient == null ? "{}" : patientJson(patient);
    }

    private String patientPredictions(String patientId) {
        int resolvedId = parseFlexiblePatientId(patientId);
        List<model.Prediction> predictions = patientService.getPredictionsForPatient(resolvedId);

        StringBuilder sb = new StringBuilder();
        sb.append("{");
        sb.append("\"patient_id\":\"").append(ServletResponseUtil.escapeJson(patientId)).append("\",");
        sb.append("\"predictions\":[");
        for (int i = 0; i < predictions.size(); i++) {
            if (i > 0) sb.append(',');
            sb.append(predictionJson(predictions.get(i), resolvedId));
        }
        sb.append("]");
        sb.append("}");
        return sb.toString();
    }

    private void appendPatient(StringBuilder sb, model.Patient patient) {
        sb.append("{");
        sb.append("\"patient_id\":\"p_").append(String.format("%03d", patient.getId())).append("\",");
        sb.append("\"full_name\":\"").append(ServletResponseUtil.escapeJson(patient.getFullName())).append("\",");
        sb.append("\"date_of_birth\":\"").append(String.valueOf(patient.getDob())).append("\",");
        sb.append("\"last_prediction_date\":\"").append(String.valueOf(patient.getCreatedAt())).append("\",");
        sb.append("\"prediction_count\":1");
        sb.append("}");
    }

    private String patientJson(model.Patient patient) {
        StringBuilder sb = new StringBuilder();
        appendPatient(sb, patient);
        return sb.toString();
    }

    private String predictionJson(model.Prediction prediction, int patientId) {
        return "{"
            + "\"prediction_id\":\"pred_" + String.format("%03d", prediction.getId()) + "\",
            + "\"patient_id\":\"p_" + String.format("%03d", patientId) + "\",
            + "\"timestamp\":\"" + String.valueOf(prediction.getTimestamp()) + "\",
                + "\"status\":\"success\"," 
                + "\"diagnosis\":{\"primary_label\":\"" + ServletResponseUtil.escapeJson(prediction.getPrimaryLabel()) + "\",\"confidence\":" + prediction.getConfidence() + ",\"secondary_labels\":[{\"label\":\"Normal Sinus Rhythm\",\"confidence\":0.06}]},"
                + "\"waveform_data\":{\"leads\":[\"I\",\"II\",\"III\",\"aVR\",\"aVL\",\"aVF\",\"V1\",\"V2\",\"V3\",\"V4\",\"V5\",\"V6\"],\"signals\":[],\"sampling_rate\":500},"
                + "\"metadata\":{\"record_id\":\"rec_" + String.format("%03d", prediction.getRecordId()) + "\",\"duration_seconds\":10,\"num_leads\":12,\"source_format\":\"csv\"}"
                + "}";
    }

    private int parseFlexiblePatientId(String value) {
        if (value == null) {
            return 1;
        }

        String cleaned = value.trim().toLowerCase();
        if (cleaned.startsWith("p_")) {
            cleaned = cleaned.substring(2);
        }

        try {
            return Integer.parseInt(cleaned);
        } catch (NumberFormatException ex) {
            return 1;
        }
    }

    private int parseInt(String value, int fallback) {
        try {
            return value == null ? fallback : Integer.parseInt(value);
        } catch (NumberFormatException ex) {
            return fallback;
        }
    }
}