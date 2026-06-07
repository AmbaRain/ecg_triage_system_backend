package dao;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.util.ArrayList;
import java.util.List;

import model.Patient;
import util.DBConnection;

public class PatientDAO {

    // Get all patients
    public List<Patient> findAll() {

        List<Patient> patients = new ArrayList<>();

        String sql = "SELECT * FROM patients";

        try (
            Connection conn = DBConnection.getConnection();
            PreparedStatement stmt = conn.prepareStatement(sql);
            ResultSet rs = stmt.executeQuery()
        ) {

            while (rs.next()) {

                Patient patient = new Patient();

                patient.setId(rs.getInt("id"));
                patient.setFullName(rs.getString("full_name"));
                patient.setDob(rs.getDate("dob"));
                patient.setCreatedAt(rs.getTimestamp("created_at"));

                patients.add(patient);
            }

        } catch (Exception e) {
            e.printStackTrace();
        }

        return patients;
    }
    
    public Patient findById(int id) {

        String sql = "SELECT * FROM patients WHERE id = ?";

        try (
            Connection conn = DBConnection.getConnection();
            PreparedStatement stmt = conn.prepareStatement(sql)
        ) {

            stmt.setInt(1, id);

            try (ResultSet rs = stmt.executeQuery()) {

                if (rs.next()) {

                    Patient patient = new Patient();

                    patient.setId(rs.getInt("id"));
                    patient.setFullName(rs.getString("full_name"));
                    patient.setDob(rs.getDate("dob"));
                    patient.setCreatedAt(rs.getTimestamp("created_at"));

                    return patient;
                }
            }

        } catch (Exception e) {
            e.printStackTrace();
        }

        return null;
    }
    
    public boolean insert(Patient patient) {

        String sql =
            "INSERT INTO patients (full_name, dob) VALUES (?, ?)";

        try (
            Connection conn = DBConnection.getConnection();
            PreparedStatement stmt = conn.prepareStatement(sql)
        ) {

            stmt.setString(1, patient.getFullName());
            stmt.setDate(2, patient.getDob());

            return stmt.executeUpdate() > 0;

        } catch (Exception e) {
            e.printStackTrace();
        }

        return false;
    }
}


