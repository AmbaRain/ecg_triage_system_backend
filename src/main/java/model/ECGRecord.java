package model;

public class ECGRecord {

    private int id;
    private int patientId;
    private String filePath;
    private String format;

    public ECGRecord() {
    }

    public ECGRecord(int id, int patientId,
                     String filePath, String format) {
        this.id = id;
        this.patientId = patientId;
        this.filePath = filePath;
        this.format = format;
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

    public String getFilePath() {
        return filePath;
    }

    public void setFilePath(String filePath) {
        this.filePath = filePath;
    }

    public String getFormat() {
        return format;
    }

    public void setFormat(String format) {
        this.format = format;
    }

    @Override
    public String toString() {
        return "ECGRecord [id=" + id +
                ", patientId=" + patientId +
                ", filePath=" + filePath +
                ", format=" + format + "]";
    }
}
