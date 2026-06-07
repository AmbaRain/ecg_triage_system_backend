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

@WebServlet(name = "AlertsServlet", urlPatterns = {"/api/alerts/*"})
public class AlertsServlet extends HttpServlet {

    private static final List<String[]> ALERTS = new ArrayList<>();

    static {
        ALERTS.add(new String[] {"alert_001", "pred_001", "p_001", "Amaka Adeyemi", "critical", "High-Confidence Atrial Fibrillation", "Atrial Fibrillation", "0.97", "2026-06-07T09:12:00Z", "unreviewed"});
        ALERTS.add(new String[] {"alert_002", "pred_002", "p_002", "Chidi Okonkwo", "warning", "Left Bundle Branch Block Detected", "Left Bundle Branch Block", "0.82", "2026-06-07T09:05:00Z", "unreviewed"});
        ALERTS.add(new String[] {"alert_003", "pred_003", "p_003", "Fatima Al-Rashid", "info", "Routine ECG Review", "Normal Sinus Rhythm", "0.67", "2026-06-07T08:45:00Z", "reviewed"});
    }

    @Override
    protected void doGet(HttpServletRequest request, HttpServletResponse response) throws ServletException, IOException {
        String pathInfo = request.getPathInfo();
        if (pathInfo != null && pathInfo.endsWith("/summary")) {
            ServletResponseUtil.writeJson(response, HttpServletResponse.SC_OK, summary());
            return;
        }

        ServletResponseUtil.writeJson(response, HttpServletResponse.SC_OK, listAlerts(request));
    }

    @Override
    protected void doPost(HttpServletRequest request, HttpServletResponse response) throws ServletException, IOException {
        String pathInfo = request.getPathInfo();
        if ("/dismiss".equals(pathInfo)) {
            ServletResponseUtil.writeJson(response, HttpServletResponse.SC_OK,
                    "{\"success\":true,\"alert_id\":\"" + ServletResponseUtil.escapeJson(request.getParameter("alert_id")) + "\"}");
            return;
        }

        ServletResponseUtil.writeJson(response, HttpServletResponse.SC_NOT_FOUND,
                "{\"error\":\"Unknown alerts route\"}");
    }

    private String listAlerts(HttpServletRequest request) {
        String severity = request.getParameter("severity");
        int page = parseInt(request.getParameter("page"), 1);
        int limit = parseInt(request.getParameter("limit"), 20);

        List<String[]> filtered = new ArrayList<>();
        for (String[] alert : ALERTS) {
            if (severity == null || severity.isBlank() || severity.equals(alert[4])) {
                filtered.add(alert);
            }
        }

        int total = filtered.size();
        int start = Math.max(0, (page - 1) * limit);
        int end = Math.min(total, start + limit);
        int unreviewed = 0;
        for (String[] alert : ALERTS) {
            if ("unreviewed".equals(alert[9])) {
                unreviewed++;
            }
        }

        StringBuilder sb = new StringBuilder();
        sb.append("{");
        sb.append("\"alerts\":[");
        for (int i = start; i < end; i++) {
            if (i > start) sb.append(',');
            appendAlert(sb, filtered.get(i));
        }
        sb.append("],");
        sb.append("\"total\":").append(total).append(',');
        sb.append("\"unreviewed_count\":").append(unreviewed).append(',');
        sb.append("\"page\":").append(page).append(',');
        sb.append("\"limit\":").append(limit);
        sb.append("}");
        return sb.toString();
    }

    private String summary() {
        return "{\"unreviewed_count\":2}";
    }

    private void appendAlert(StringBuilder sb, String[] alert) {
        sb.append("{");
        sb.append("\"alert_id\":\"").append(ServletResponseUtil.escapeJson(alert[0])).append("\",");
        sb.append("\"prediction_id\":\"").append(ServletResponseUtil.escapeJson(alert[1])).append("\",");
        sb.append("\"patient_id\":\"").append(ServletResponseUtil.escapeJson(alert[2])).append("\",");
        sb.append("\"patient_name\":\"").append(ServletResponseUtil.escapeJson(alert[3])).append("\",");
        sb.append("\"severity\":\"").append(ServletResponseUtil.escapeJson(alert[4])).append("\",");
        sb.append("\"title\":\"").append(ServletResponseUtil.escapeJson(alert[5])).append("\",");
        sb.append("\"diagnosis_label\":\"").append(ServletResponseUtil.escapeJson(alert[6])).append("\",");
        sb.append("\"confidence\":").append(alert[7]).append(',');
        sb.append("\"timestamp\":\"").append(ServletResponseUtil.escapeJson(alert[8])).append("\",");
        sb.append("\"status\":\"").append(ServletResponseUtil.escapeJson(alert[9])).append("\"");
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