package controller;

import java.io.IOException;
import javax.servlet.ServletException;
import javax.servlet.annotation.WebServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import util.ServletResponseUtil;

@WebServlet(name = "AlertsServlet", urlPatterns = {"/api/alerts/*"})
public class AlertsServlet extends BaseApiServlet {

    private final service.AlertsService alertsService = new service.AlertsService();

    @Override
    protected void doGet(HttpServletRequest request, HttpServletResponse response) throws ServletException, IOException {
        String pathInfo = request.getPathInfo();
        if (pathInfo != null && pathInfo.endsWith("/summary")) {
            ServletResponseUtil.writeJson(response, HttpServletResponse.SC_OK, alertsService.summary());
            return;
        }

        ServletResponseUtil.writeJson(response, HttpServletResponse.SC_OK,
                alertsService.listAlerts(request.getParameter("severity"), parseInt(request.getParameter("page"), 1),
                        parseInt(request.getParameter("limit"), 20)));
    }

    @Override
    protected void doPost(HttpServletRequest request, HttpServletResponse response) throws ServletException, IOException {
        String pathInfo = request.getPathInfo();
        if ("/dismiss".equals(pathInfo)) {
            ServletResponseUtil.writeJson(response, HttpServletResponse.SC_OK,
                alertsService.dismiss(request.getParameter("alert_id")));
            return;
        }

        ServletResponseUtil.writeJson(response, HttpServletResponse.SC_NOT_FOUND,
                "{\"error\":\"Unknown alerts route\"}");
    }

    private int parseInt(String value, int fallback) {
        try {
            return value == null ? fallback : Integer.parseInt(value);
        } catch (NumberFormatException ex) {
            return fallback;
        }
    }
}