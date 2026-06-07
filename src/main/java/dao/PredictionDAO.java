package dao;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.util.ArrayList;
import java.util.List;

import model.Prediction;
import util.DBConnection;

public class PredictionDAO {

    public boolean insert(Prediction prediction) {

        String sql =
            "INSERT INTO predictions (patient_id, record_id, primary_label, confidence) VALUES (?, ?, ?, ?)";

        try (
            Connection conn = DBConnection.getConnection();
            PreparedStatement stmt = conn.prepareStatement(sql)
        ) {

            stmt.setInt(1, prediction.getPatientId());
            stmt.setInt(2, prediction.getRecordId());
            stmt.setString(3, prediction.getPrimaryLabel());
            stmt.setDouble(4, prediction.getConfidence());

            return stmt.executeUpdate() > 0;

        } catch (Exception e) {
            e.printStackTrace();
        }

        return false;
    }

    public Prediction findById(int id) {

        String sql = "SELECT * FROM predictions WHERE id = ?";

        try (
            Connection conn = DBConnection.getConnection();
            PreparedStatement stmt = conn.prepareStatement(sql)
        ) {

            stmt.setInt(1, id);

            try (ResultSet rs = stmt.executeQuery()) {

                if (rs.next()) {

                    Prediction prediction = new Prediction();

                    prediction.setId(rs.getInt("id"));
                    prediction.setPatientId(rs.getInt("patient_id"));
                    prediction.setRecordId(rs.getInt("record_id"));
                    prediction.setPrimaryLabel(rs.getString("primary_label"));
                    prediction.setConfidence(rs.getDouble("confidence"));
                    prediction.setTimestamp(rs.getTimestamp("timestamp"));

                    return prediction;
                }
            }

        } catch (Exception e) {
            e.printStackTrace();
        }

        return null;
    }

    public List<Prediction> findByPatientId(int patientId) {

        List<Prediction> predictions = new ArrayList<>();

        String sql =
            "SELECT * FROM predictions WHERE patient_id = ?";

        try (
            Connection conn = DBConnection.getConnection();
            PreparedStatement stmt = conn.prepareStatement(sql)
        ) {

            stmt.setInt(1, patientId);

            try (ResultSet rs = stmt.executeQuery()) {

                while (rs.next()) {

                    Prediction prediction = new Prediction();

                    prediction.setId(rs.getInt("id"));
                    prediction.setPatientId(rs.getInt("patient_id"));
                    prediction.setRecordId(rs.getInt("record_id"));
                    prediction.setPrimaryLabel(rs.getString("primary_label"));
                    prediction.setConfidence(rs.getDouble("confidence"));
                    prediction.setTimestamp(rs.getTimestamp("timestamp"));

                    predictions.add(prediction);
                }
            }

        } catch (Exception e) {
            e.printStackTrace();
        }

        return predictions;
    }
}
