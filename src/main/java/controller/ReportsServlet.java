package controller;

import java.io.IOException;
import java.util.HashMap;
import java.util.Map;

import javax.servlet.ServletException;
import javax.servlet.annotation.WebServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import util.ServletResponseUtil;

@WebServlet(name = "ReportsServlet", urlPatterns = {"/api/reports/*"})
public class ReportsServlet extends BaseApiServlet {

    private final service.ReportsService reportsService = new service.ReportsService();

    @Override
    protected void doGet(HttpServletRequest request, HttpServletResponse response) throws ServletException, IOException {
        String pathInfo = request.getPathInfo();
        if (pathInfo != null && pathInfo.endsWith("/summary")) {
            ServletResponseUtil.writeJson(response, HttpServletResponse.SC_OK, reportsService.summary());
            return;
        }

        if (pathInfo != null && pathInfo.endsWith("/export")) {
            String reportId = extractId(pathInfo, "/export");
            ServletResponseUtil.writeText(response, HttpServletResponse.SC_OK, "text/csv",
                reportsService.exportReport(reportId));
            return;
        }

        if (pathInfo != null && !pathInfo.isBlank() && !"/".equals(pathInfo)) {
            ServletResponseUtil.writeText(response, HttpServletResponse.SC_OK, "text/csv",
                reportsService.exportReports(request.getParameter("from"), request.getParameter("to")));
            return;
        }

        ServletResponseUtil.writeJson(response, HttpServletResponse.SC_OK,
            reportsService.listReports(request.getParameter("from"), request.getParameter("to"),
                parseInt(request.getParameter("page"), 1), parseInt(request.getParameter("limit"), 20)));
    }

    @Override
    protected void doPost(HttpServletRequest request, HttpServletResponse response) throws ServletException, IOException {
        Map<String, String> values = new HashMap<>();
        values.put("patient_id", request.getParameter("patient_id"));
        values.put("prediction_id", request.getParameter("prediction_id"));
        values.put("report_title", request.getParameter("report_title"));
        values.put("report_type", request.getParameter("report_type"));
        values.put("diagnosis_label", request.getParameter("diagnosis_label"));
        values.put("summary", request.getParameter("summary"));
        values.put("upload_format", request.getParameter("upload_format"));
        ServletResponseUtil.writeJson(response, HttpServletResponse.SC_OK, reportsService.createReport(values));
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