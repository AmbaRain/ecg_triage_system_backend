package test;

import util.ValidationUtil;

/**
 * Test runner for ValidationUtil.
 * Run as: Right-click -> Run As -> Java Application
 * No database or server needed.
 */
public class TestValidationUtil {

    static int passed = 0;
    static int failed = 0;

    public static void main(String[] args) {

        System.out.println("========================================");
        System.out.println("  Testing ValidationUtil");
        System.out.println("========================================\n");

        // --- isNullOrEmpty ---
        System.out.println("-- isNullOrEmpty --");
        check("null returns true", ValidationUtil.isNullOrEmpty(null) == true);
        check("empty string returns true", ValidationUtil.isNullOrEmpty("") == true);
        check("whitespace returns true", ValidationUtil.isNullOrEmpty("   ") == true);
        check("normal text returns false", ValidationUtil.isNullOrEmpty("hello") == false);

        // --- isValidUsername ---
        System.out.println("\n-- isValidUsername --");
        check("'admin123' is valid", ValidationUtil.isValidUsername("admin123") == true);
        check("'User' is valid (4 chars)", ValidationUtil.isValidUsername("User") == true);
        check("'ab' is invalid (too short)", ValidationUtil.isValidUsername("ab") == false);
        check("null is invalid", ValidationUtil.isValidUsername(null) == false);
        check("'user@name' is invalid (special chars)", ValidationUtil.isValidUsername("user@name") == false);
        check("'user name' is invalid (space)", ValidationUtil.isValidUsername("user name") == false);

        // --- isValidPassword ---
        System.out.println("\n-- isValidPassword --");
        check("'Secret123' is valid", ValidationUtil.isValidPassword("Secret123") == true);
        check("'MyPass99' is valid", ValidationUtil.isValidPassword("MyPass99") == true);
        check("'secret123' invalid (no uppercase)", ValidationUtil.isValidPassword("secret123") == false);
        check("'SECRET123' invalid (no lowercase)", ValidationUtil.isValidPassword("SECRET123") == false);
        check("'Secretabc' invalid (no digit)", ValidationUtil.isValidPassword("Secretabc") == false);
        check("'Ab1' invalid (too short)", ValidationUtil.isValidPassword("Ab1") == false);
        check("null is invalid", ValidationUtil.isValidPassword(null) == false);

        // --- isValidEmail ---
        System.out.println("\n-- isValidEmail --");
        check("'test@example.com' is valid", ValidationUtil.isValidEmail("test@example.com") == true);
        check("'user.name@domain.co.uk' is valid", ValidationUtil.isValidEmail("user.name@domain.co.uk") == true);
        check("'missing-at.com' is invalid", ValidationUtil.isValidEmail("missing-at.com") == false);
        check("'@nodomain' is invalid", ValidationUtil.isValidEmail("@nodomain") == false);
        check("null is invalid", ValidationUtil.isValidEmail(null) == false);

        // --- sanitizeInput ---
        System.out.println("\n-- sanitizeInput --");
        check("strips < and >", ValidationUtil.sanitizeInput("<script>").equals("script"));
        check("strips quotes", ValidationUtil.sanitizeInput("it's \"fine\"").equals("its fine"));
        check("trims whitespace", ValidationUtil.sanitizeInput("  hello  ").equals("hello"));
        check("null returns empty", ValidationUtil.sanitizeInput(null).equals(""));

        // --- Results ---
        System.out.println("\n========================================");
        System.out.println("  Results: " + passed + " passed, " + failed + " failed");
        System.out.println("========================================");
    }

    static void check(String name, boolean condition) {
        if (condition) {
            passed++;
            System.out.println("  PASS: " + name);
        } else {
            failed++;
            System.out.println("  FAIL: " + name);
        }
    }
}
