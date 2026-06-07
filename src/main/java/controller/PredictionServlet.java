package controller;

import java.io.IOException;

import javax.servlet.ServletException;
import javax.servlet.annotation.WebServlet;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import util.ServletResponseUtil;

@WebServlet(name = "PredictionServlet", urlPatterns = {"/api/predictions/*"})
public class PredictionServlet extends HttpServlet {

    @Override
    protected void doGet(HttpServletRequest request, HttpServletResponse response) throws ServletException, IOException {
        String predictionId = extractPathId(request.getPathInfo());

        if (predictionId == null) {
            ServletResponseUtil.writeJson(response, HttpServletResponse.SC_BAD_REQUEST,
                    "{\"error\":\"prediction id is required\"}");
            return;
        }

        ServletResponseUtil.writeJson(response, HttpServletResponse.SC_OK, mockPrediction(predictionId, "p_001", "csv"));
    }

    private String extractPathId(String pathInfo) {
        if (pathInfo == null || pathInfo.isBlank()) {
            return null;
        }

        String candidate = pathInfo.startsWith("/") ? pathInfo.substring(1) : pathInfo;
        candidate = candidate.trim();
        return candidate.isEmpty() ? null : candidate;
    }

    private String mockPrediction(String predictionId, String patientId, String sourceFormat) {
        return "{"
                + "\"prediction_id\":\"" + ServletResponseUtil.escapeJson(predictionId) + "\"," 
                + "\"patient_id\":\"" + ServletResponseUtil.escapeJson(patientId) + "\"," 
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
                + "\"source_format\":\"" + ServletResponseUtil.escapeJson(sourceFormat) + "\""
                + "}"
                + "}";
    }
}