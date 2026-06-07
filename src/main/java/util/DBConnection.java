
import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.SQLException;

/**
 * DBConnection - Singleton pattern for database connection management
 * Ensures a single, reusable connection instance throughout the application lifecycle
 */
public class DBConnection {
    private static Connection connection = null;
package util;

import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.SQLException;

/**
 * Shared JDBC connection helper.
 *
 * This class keeps connection bootstrapping out of servlets and DAOs. The
 * values are resolved from environment variables first so the project can be
 * deployed without source changes.
 */
public final class DBConnection {

    private static final String DEFAULT_URL = "jdbc:mysql://localhost:3306/ecg_system";
    private static final String DEFAULT_USER = "root";
    private static final String DEFAULT_PASSWORD = "";
    private static final String DRIVER = "com.mysql.cj.jdbc.Driver";

    private DBConnection() {
    }

    public static Connection getConnection() throws SQLException {
        try {
            Class.forName(DRIVER);
        } catch (ClassNotFoundException ex) {
            throw new SQLException("MySQL JDBC driver not found on the classpath", ex);
        }

        return DriverManager.getConnection(
                readConfig("ECG_DB_URL", DEFAULT_URL),
                readConfig("ECG_DB_USER", DEFAULT_USER),
                readConfig("ECG_DB_PASSWORD", DEFAULT_PASSWORD));
    }

    private static String readConfig(String key, String fallback) {
        String value = System.getProperty(key);
        if (value == null || value.isBlank()) {
            value = System.getenv(key);
        }

        return (value == null || value.isBlank()) ? fallback : value;
    }
}
    }
}