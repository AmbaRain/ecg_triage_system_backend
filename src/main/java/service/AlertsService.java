package service;

import java.util.ArrayList;
import java.util.List;

/**
 * Alerts business logic.
 *
 * The service owns the in-memory fallback dataset and the JSON assembly for the
 * alert endpoints so the servlet can stay focused on HTTP concerns only.
 */
public class AlertsService {

    private static final List<String[]> ALERTS = new ArrayList<>();

    static {
        ALERTS.add(new String[] {"alert_001", "pred_001", "p_001", "Amaka Adeyemi", "critical", "High-Confidence Atrial Fibrillation", "Atrial Fibrillation", "0.97", "2026-06-07T09:12:00Z", "unreviewed"});
        ALERTS.add(new String[] {"alert_002", "pred_002", "p_002", "Chidi Okonkwo", "warning", "Left Bundle Branch Block Detected", "Left Bundle Branch Block", "0.82", "2026-06-07T09:05:00Z", "unreviewed"});
        ALERTS.add(new String[] {"alert_003", "pred_003", "p_003", "Fatima Al-Rashid", "info", "Routine ECG Review", "Normal Sinus Rhythm", "0.67", "2026-06-07T08:45:00Z", "reviewed"});
    }

    public String listAlerts(String severity, int page, int limit) {
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
            if (i > start) {
                sb.append(',');
            }
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

    public String summary() {
        return "{\"unreviewed_count\":2}";
    }

    public String dismiss(String alertId) {
        return "{\"success\":true,\"alert_id\":\"" + escape(alertId) + "\"}";
    }

    private void appendAlert(StringBuilder sb, String[] alert) {
        sb.append("{");
        sb.append("\"alert_id\":\"").append(escape(alert[0])).append("\",");
        sb.append("\"prediction_id\":\"").append(escape(alert[1])).append("\",");
        sb.append("\"patient_id\":\"").append(escape(alert[2])).append("\",");
        sb.append("\"patient_name\":\"").append(escape(alert[3])).append("\",");
        sb.append("\"severity\":\"").append(escape(alert[4])).append("\",");
        sb.append("\"title\":\"").append(escape(alert[5])).append("\",");
        sb.append("\"diagnosis_label\":\"").append(escape(alert[6])).append("\",");
        sb.append("\"confidence\":").append(alert[7]).append(',');
        sb.append("\"timestamp\":\"").append(escape(alert[8])).append("\",");
        sb.append("\"status\":\"").append(escape(alert[9])).append("\"");
        sb.append("}");
    }

    private String escape(String value) {
        return value == null ? "" : value.replace("\\", "\\\\").replace("\"", "\\\"");
    }
}
