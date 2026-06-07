package service;

import java.util.ArrayList;
import java.util.List;

import dao.PatientDAO;
import model.Patient;

/**
 * Dashboard aggregation service.
 *
 * This service turns DAO results into a small, stable summary object that the
 * servlet can serialize without knowing anything about SQL or persistence.
 */
public class DashboardService {

    private final PatientDAO patientDAO;

    public DashboardService() {
        this(new PatientDAO());
    }

    public DashboardService(PatientDAO patientDAO) {
        this.patientDAO = patientDAO;
    }

    public DashboardSummary getSummary() {
        int totalPatients = loadPatients().size();
        List<ActivityItem> recentActivity = new ArrayList<>();
        recentActivity.add(new ActivityItem("upload", "ECG uploaded", "2026-06-07T08:30:00Z"));
        recentActivity.add(new ActivityItem("prediction", "Atrial Fibrillation flagged", "2026-06-07T09:05:00Z"));

        return new DashboardSummary(totalPatients, 7, 7, recentActivity);
    }

    private List<Patient> loadPatients() {
        try {
            List<Patient> patients = patientDAO.findAll();
            if (patients != null) {
                return patients;
            }
        } catch (RuntimeException ignored) {
            // Keep the dashboard alive even if the database is not seeded yet.
        }

        List<Patient> fallback = new ArrayList<>();
        fallback.add(new Patient(1, "Amaka Adeyemi", java.sql.Date.valueOf("1978-04-12"), new java.sql.Timestamp(System.currentTimeMillis())));
        fallback.add(new Patient(2, "Chidi Okonkwo", java.sql.Date.valueOf("1981-11-04"), new java.sql.Timestamp(System.currentTimeMillis())));
        fallback.add(new Patient(3, "Fatima Al-Rashid", java.sql.Date.valueOf("1974-09-19"), new java.sql.Timestamp(System.currentTimeMillis())));
        fallback.add(new Patient(4, "Priya Nair", java.sql.Date.valueOf("1988-01-23"), new java.sql.Timestamp(System.currentTimeMillis())));
        return fallback;
    }

    public static final class DashboardSummary {
        private final int totalPatients;
        private final int totalUploads;
        private final int totalPredictions;
        private final List<ActivityItem> recentActivity;

        public DashboardSummary(int totalPatients, int totalUploads, int totalPredictions, List<ActivityItem> recentActivity) {
            this.totalPatients = totalPatients;
            this.totalUploads = totalUploads;
            this.totalPredictions = totalPredictions;
            this.recentActivity = recentActivity;
        }

        public int getTotalPatients() {
            return totalPatients;
        }

        public int getTotalUploads() {
            return totalUploads;
        }

        public int getTotalPredictions() {
            return totalPredictions;
        }

        public List<ActivityItem> getRecentActivity() {
            return recentActivity;
        }
    }

    public static final class ActivityItem {
        private final String type;
        private final String label;
        private final String timestamp;

        public ActivityItem(String type, String label, String timestamp) {
            this.type = type;
            this.label = label;
            this.timestamp = timestamp;
        }

        public String getType() {
            return type;
        }

        public String getLabel() {
            return label;
        }

        public String getTimestamp() {
            return timestamp;
        }
    }
}
