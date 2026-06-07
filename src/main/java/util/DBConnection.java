
import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.SQLException;

/**
 * DBConnection - Singleton pattern for database connection management
 * Ensures a single, reusable connection instance throughout the application lifecycle
 */
public class DBConnection {
    private static Connection connection = null;
    
    private static final String URL = "jdbc:mysql://localhost:3306/ecg_system_db";
    private static final String USER = "root";
    private static final String PASSWORD = "password";
    private static final String DRIVER = "com.mysql.cj.jdbc.Driver";
    
    // Private constructor to prevent instantiation
    private DBConnection() {
    }
    
    /**
     * Retrieves or establishes the database connection
     * @return Active database Connection instance
     * @throws SQLException if connection fails
     */
    public static Connection getConnection() throws SQLException {
        // Validate if connection is null or closed
        if (connection == null || connection.isClosed()) {
            try {
                // Register MySQL JDBC driver
                Class.forName(DRIVER);
                // Instantiate new connection via DriverManager
                connection = DriverManager.getConnection(URL, USER, PASSWORD);
            } catch (ClassNotFoundException e) {
                throw new SQLException("MySQL driver not found", e);
            }
        }
        return connection;
    }
}