package util;

import java.util.regex.Pattern;


/**
 * ValidationUtil - Pure Java SE validation utility class for ECG triage system.
 * Provides static helper methods for common input validation tasks.
 */
public class ValidationUtil {
    
    // Pre-compiled regex patterns for performance
    private static final Pattern EMAIL_PATTERN = 
        Pattern.compile("^[A-Za-z0-9+_.-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$");
    private static final Pattern USERNAME_PATTERN = 
        Pattern.compile("^[A-Za-z0-9]{4,20}$");
    private static final Pattern PASSWORD_PATTERN = 
        Pattern.compile("^(?=.*[A-Z])(?=.*[a-z])(?=.*\\d).{8,}$");
    
    // Prevent instantiation
    private ValidationUtil() {
    }
    
    /**
     * Checks if string is null, empty, or whitespace only.
     */
    public static boolean isNullOrEmpty(String str) {
        return str == null || str.trim().isEmpty();
    }
    
    /**
     * Validates username: alphanumeric only, 4-20 characters.
     */
    public static boolean isValidUsername(String username) {
        if (isNullOrEmpty(username)) {
            return false;
        }
        return USERNAME_PATTERN.matcher(username).matches();
    }
    
    /**
     * Validates password: min 8 chars, requires uppercase, lowercase, and digit.
     */
    public static boolean isValidPassword(String password) {
        if (isNullOrEmpty(password)) {
            return false;
        }
        return PASSWORD_PATTERN.matcher(password).matches();
    }
    
    /**
     * Validates email format using pre-compiled pattern.
     */
    public static boolean isValidEmail(String email) {
        if (isNullOrEmpty(email)) {
            return false;
        }
        return EMAIL_PATTERN.matcher(email).matches();
    }
    
    /**
     * Sanitizes input by trimming and escaping HTML special characters.
     */
    public static String sanitizeInput(String input) {
        if (isNullOrEmpty(input)) {
            return "";
        }
        return input.trim()
            .replace("<", "")
            .replace(">", "")
            .replace("'", "")
            .replace("\"", "");
    }
}