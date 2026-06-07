package dao;

import java.sql.Connection;
import java.sql.PreparedStatement;

import model.ECGRecord;
import util.DBConnection;

public class ECGRecordDAO {

    public boolean insert(ECGRecord record) {

        String sql =
            "INSERT INTO ecg_records (patient_id, file_path, format) VALUES (?, ?, ?)";

        try (
            Connection conn = DBConnection.getConnection();
            PreparedStatement stmt = conn.prepareStatement(sql)
        ) {

            stmt.setInt(1, record.getPatientId());
            stmt.setString(2, record.getFilePath());
            stmt.setString(3, record.getFormat());

            return stmt.executeUpdate() > 0;

        } catch (Exception e) {
            e.printStackTrace();
        }

        return false;
    }
}
