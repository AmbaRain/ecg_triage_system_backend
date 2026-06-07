package controller;

import java.io.IOException;

import javax.servlet.ServletException;
import javax.servlet.annotation.WebServlet;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import util.ServletResponseUtil;

@WebServlet(name = "SettingsServlet", urlPatterns = {"/api/settings"})
public class SettingsServlet extends HttpServlet {

    private static String settingsJson = "{"
            + "\"display_name\":\"Dr. Amaka Adeyemi\"," 
            + "\"email\":\"dr.adeyemi@ecgtriage.hospital.org\"," 
            + "\"specialty\":\"Cardiology\"," 
            + "\"hospital\":\"Lagos University Teaching Hospital\"," 
            + "\"critical_alerts\":true," 
            + "\"warning_alerts\":true," 
            + "\"patient_updates\":true," 
            + "\"report_generated\":false," 
            + "\"email_notifications\":true," 
            + "\"alert_threshold_confidence\":0.85," 
            + "\"default_upload_format\":\"csv\"," 
            + "\"timezone\":\"Africa/Lagos\"," 
            + "\"items_per_page\":20"
            + "}";

    @Override
    protected void doGet(HttpServletRequest request, HttpServletResponse response) throws ServletException, IOException {
        ServletResponseUtil.writeJson(response, HttpServletResponse.SC_OK, settingsJson);
    }

    @Override
    protected void doPost(HttpServletRequest request, HttpServletResponse response) throws ServletException, IOException {
        settingsJson = update(settingsJson, request);
        ServletResponseUtil.writeJson(response, HttpServletResponse.SC_OK,
                "{\"success\":true,\"settings\":" + settingsJson + "}");
    }

    private String update(String current, HttpServletRequest request) {
        String updated = current;
        updated = replace(updated, "display_name", request.getParameter("display_name"));
        updated = replace(updated, "email", request.getParameter("email"));
        updated = replace(updated, "specialty", request.getParameter("specialty"));
        updated = replace(updated, "hospital", request.getParameter("hospital"));
        updated = replace(updated, "critical_alerts", request.getParameter("critical_alerts"));
        updated = replace(updated, "warning_alerts", request.getParameter("warning_alerts"));
        updated = replace(updated, "patient_updates", request.getParameter("patient_updates"));
        updated = replace(updated, "report_generated", request.getParameter("report_generated"));
        updated = replace(updated, "email_notifications", request.getParameter("email_notifications"));
        updated = replace(updated, "alert_threshold_confidence", request.getParameter("alert_threshold_confidence"));
        updated = replace(updated, "default_upload_format", request.getParameter("default_upload_format"));
        updated = replace(updated, "timezone", request.getParameter("timezone"));
        updated = replace(updated, "items_per_page", request.getParameter("items_per_page"));
        return updated;
    }

    private String replace(String json, String key, String value) {
        if (value == null) {
            return json;
        }

        String quoted = "\"" + key + "\":\"";
        String numeric = "\"" + key + "\":";
        int quotedIndex = json.indexOf(quoted);
        if (quotedIndex >= 0) {
            int start = quotedIndex + quoted.length();
            int end = json.indexOf('"', start);
            return json.substring(0, start) + ServletResponseUtil.escapeJson(value) + json.substring(end);
        }

        int numericIndex = json.indexOf(numeric);
        if (numericIndex >= 0) {
            int start = numericIndex + numeric.length();
            int end = start;
            while (end < json.length() && json.charAt(end) != ',' && json.charAt(end) != '}') {
                end++;
            }
            return json.substring(0, start) + value + json.substring(end);
        }

        return json;
    }
}