package controller;

import java.io.IOException;

import javax.servlet.ServletException;
import javax.servlet.annotation.MultipartConfig;
import javax.servlet.annotation.WebServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import javax.servlet.http.Part;

import util.ServletResponseUtil;

@MultipartConfig
@WebServlet(name = "UploadServlet", urlPatterns = {"/api/ecg/upload"})
public class UploadServlet extends BaseApiServlet {

    private final service.PredictionService predictionService = new service.PredictionService();

    private static final String PREDICTION_JSON = "{"
            + "\"prediction_id\":\"pred_001\"," 
            + "\"patient_id\":\"p_001\"," 
            + "\"timestamp\":\"2026-06-07T09:15:00Z\"," 
            + "\"status\":\"success\"," 
            + "\"diagnosis\":{"
            + "\"primary_label\":\"Atrial Fibrillation\"," 
            + "\"confidence\":0.91," 
            + "\"secondary_labels\":["
            + "{\"label\":\"Normal Sinus Rhythm\",\"confidence\":0.06},"
            + "{\"label\":\"Left Bundle Branch Block\",\"confidence\":0.03}"
            + "]"
            + "},"
            + "\"waveform_data\":{"
            + "\"leads\":[\"I\",\"II\",\"III\",\"aVR\",\"aVL\",\"aVF\",\"V1\",\"V2\",\"V3\",\"V4\",\"V5\",\"V6\"],"
            + "\"signals\":[],"
            + "\"sampling_rate\":500"
            + "},"
            + "\"metadata\":{"
            + "\"record_id\":\"rec_001\"," 
            + "\"duration_seconds\":10," 
            + "\"num_leads\":12," 
            + "\"source_format\":\"csv\""
            + "}"
            + "}";

    @Override
    protected void doPost(HttpServletRequest request, HttpServletResponse response) throws ServletException, IOException {
        request.setCharacterEncoding("UTF-8");

        try {
            Part filePart = request.getPart("file");
            Part datPart = request.getPart("dat_file");
            Part heaPart = request.getPart("hea_file");

            if ((filePart == null || filePart.getSize() <= 0L) && (datPart == null || heaPart == null)) {
                ServletResponseUtil.writeJson(response, HttpServletResponse.SC_BAD_REQUEST,
                        "{\"error\":\"ECG file is required\"}");
                return;
            }
        } catch (IllegalStateException ex) {
            ServletResponseUtil.writeJson(response, HttpServletResponse.SC_BAD_REQUEST,
                    "{\"error\":\"upload exceeds allowed size\"}");
            return;
        }

        String format = request.getParameter("format");
        String patientId = request.getParameter("patient_id");

        try {
            service.PredictionService.PredictionAnalysisResult result = predictionService.analyzeUpload(
                    request.getPart("file"), request.getPart("dat_file"), request.getPart("hea_file"), format,
                    parseFlexiblePatientId(patientId));
            ServletResponseUtil.writeJson(response, HttpServletResponse.SC_OK, toJson(result));
        } catch (InterruptedException ex) {
            Thread.currentThread().interrupt();
            ServletResponseUtil.writeJson(response, HttpServletResponse.SC_INTERNAL_SERVER_ERROR,
                    "{\"error\":\"prediction interrupted\"}");
        }
    }

    private String toJson(service.PredictionService.PredictionAnalysisResult result) {
        model.Prediction prediction = result.getPrediction();
        StringBuilder sb = new StringBuilder();
        sb.append("{");
        sb.append("\"prediction_id\":\"pred_").append(String.format("%03d", prediction.getId())).append("\",");
        sb.append("\"patient_id\":\"p_").append(String.format("%03d", prediction.getPatientId())).append("\",");
        sb.append("\"timestamp\":\"").append(String.valueOf(prediction.getTimestamp())).append("\",");
        sb.append("\"status\":\"success\",");
        sb.append("\"diagnosis\":{");
        sb.append("\"primary_label\":\"").append(ServletResponseUtil.escapeJson(result.getPrimaryLabel())).append("\",");
        sb.append("\"confidence\":").append(result.getConfidence()).append(',');
        sb.append("\"secondary_labels\":[");
        java.util.List<service.PredictionService.LabelScore> secondaryLabels = result.getSecondaryLabels();
        for (int i = 0; i < secondaryLabels.size(); i++) {
            if (i > 0) {
                sb.append(',');
            }
            service.PredictionService.LabelScore labelScore = secondaryLabels.get(i);
            sb.append("{")
                    .append("\"label\":\"").append(ServletResponseUtil.escapeJson(labelScore.getLabel())).append("\",")
                    .append("\"confidence\":").append(labelScore.getConfidence())
                    .append("}");
        }
        sb.append("]");
        sb.append("},");
        sb.append("\"waveform_data\":{");
        sb.append("\"leads\":[");
        java.util.List<String> leads = result.getLeads();
        for (int i = 0; i < leads.size(); i++) {
            if (i > 0) {
                sb.append(',');
            }
            sb.append('"').append(ServletResponseUtil.escapeJson(leads.get(i))).append('"');
        }
        sb.append("],\"signals\":[],\"sampling_rate\":").append(result.getSamplingRate());
        sb.append("},");
        sb.append("\"metadata\":{");
        sb.append("\"record_id\":\"rec_").append(String.format("%03d", prediction.getRecordId())).append("\",");
        sb.append("\"duration_seconds\":10,");
        sb.append("\"num_leads\":12,");
        sb.append("\"source_format\":\"").append(ServletResponseUtil.escapeJson(result.getSourceFormat())).append("\"");
        sb.append("},");
        sb.append("\"stored_path\":\"").append(ServletResponseUtil.escapeJson(result.getStoredPath())).append("\"");
        sb.append("}");
        return sb.toString();
    }

    private int parseFlexiblePatientId(String value) {
        if (value == null || value.isBlank()) {
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
}