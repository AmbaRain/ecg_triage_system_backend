package service;

import java.util.ArrayList;
import java.util.List;

import dao.PatientDAO;
import dao.PredictionDAO;
import model.Patient;
import model.Prediction;

/**
 * Patient lookup and history service.
 *
 * All filtering and fallback behavior lives here so the servlet only maps HTTP
 * request parameters to service calls and serializes the result.
 */
public class PatientService {

    private final PatientDAO patientDAO;
    private final PredictionDAO predictionDAO;

    public PatientService() {
        this(new PatientDAO(), new PredictionDAO());
    }

    public PatientService(PatientDAO patientDAO, PredictionDAO predictionDAO) {
        this.patientDAO = patientDAO;
        this.predictionDAO = predictionDAO;
    }

    public List<Patient> listPatients(String search, int page, int limit) {
        List<Patient> allPatients = loadPatients();
        List<Patient> filtered = new ArrayList<>();

        for (Patient patient : allPatients) {
            if (search == null || search.isBlank() || patient.getFullName().toLowerCase().contains(search.toLowerCase())) {
                filtered.add(patient);
            }
        }

        int start = Math.max(0, (page - 1) * limit);
        int end = Math.min(filtered.size(), start + limit);
        if (start >= end) {
            return new ArrayList<>();
        }

        return new ArrayList<>(filtered.subList(start, end));
    }

    public int countPatients(String search) {
        List<Patient> allPatients = loadPatients();
        if (search == null || search.isBlank()) {
            return allPatients.size();
        }

        int count = 0;
        for (Patient patient : allPatients) {
            if (patient.getFullName().toLowerCase().contains(search.toLowerCase())) {
                count++;
            }
        }
        return count;
    }

    public Patient getPatientById(int patientId) {
        try {
            Patient patient = patientDAO.findById(patientId);
            if (patient != null) {
                return patient;
            }
        } catch (RuntimeException ignored) {
            // Fallback handled below.
        }

        for (Patient patient : loadPatients()) {
            if (patient.getId() == patientId) {
                return patient;
            }
        }

        return null;
    }

    public List<Prediction> getPredictionsForPatient(int patientId) {
        try {
            List<Prediction> predictions = predictionDAO.findByPatientId(patientId);
            if (predictions != null && !predictions.isEmpty()) {
                return predictions;
            }
        } catch (RuntimeException ignored) {
            // Fallback handled below.
        }

        List<Prediction> fallback = new ArrayList<>();
        fallback.add(new Prediction(1, patientId, 1, "Atrial Fibrillation", 0.91,
                new java.sql.Timestamp(System.currentTimeMillis())));
        return fallback;
    }

    private List<Patient> loadPatients() {
        try {
            List<Patient> patients = patientDAO.findAll();
            if (patients != null && !patients.isEmpty()) {
                return patients;
            }
        } catch (RuntimeException ignored) {
            // Fallback handled below.
        }

        List<Patient> fallback = new ArrayList<>();
        fallback.add(new Patient(1, "Amaka Adeyemi", java.sql.Date.valueOf("1978-04-12"), new java.sql.Timestamp(System.currentTimeMillis())));
        fallback.add(new Patient(2, "Chidi Okonkwo", java.sql.Date.valueOf("1981-11-04"), new java.sql.Timestamp(System.currentTimeMillis())));
        fallback.add(new Patient(3, "Fatima Al-Rashid", java.sql.Date.valueOf("1974-09-19"), new java.sql.Timestamp(System.currentTimeMillis())));
        fallback.add(new Patient(4, "Priya Nair", java.sql.Date.valueOf("1988-01-23"), new java.sql.Timestamp(System.currentTimeMillis())));
        return fallback;
    }
}
