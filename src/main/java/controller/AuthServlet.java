package controller;

import java.io.IOException;

import javax.servlet.ServletException;
import javax.servlet.annotation.WebServlet;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import javax.servlet.http.HttpSession;

import util.ServletResponseUtil;

@WebServlet(name = "AuthServlet", urlPatterns = {"/api/auth/*"})
public class AuthServlet extends HttpServlet {

    private static final String TOKEN = "mock.jwt.token.abc123";

    @Override
    protected void doGet(HttpServletRequest request, HttpServletResponse response) throws ServletException, IOException {
        if ("/me".equals(request.getPathInfo())) {
            handleMe(request, response);
            return;
        }

        ServletResponseUtil.writeJson(response, HttpServletResponse.SC_NOT_FOUND,
                "{\"error\":\"Unknown auth route\"}");
    }

    @Override
    protected void doPost(HttpServletRequest request, HttpServletResponse response) throws ServletException, IOException {
        request.setCharacterEncoding("UTF-8");
        String pathInfo = request.getPathInfo();

        if ("/login".equals(pathInfo)) {
            handleLogin(request, response);
            return;
        }

        if ("/logout".equals(pathInfo)) {
            handleLogout(request, response);
            return;
        }

        ServletResponseUtil.writeJson(response, HttpServletResponse.SC_NOT_FOUND,
                "{\"error\":\"Unknown auth route\"}");
    }

    private void handleLogin(HttpServletRequest request, HttpServletResponse response) throws IOException {
        String username = trimToNull(request.getParameter("username"));
        String email = trimToNull(request.getParameter("email"));
        String password = trimToNull(request.getParameter("password"));

        if ((username == null && email == null) || password == null) {
            ServletResponseUtil.writeJson(response, HttpServletResponse.SC_BAD_REQUEST,
                    "{\"error\":\"username/email and password are required\"}");
            return;
        }

        String principal = username != null ? username : email;
        HttpSession session = request.getSession(true);
        session.setAttribute("authUser", mockUser(principal));
        session.setAttribute("authToken", TOKEN);

        ServletResponseUtil.writeJson(response, HttpServletResponse.SC_OK,
                "{"
                        + "\"token\":\"" + TOKEN + "\"," 
                        + "\"user\":" + mockUser(principal)
                        + "}");
    }

    private void handleLogout(HttpServletRequest request, HttpServletResponse response) throws IOException {
        HttpSession session = request.getSession(false);
        if (session != null) {
            session.invalidate();
        }

        ServletResponseUtil.writeJson(response, HttpServletResponse.SC_OK,
                "{\"message\":\"logout successful\"}");
    }

    private void handleMe(HttpServletRequest request, HttpServletResponse response) throws IOException {
        HttpSession session = request.getSession(false);
        String userJson = session != null ? (String) session.getAttribute("authUser") : null;

        if (userJson == null) {
            userJson = mockUser("dr.adeyemi");
        }

        ServletResponseUtil.writeJson(response, HttpServletResponse.SC_OK, userJson);
    }

    private String trimToNull(String value) {
        if (value == null) {
            return null;
        }

        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }

    private String mockUser(String username) {
        return "{"
                + "\"user_id\":\"u001\"," 
                + "\"username\":\"" + ServletResponseUtil.escapeJson(username) + "\"," 
                + "\"full_name\":\"Dr. Amaka Adeyemi\"," 
                + "\"role\":\"clinician\""
                + "}";
    }
}