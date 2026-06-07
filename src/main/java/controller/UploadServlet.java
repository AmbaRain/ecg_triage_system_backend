package controller;

import java.io.IOException;

import javax.servlet.ServletException;
import javax.servlet.annotation.MultipartConfig;
import javax.servlet.annotation.WebServlet;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import javax.servlet.http.Part;

import util.ServletResponseUtil;

@MultipartConfig
@WebServlet(name = "UploadServlet", urlPatterns = {"/api/ecg/upload"})
public class UploadServlet extends HttpServlet {

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
        String responseBody = PREDICTION_JSON.replace("\"source_format\":\"csv\"",
                "\"source_format\":\"" + ServletResponseUtil.escapeJson(format == null ? "csv" : format) + "\"");

        ServletResponseUtil.writeJson(response, HttpServletResponse.SC_OK, responseBody);
    }
}