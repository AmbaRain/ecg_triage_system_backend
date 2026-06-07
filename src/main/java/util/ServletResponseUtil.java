package util;

import java.io.IOException;
import java.io.PrintWriter;

import javax.servlet.http.HttpServletResponse;

public final class ServletResponseUtil {

    private ServletResponseUtil() {
    }

    public static void writeJson(HttpServletResponse response, int status, String body) throws IOException {
        response.setStatus(status);
        response.setCharacterEncoding("UTF-8");
        response.setContentType("application/json");

        try (PrintWriter writer = response.getWriter()) {
            writer.write(body);
        }
    }

    public static void writeText(HttpServletResponse response, int status, String contentType, String body) throws IOException {
        response.setStatus(status);
        response.setCharacterEncoding("UTF-8");
        response.setContentType(contentType);

        try (PrintWriter writer = response.getWriter()) {
            writer.write(body);
        }
    }

    public static String escapeJson(String value) {
        if (value == null) {
            return "";
        }

        return value.replace("\\", "\\\\").replace("\"", "\\\"");
    }
}