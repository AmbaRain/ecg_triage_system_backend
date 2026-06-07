package service;

import java.util.Map;

/**
 * User settings business logic.
 *
 * The controller passes raw request values in, and this service owns the
 * persisted in-memory settings representation until the database-backed version
 * is wired up.
 */
public class SettingsService {

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

    public String getSettingsJson() {
        return settingsJson;
    }

    public String saveSettings(Map<String, String> values) {
        settingsJson = update(settingsJson, values);
        return "{\"success\":true,\"settings\":" + settingsJson + "}";
    }

    private String update(String current, Map<String, String> values) {
        String updated = current;
        updated = replace(updated, "display_name", value(values, "display_name"));
        updated = replace(updated, "email", value(values, "email"));
        updated = replace(updated, "specialty", value(values, "specialty"));
        updated = replace(updated, "hospital", value(values, "hospital"));
        updated = replace(updated, "critical_alerts", value(values, "critical_alerts"));
        updated = replace(updated, "warning_alerts", value(values, "warning_alerts"));
        updated = replace(updated, "patient_updates", value(values, "patient_updates"));
        updated = replace(updated, "report_generated", value(values, "report_generated"));
        updated = replace(updated, "email_notifications", value(values, "email_notifications"));
        updated = replace(updated, "alert_threshold_confidence", value(values, "alert_threshold_confidence"));
        updated = replace(updated, "default_upload_format", value(values, "default_upload_format"));
        updated = replace(updated, "timezone", value(values, "timezone"));
        updated = replace(updated, "items_per_page", value(values, "items_per_page"));
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
            return json.substring(0, start) + escape(value) + json.substring(end);
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

    private String value(Map<String, String> values, String key) {
        return values == null ? null : values.get(key);
    }

    private String escape(String value) {
        return value == null ? "" : value.replace("\\", "\\\\").replace("\"", "\\\"");
    }
}
