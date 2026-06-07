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

@WebServlet(name = "ReportsServlet", urlPatterns = {"/api/reports/*"})
public class ReportsServlet extends HttpServlet {

    private static final List<String[]> REPORTS = new ArrayList<>();

    static {
        REPORTS.add(new String[] {"rep_001", "pred_001", "p_001", "Amaka Adeyemi", "Discharge Summary - Amaka Adeyemi", "discharge", "Atrial Fibrillation", "0.91", "Patient discharged in stable condition.", "csv", "2026-06-07T05:00:00Z"});
        REPORTS.add(new String[] {"rep_002", "pred_002", "p_002", "Chidi Okonkwo", "Daily Vitals Report - Chidi Okonkwo", "vitals", "Normal Sinus Rhythm", "0.88", "Vitals within normal range.", "csv", "2026-06-07T03:00:00Z"});
        REPORTS.add(new String[] {"rep_003", "pred_003", "p_003", "Fatima Al-Rashid", "Cardiac Monitoring Report - Fatima Al-Rashid", "monitoring", "Left Bundle Branch Block", "0.82", "Patient shows stable rhythm.", "wfdb", "2026-06-06T22:00:00Z"});
    }

    @Override
    protected void doGet(HttpServletRequest request, HttpServletResponse response) throws ServletException, IOException {
        String pathInfo = request.getPathInfo();
        if (pathInfo != null && pathInfo.endsWith("/summary")) {
            ServletResponseUtil.writeJson(response, HttpServletResponse.SC_OK, summary());
            return;
        }

        if (pathInfo != null && pathInfo.endsWith("/export")) {
            String reportId = extractId(pathInfo, "/export");
            ServletResponseUtil.writeText(response, HttpServletResponse.SC_OK, "text/csv",
                    csvForReport(findReport(reportId)));
            return;
        }

        if (pathInfo != null && !pathInfo.isBlank() && !"/".equals(pathInfo)) {
            ServletResponseUtil.writeText(response, HttpServletResponse.SC_OK, "text/csv", csvForReports());
            return;
        }

        ServletResponseUtil.writeJson(response, HttpServletResponse.SC_OK, listReports(request));
    }

    @Override
    protected void doPost(HttpServletRequest request, HttpServletResponse response) throws ServletException, IOException {
        String reportId = "rep_" + String.format("%03d", REPORTS.size() + 1);
        String patientId = value(request, "patient_id", "p_001");
        String patientName = patientName(patientId);
        String reportTitle = value(request, "report_title", "Generated Report");
        String reportType = value(request, "report_type", "diagnostic");
        String diagnosisLabel = value(request, "diagnosis_label", "Atrial Fibrillation");
        String summary = value(request, "summary", "Generated report summary.");
        String createdAt = "2026-06-07T09:20:00Z";

        REPORTS.add(new String[] {reportId, value(request, "prediction_id", "pred_001"), patientId, patientName, reportTitle, reportType, diagnosisLabel, "0.90", summary, value(request, "upload_format", "csv"), createdAt});

        ServletResponseUtil.writeJson(response, HttpServletResponse.SC_OK,
                "{\"success\":true,\"report\":" + reportJson(REPORTS.get(REPORTS.size() - 1)) + "}");
    }

    private String listReports(HttpServletRequest request) {
        int page = parseInt(request.getParameter("page"), 1);
        int limit = parseInt(request.getParameter("limit"), 20);
        String from = request.getParameter("from");
        String to = request.getParameter("to");

        List<String[]> filtered = new ArrayList<>();
        for (String[] report : REPORTS) {
            if (withinRange(report[10], from, to)) {
                filtered.add(report);
            }
        }

        int total = filtered.size();
        int start = Math.max(0, (page - 1) * limit);
        int end = Math.min(total, start + limit);

        StringBuilder sb = new StringBuilder();
        sb.append("{");
        sb.append("\"reports\":[");
        for (int i = start; i < end; i++) {
            if (i > start) sb.append(',');
            sb.append(reportJson(filtered.get(i)));
        }
        sb.append("],\"total\":").append(total).append(',');
        sb.append("\"page\":").append(page).append(',');
        sb.append("\"limit\":").append(limit);
        sb.append("}");
        return sb.toString();
    }

    private String summary() {
        return "{\"total_predictions\":18,\"predictions_today\":4,\"diagnosis_breakdown\":[{\"label\":\"Atrial Fibrillation\",\"count\":5},{\"label\":\"Normal Sinus Rhythm\",\"count\":4}],\"avg_confidence\":0.88,\"total_reports\":" + REPORTS.size() + "}";
    }

    private String csvForReports() {
        StringBuilder sb = new StringBuilder();
        sb.append("report_id,patient_id,patient_name,report_type,diagnosis_label,confidence,created_at\n");
        for (String[] report : REPORTS) {
            sb.append(report[0]).append(',').append(report[2]).append(',').append(report[3]).append(',')
                    .append(report[5]).append(',').append(report[6]).append(',').append(report[7]).append(',').append(report[10]).append('\n');
        }
        return sb.toString();
    }

    private String csvForReport(String[] report) {
        return "report_id,patient_id,patient_name,report_type,diagnosis_label,confidence,created_at\n"
                + report[0] + "," + report[2] + "," + report[3] + "," + report[5] + "," + report[6] + "," + report[7] + "," + report[10] + "\n";
    }

    private String[] findReport(String reportId) {
        for (String[] report : REPORTS) {
            if (report[0].equals(reportId)) {
                return report;
            }
        }
        return REPORTS.get(0);
    }

    private String reportJson(String[] report) {
        return "{"
                + "\"report_id\":\"" + ServletResponseUtil.escapeJson(report[0]) + "\"," 
                + "\"prediction_id\":\"" + ServletResponseUtil.escapeJson(report[1]) + "\"," 
                + "\"patient_id\":\"" + ServletResponseUtil.escapeJson(report[2]) + "\"," 
                + "\"patient_name\":\"" + ServletResponseUtil.escapeJson(report[3]) + "\"," 
                + "\"report_title\":\"" + ServletResponseUtil.escapeJson(report[4]) + "\"," 
                + "\"report_type\":\"" + ServletResponseUtil.escapeJson(report[5]) + "\"," 
                + "\"diagnosis_label\":\"" + ServletResponseUtil.escapeJson(report[6]) + "\"," 
                + "\"confidence\":" + report[7] + ","
                + "\"summary\":\"" + ServletResponseUtil.escapeJson(report[8]) + "\"," 
                + "\"upload_format\":\"" + ServletResponseUtil.escapeJson(report[9]) + "\"," 
                + "\"created_at\":\"" + ServletResponseUtil.escapeJson(report[10]) + "\""
                + "}";
    }

    private String patientName(String patientId) {
        if ("p_002".equals(patientId)) return "Chidi Okonkwo";
        if ("p_003".equals(patientId)) return "Fatima Al-Rashid";
        if ("p_004".equals(patientId)) return "Priya Nair";
        return "Amaka Adeyemi";
    }

    private String value(HttpServletRequest request, String key, String fallback) {
        String value = request.getParameter(key);
        return value == null || value.isBlank() ? fallback : value;
    }

    private boolean withinRange(String createdAt, String from, String to) {
        return (from == null || from.isBlank() || createdAt.compareTo(from) >= 0)
                && (to == null || to.isBlank() || createdAt.compareTo(to) <= 0);
    }

    private String extractId(String pathInfo, String suffix) {
        String id = pathInfo.substring(1, pathInfo.length() - suffix.length());
        return id.endsWith("/") ? id.substring(0, id.length() - 1) : id;
    }

    private int parseInt(String value, int fallback) {
        try {
            return value == null ? fallback : Integer.parseInt(value);
        } catch (NumberFormatException ex) {
            return fallback;
        }
    }
}