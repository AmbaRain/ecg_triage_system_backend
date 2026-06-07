package controller;

import java.io.IOException;

import javax.servlet.ServletException;
import javax.servlet.annotation.WebServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import util.ServletResponseUtil;

@WebServlet(name = "PredictionServlet", urlPatterns = {"/api/predictions/*"})
public class PredictionServlet extends BaseApiServlet {

    private final service.PredictionService predictionService = new service.PredictionService();

    @Override
    protected void doGet(HttpServletRequest request, HttpServletResponse response) throws ServletException, IOException {
        String predictionId = extractPathId(request.getPathInfo());

        if (predictionId == null) {
            ServletResponseUtil.writeJson(response, HttpServletResponse.SC_BAD_REQUEST,
                    "{\"error\":\"prediction id is required\"}");
            return;
        }

        int resolvedId = parseFlexibleId(predictionId);
        model.Prediction prediction = predictionService.getPredictionById(resolvedId);
        ServletResponseUtil.writeJson(response, HttpServletResponse.SC_OK, predictionJson(prediction, resolvedId, "csv"));
    }

    private String extractPathId(String pathInfo) {
        if (pathInfo == null || pathInfo.isBlank()) {
            return null;
        }

        String candidate = pathInfo.startsWith("/") ? pathInfo.substring(1) : pathInfo;
        candidate = candidate.trim();
        return candidate.isEmpty() ? null : candidate;
    }

    private String predictionJson(model.Prediction prediction, int patientId, String sourceFormat) {
        return "{"
            + "\"prediction_id\":\"pred_" + String.format("%03d", prediction.getId()) + "\",
            + "\"patient_id\":\"p_" + String.format("%03d", patientId) + "\",
            + "\"timestamp\":\"" + String.valueOf(prediction.getTimestamp()) + "\",
                + "\"status\":\"success\"," 
                + "\"diagnosis\":{"
            + "\"primary_label\":\"" + ServletResponseUtil.escapeJson(prediction.getPrimaryLabel()) + "\",
                + "\"confidence\":" + prediction.getConfidence() + ","
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
                + "\"source_format\":\"" + ServletResponseUtil.escapeJson(sourceFormat) + "\""
                + "}"
                + "}";
    }

    private int parseFlexibleId(String value) {
        if (value == null) {
            return 1;
        }

        String cleaned = value.trim().toLowerCase();
        if (cleaned.startsWith("pred_")) {
            cleaned = cleaned.substring(5);
        }

        try {
            return Integer.parseInt(cleaned);
        } catch (NumberFormatException ex) {
            return 1;
        }
    }
}