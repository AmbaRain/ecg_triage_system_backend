package controller;

import java.io.IOException;

import javax.servlet.ServletException;
import javax.servlet.annotation.WebServlet;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import util.ServletResponseUtil;

@WebServlet(name = "DashboardServlet", urlPatterns = {"/api/dashboard"})
public class DashboardServlet extends HttpServlet {

    @Override
    protected void doGet(HttpServletRequest request, HttpServletResponse response) throws ServletException, IOException {
        ServletResponseUtil.writeJson(response, HttpServletResponse.SC_OK,
                "{"
                        + "\"totalPatients\":4," 
                        + "\"totalUploads\":7," 
                        + "\"totalPredictions\":7," 
                        + "\"recentActivity\":["
                        + "{\"type\":\"upload\",\"label\":\"ECG uploaded\",\"timestamp\":\"2026-06-07T08:30:00Z\"},"
                        + "{\"type\":\"prediction\",\"label\":\"Atrial Fibrillation flagged\",\"timestamp\":\"2026-06-07T09:05:00Z\"}"
                        + "]"
                        + "}");
    }
}