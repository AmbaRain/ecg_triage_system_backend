package controller;

import java.io.IOException;

import javax.servlet.ServletException;
import javax.servlet.annotation.WebServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import util.ServletResponseUtil;

@WebServlet(name = "DashboardServlet", urlPatterns = {"/api/dashboard"})
public class DashboardServlet extends BaseApiServlet {

    private final service.DashboardService dashboardService = new service.DashboardService();

    @Override
    protected void doGet(HttpServletRequest request, HttpServletResponse response) throws ServletException, IOException {
        service.DashboardService.DashboardSummary summary = dashboardService.getSummary();
        ServletResponseUtil.writeJson(response, HttpServletResponse.SC_OK, toJson(summary));
    }

    private String toJson(service.DashboardService.DashboardSummary summary) {
        StringBuilder sb = new StringBuilder();
        sb.append("{");
        sb.append("\"totalPatients\":").append(summary.getTotalPatients()).append(',');
        sb.append("\"totalUploads\":").append(summary.getTotalUploads()).append(',');
        sb.append("\"totalPredictions\":").append(summary.getTotalPredictions()).append(',');
        sb.append("\"recentActivity\":[");

        java.util.List<service.DashboardService.ActivityItem> items = summary.getRecentActivity();
        for (int i = 0; i < items.size(); i++) {
            if (i > 0) {
                sb.append(',');
            }
            service.DashboardService.ActivityItem item = items.get(i);
            sb.append("{")
                    .append("\"type\":\"").append(ServletResponseUtil.escapeJson(item.getType())).append("\",")
                    .append("\"label\":\"").append(ServletResponseUtil.escapeJson(item.getLabel())).append("\",")
                    .append("\"timestamp\":\"").append(ServletResponseUtil.escapeJson(item.getTimestamp())).append("\"")
                    .append("}");
        }
        sb.append("]");
        sb.append("}");
        return sb.toString();
    }
}