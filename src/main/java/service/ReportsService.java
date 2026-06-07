package service;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

/**
 * Reports business logic.
 *
 * This keeps the reports controller free from list management, filtering and
 * CSV assembly details.
 */
public class ReportsService {

    private static final List<String[]> REPORTS = new ArrayList<>();

    static {
        REPORTS.add(new String[] {"rep_001", "pred_001", "p_001", "Amaka Adeyemi", "Discharge Summary - Amaka Adeyemi", "discharge", "Atrial Fibrillation", "0.91", "Patient discharged in stable condition.", "csv", "2026-06-07T05:00:00Z"});
        REPORTS.add(new String[] {"rep_002", "pred_002", "p_002", "Chidi Okonkwo", "Daily Vitals Report - Chidi Okonkwo", "vitals", "Normal Sinus Rhythm", "0.88", "Vitals within normal range.", "csv", "2026-06-07T03:00:00Z"});
        REPORTS.add(new String[] {"rep_003", "pred_003", "p_003", "Fatima Al-Rashid", "Cardiac Monitoring Report - Fatima Al-Rashid", "monitoring", "Left Bundle Branch Block", "0.82", "Patient shows stable rhythm.", "wfdb", "2026-06-06T22:00:00Z"});
    }

    public String listReports(String from, String to, int page, int limit) {
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
            if (i > start) {
                sb.append(',');
            }
            sb.append(reportJson(filtered.get(i)));
        }
        sb.append("],\"total\":").append(total).append(',');
        sb.append("\"page\":").append(page).append(',');
        sb.append("\"limit\":").append(limit);
        sb.append("}");
        return sb.toString();
    }

    public String summary() {
        return "{\"total_predictions\":18,\"predictions_today\":4,\"diagnosis_breakdown\":[{\"label\":\"Atrial Fibrillation\",\"count\":5},{\"label\":\"Normal Sinus Rhythm\",\"count\":4}],\"avg_confidence\":0.88,\"total_reports\":" + REPORTS.size() + "}";
    }

    public String createReport(Map<String, String> values) {
        String reportId = "rep_" + String.format("%03d", REPORTS.size() + 1);
        String patientId = value(values, "patient_id", "p_001");
        String patientName = patientName(patientId);
        String reportTitle = value(values, "report_title", "Generated Report");
        String reportType = value(values, "report_type", "diagnostic");
        String diagnosisLabel = value(values, "diagnosis_label", "Atrial Fibrillation");
        String summary = value(values, "summary", "Generated report summary.");
        String createdAt = "2026-06-07T09:20:00Z";
        String predictionId = value(values, "prediction_id", "pred_001");
        String uploadFormat = value(values, "upload_format", "csv");

        REPORTS.add(new String[] {reportId, predictionId, patientId, patientName, reportTitle, reportType, diagnosisLabel, "0.90", summary, uploadFormat, createdAt});
        return "{\"success\":true,\"report\":" + reportJson(REPORTS.get(REPORTS.size() - 1)) + "}";
    }

    public String exportReport(String reportId) {
        return csvForReport(findReport(reportId));
    }

    public String exportReports(String from, String to) {
        StringBuilder sb = new StringBuilder();
        sb.append("report_id,patient_id,patient_name,report_type,diagnosis_label,confidence,created_at\n");
        for (String[] report : REPORTS) {
            if (withinRange(report[10], from, to)) {
                sb.append(report[0]).append(',').append(report[2]).append(',').append(report[3]).append(',')
                        .append(report[5]).append(',').append(report[6]).append(',').append(report[7]).append(',').append(report[10]).append('\n');
            }
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
                + "\"report_id\":\"" + escape(report[0]) + "\"," 
                + "\"prediction_id\":\"" + escape(report[1]) + "\"," 
                + "\"patient_id\":\"" + escape(report[2]) + "\"," 
                + "\"patient_name\":\"" + escape(report[3]) + "\"," 
                + "\"report_title\":\"" + escape(report[4]) + "\"," 
                + "\"report_type\":\"" + escape(report[5]) + "\"," 
                + "\"diagnosis_label\":\"" + escape(report[6]) + "\"," 
                + "\"confidence\":" + report[7] + ","
                + "\"summary\":\"" + escape(report[8]) + "\"," 
                + "\"upload_format\":\"" + escape(report[9]) + "\"," 
                + "\"created_at\":\"" + escape(report[10]) + "\""
                + "}";
    }

    private String patientName(String patientId) {
        if ("p_002".equals(patientId)) return "Chidi Okonkwo";
        if ("p_003".equals(patientId)) return "Fatima Al-Rashid";
        if ("p_004".equals(patientId)) return "Priya Nair";
        return "Amaka Adeyemi";
    }

    private String value(Map<String, String> values, String key, String fallback) {
        String value = values == null ? null : values.get(key);
        return value == null || value.isBlank() ? fallback : value;
    }

    private boolean withinRange(String createdAt, String from, String to) {
        return (from == null || from.isBlank() || createdAt.compareTo(from) >= 0)
                && (to == null || to.isBlank() || createdAt.compareTo(to) <= 0);
    }

    private String escape(String value) {
        return value == null ? "" : value.replace("\\", "\\\\").replace("\"", "\\\"");
    }
}
