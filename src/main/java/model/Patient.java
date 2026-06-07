package model;

import java.sql.Date;

public class Patient {

    private int id;
    private String fullName;
    private Date dob;
    private java.sql.Timestamp createdAt;

    public Patient() {
    }

    public Patient(int id, String fullName, Date dob,
                   java.sql.Timestamp createdAt) {
        this.id = id;
        this.fullName = fullName;
        this.dob = dob;
        this.createdAt = createdAt;
    }

    public int getId() {
        return id;
    }

    public void setId(int id) {
        this.id = id;
    }

    public String getFullName() {
        return fullName;
    }

    public void setFullName(String fullName) {
        this.fullName = fullName;
    }

    public Date getDob() {
        return dob;
    }

    public void setDob(Date dob) {
        this.dob = dob;
    }

    public java.sql.Timestamp getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(java.sql.Timestamp createdAt) {
        this.createdAt = createdAt;
    }

    @Override
    public String toString() {
        return "Patient [id=" + id +
               ", fullName=" + fullName +
               ", dob=" + dob +
               ", createdAt=" + createdAt + "]";
    }
}
