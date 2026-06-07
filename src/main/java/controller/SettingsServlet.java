package controller;

import java.io.IOException;

import javax.servlet.ServletException;
import javax.servlet.annotation.WebServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import util.ServletResponseUtil;

@WebServlet(name = "SettingsServlet", urlPatterns = {"/api/settings"})
public class SettingsServlet extends BaseApiServlet {

    private final service.SettingsService settingsService = new service.SettingsService();

    @Override
    protected void doGet(HttpServletRequest request, HttpServletResponse response) throws ServletException, IOException {
        ServletResponseUtil.writeJson(response, HttpServletResponse.SC_OK, settingsService.getSettingsJson());
    }

    @Override
    protected void doPost(HttpServletRequest request, HttpServletResponse response) throws ServletException, IOException {
        java.util.Map<String, String> values = new java.util.HashMap<>();
        values.put("display_name", request.getParameter("display_name"));
        values.put("email", request.getParameter("email"));
        values.put("specialty", request.getParameter("specialty"));
        values.put("hospital", request.getParameter("hospital"));
        values.put("critical_alerts", request.getParameter("critical_alerts"));
        values.put("warning_alerts", request.getParameter("warning_alerts"));
        values.put("patient_updates", request.getParameter("patient_updates"));
        values.put("report_generated", request.getParameter("report_generated"));
        values.put("email_notifications", request.getParameter("email_notifications"));
        values.put("alert_threshold_confidence", request.getParameter("alert_threshold_confidence"));
        values.put("default_upload_format", request.getParameter("default_upload_format"));
        values.put("timezone", request.getParameter("timezone"));
        values.put("items_per_page", request.getParameter("items_per_page"));
        ServletResponseUtil.writeJson(response, HttpServletResponse.SC_OK, settingsService.saveSettings(values));
    }
}