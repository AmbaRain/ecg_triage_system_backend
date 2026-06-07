package test;

import java.sql.Date;
import java.util.List;

import dao.ECGRecordDAO;
import dao.PatientDAO;
import dao.PredictionDAO;
import dao.UserDAO;
import model.ECGRecord;
import model.Patient;
import model.Prediction;
import model.User;

/**
 * Test runner for all DAO classes.
 * 
 * BEFORE RUNNING:
 * 1. MySQL must be running
 * 2. ecg_system_db must exist with these tables:
 * 
 *   CREATE TABLE patients (
 *       id INT AUTO_INCREMENT PRIMARY KEY,
 *       full_name VARCHAR(100),
 *       dob DATE,
 *       created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
 *   );
 * 
 *   CREATE TABLE users (
 *       id INT AUTO_INCREMENT PRIMARY KEY,
 *       username VARCHAR(50) UNIQUE,
 *       password_hash VARCHAR(255),
 *       full_name VARCHAR(100),
 *       role VARCHAR(20)
 *   );
 * 
 *   CREATE TABLE ecg_records (
 *       id INT AUTO_INCREMENT PRIMARY KEY,
 *       patient_id INT,
 *       file_path VARCHAR(255),
 *       format VARCHAR(20),
 *       FOREIGN KEY (patient_id) REFERENCES patients(id)
 *   );
 * 
 *   CREATE TABLE predictions (
 *       id INT AUTO_INCREMENT PRIMARY KEY,
 *       patient_id INT,
 *       record_id INT,
 *       primary_label VARCHAR(50),
 *       confidence DOUBLE,
 *       timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
 *       FOREIGN KEY (patient_id) REFERENCES patients(id),
 *       FOREIGN KEY (record_id) REFERENCES ecg_records(id)
 *   );
 * 
 *   -- Insert a test user:
 *   INSERT INTO users (username, password_hash, full_name, role)
 *   VALUES ('admin', 'hashed_password_here', 'Admin User', 'doctor');
 * 
 * Run as: Right-click -> Run As -> Java Application
 */
public class TestDAOs {

    static int passed = 0;
    static int failed = 0;

    public static void main(String[] args) {

        System.out.println("========================================");
        System.out.println("  Testing All DAOs");
        System.out.println("========================================\n");

        testPatientDAO();
        testUserDAO();
        testECGRecordDAO();
        testPredictionDAO();

        System.out.println("\n========================================");
        System.out.println("  Results: " + passed + " passed, " + failed + " failed");
        System.out.println("========================================");
    }

    static void testPatientDAO() {

        System.out.println("-- PatientDAO --");
        PatientDAO dao = new PatientDAO();

        // Insert
        Patient patient = new Patient();
        patient.setFullName("Test Patient");
        patient.setDob(Date.valueOf("1990-05-15"));

        boolean inserted = dao.insert(patient);
        check("insert patient", inserted);

        // Find all
        List<Patient> all = dao.findAll();
        check("findAll returns results", all.size() > 0);

        // Find by ID (use the last inserted patient)
        if (!all.isEmpty()) {
            int lastId = all.get(all.size() - 1).getId();
            Patient found = dao.findById(lastId);
            check("findById returns patient", found != null);
            check("findById correct name",
                found != null && "Test Patient".equals(found.getFullName()));
        }

        System.out.println();
    }

    static void testUserDAO() {

        System.out.println("-- UserDAO --");
        UserDAO dao = new UserDAO();

        // Find existing user (requires 'admin' user inserted in DB)
        User user = dao.findByUsername("admin");
        check("findByUsername('admin')", user != null);

        if (user != null) {
            check("username is correct", "admin".equals(user.getUsername()));
            check("fullName is not null", user.getFullName() != null);
            check("role is not null", user.getRole() != null);
        }

        // Find non-existent user
        User noUser = dao.findByUsername("nonexistent_user_xyz");
        check("non-existent user returns null", noUser == null);

        System.out.println();
    }

    static void testECGRecordDAO() {

        System.out.println("-- ECGRecordDAO --");
        ECGRecordDAO dao = new ECGRecordDAO();

        // We need a valid patient_id first
        PatientDAO patientDAO = new PatientDAO();
        List<Patient> patients = patientDAO.findAll();

        if (patients.isEmpty()) {
            System.out.println("  SKIP: No patients in DB to link ECG record to");
            return;
        }

        int patientId = patients.get(0).getId();

        ECGRecord record = new ECGRecord();
        record.setPatientId(patientId);
        record.setFilePath("uploads/test-file.csv");
        record.setFormat("csv");

        boolean inserted = dao.insert(record);
        check("insert ECG record", inserted);

        System.out.println();
    }

    static void testPredictionDAO() {

        System.out.println("-- PredictionDAO --");
        PredictionDAO dao = new PredictionDAO();

        // We need a valid patient_id first
        PatientDAO patientDAO = new PatientDAO();
        List<Patient> patients = patientDAO.findAll();

        if (patients.isEmpty()) {
            System.out.println("  SKIP: No patients in DB");
            return;
        }

        int patientId = patients.get(0).getId();

        // Insert (using record_id = 1, assumes ECG record test ran first)
        Prediction prediction = new Prediction();
        prediction.setPatientId(patientId);
        prediction.setRecordId(1);
        prediction.setPrimaryLabel("Normal Sinus Rhythm");
        prediction.setConfidence(0.95);

        boolean inserted = dao.insert(prediction);
        check("insert prediction", inserted);

        // Find by patient ID
        List<Prediction> results = dao.findByPatientId(patientId);
        check("findByPatientId returns results", results.size() > 0);

        // Find by ID
        if (!results.isEmpty()) {
            Prediction found = dao.findById(results.get(0).getId());
            check("findById returns prediction", found != null);
            check("findById correct label",
                found != null && "Normal Sinus Rhythm".equals(found.getPrimaryLabel()));
        }

        System.out.println();
    }

    static void check(String name, boolean condition) {
        if (condition) {
            passed++;
            System.out.println("  PASS: " + name);
        } else {
            failed++;
            System.out.println("  FAIL: " + name);
        }
    }
}
