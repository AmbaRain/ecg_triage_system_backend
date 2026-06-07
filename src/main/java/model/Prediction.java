package model;

import java.sql.Timestamp;

public class Prediction {

    private int id;
    private int patientId;
    private int recordId;
    private String primaryLabel;
    private double confidence;
    private Timestamp timestamp;

    public Prediction() {
    }

    public Prediction(int id, int patientId,
                      int recordId, String primaryLabel,
                      double confidence,
                      Timestamp timestamp) {

        this.id = id;
        this.patientId = patientId;
        this.recordId = recordId;
        this.primaryLabel = primaryLabel;
        this.confidence = confidence;
        this.timestamp = timestamp;
    }

    public int getId() {
        return id;
    }

    public void setId(int id) {
        this.id = id;
    }

    public int getPatientId() {
        return patientId;
    }

    public void setPatientId(int patientId) {
        this.patientId = patientId;
    }

    public int getRecordId() {
        return recordId;
    }

    public void setRecordId(int recordId) {
        this.recordId = recordId;
    }

    public String getPrimaryLabel() {
        return primaryLabel;
    }

    public void setPrimaryLabel(String primaryLabel) {
        this.primaryLabel = primaryLabel;
    }

    public double getConfidence() {
        return confidence;
    }

    public void setConfidence(double confidence) {
        this.confidence = confidence;
    }

    public Timestamp getTimestamp() {
        return timestamp;
    }

    public void setTimestamp(Timestamp timestamp) {
        this.timestamp = timestamp;
    }

    @Override
    public String toString() {
        return "Prediction [id=" + id +
                ", patientId=" + patientId +
                ", recordId=" + recordId +
                ", primaryLabel=" + primaryLabel +
                ", confidence=" + confidence +
                ", timestamp=" + timestamp + "]";
    }
}
