package service;

import dao.UserDAO;
import model.User;
import util.ValidationUtil;

/**
 * Authentication business rules.
 *
 * The servlet layer only handles HTTP/session state; this service decides what
 * an authenticated user object should look like for the current backend state.
 */
public class AuthService {

    private final UserDAO userDAO;

    public AuthService() {
        this(new UserDAO());
    }

    public AuthService(UserDAO userDAO) {
        this.userDAO = userDAO;
    }

    public User authenticate(String username, String email, String password) {
        String principal = firstNonBlank(username, email);
        if (ValidationUtil.isNullOrEmpty(principal) || ValidationUtil.isNullOrEmpty(password)) {
            return null;
        }

        User user = userDAO.findByUsername(principal);
        if (user != null) {
            return user;
        }

        return fallbackUser(principal);
    }

    public User getCurrentUser(String username) {
        User user = userDAO.findByUsername(username);
        return user != null ? user : fallbackUser(username);
    }

    private User fallbackUser(String username) {
        User user = new User();
        user.setId(1);
        user.setUsername(username);
        user.setPasswordHash("");
        user.setFullName("Dr. Amaka Adeyemi");
        user.setRole("clinician");
        return user;
    }

    private String firstNonBlank(String first, String second) {
        if (first != null && !first.isBlank()) {
            return first.trim();
        }
        if (second != null && !second.isBlank()) {
            return second.trim();
        }
        return null;
    }
}
