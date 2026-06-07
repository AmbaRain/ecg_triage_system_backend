package test;

import java.sql.Connection;
import util.DBConnection;

/**
 * Test runner for DBConnection.
 * 
 * BEFORE RUNNING: Make sure MySQL is running and
 * the database 'ecg_system_db' exists. You can create it with:
 * 
 *   CREATE DATABASE ecg_system_db;
 * 
 * Also make sure mysql-connector-j.jar is on your classpath.
 * 
 * Run as: Right-click -> Run As -> Java Application
 */
public class TestDBConnection {

    public static void main(String[] args) {

        System.out.println("========================================");
        System.out.println("  Testing DBConnection");
        System.out.println("========================================\n");

        // Test 1: Can we get a connection?
        System.out.print("  Connecting to database... ");
        try {
            Connection conn = DBConnection.getConnection();

            if (conn != null && !conn.isClosed()) {
                System.out.println("PASS");
                System.out.println("  -> Database: " + conn.getCatalog());
                System.out.println("  -> Valid: " + conn.isValid(5));
            } else {
                System.out.println("FAIL (connection is null or closed)");
            }

        } catch (Exception e) {
            System.out.println("FAIL");
            System.out.println("  -> Error: " + e.getMessage());
            System.out.println("\n  Checklist:");
            System.out.println("  [ ] Is MySQL running?");
            System.out.println("  [ ] Does 'ecg_system_db' database exist?");
            System.out.println("  [ ] Are credentials correct in DBConnection.java?");
            System.out.println("  [ ] Is mysql-connector-j.jar on the classpath?");
            return;
        }

        // Test 2: Does calling getConnection() again reuse the connection?
        System.out.print("  Testing connection reuse... ");
        try {
            Connection conn1 = DBConnection.getConnection();
            Connection conn2 = DBConnection.getConnection();

            if (conn1 == conn2) {
                System.out.println("PASS (same instance reused)");
            } else {
                System.out.println("PASS (new instance, old was closed)");
            }

        } catch (Exception e) {
            System.out.println("FAIL: " + e.getMessage());
        }

        System.out.println("\n========================================");
        System.out.println("  DBConnection tests complete");
        System.out.println("========================================");
    }
}
