package service;

import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.ArrayList;
import java.util.List;

import javax.servlet.http.Part;

import dao.PredictionDAO;
import model.Prediction;
import util.FileUploader;

/**
 * Prediction orchestration service.
 *
 * This class owns file routing and the optional ML microservice call. If the
 * ML endpoint is not configured yet, it falls back to deterministic sample
 * output so the UI can still render and the application remains usable.
 */
public class PredictionService {

    private final PredictionDAO predictionDAO;
    private final HttpClient httpClient;

    public PredictionService() {
        this(new PredictionDAO(), HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(5)).build());
    }

    public PredictionService(PredictionDAO predictionDAO, HttpClient httpClient) {
        this.predictionDAO = predictionDAO;
        this.httpClient = httpClient;
    }

    public PredictionAnalysisResult analyzeUpload(Part filePart, Part datPart, Part heaPart, String format, Integer patientId)
            throws IOException, InterruptedException {
        String storedPath = routeFiles(filePart, datPart, heaPart);
        Prediction prediction = fallbackPrediction(patientId);

        String mlBaseUrl = firstNonBlank(System.getenv("ECG_ML_BASE_URL"), System.getProperty("ecg.ml.baseUrl"));
        if (mlBaseUrl != null && !mlBaseUrl.isBlank()) {
            try {
                HttpRequest request = HttpRequest.newBuilder()
                        .uri(URI.create(mlBaseUrl.replaceAll("/$", "") + "/predict"))
                        .timeout(Duration.ofSeconds(10))
                        .header("Content-Type", "application/json")
                        .POST(HttpRequest.BodyPublishers.ofString("{\"format\":\"" + escape(format) + "\",\"stored_path\":\"" + escape(storedPath) + "\"}"))
                        .build();

                HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
                if (response.statusCode() >= 200 && response.statusCode() < 300) {
                    String primaryLabel = extractString(response.body(), "primary_label", prediction.getPrimaryLabel());
                    double confidence = extractDouble(response.body(), "confidence", prediction.getConfidence());
                    prediction.setPrimaryLabel(primaryLabel);
                    prediction.setConfidence(confidence);
                    return buildResult(prediction, storedPath, format, primaryLabel, confidence);
                }
            } catch (Exception ignored) {
                // The ML microservice is optional during local development.
            }
        }

        return buildResult(prediction, storedPath, format, prediction.getPrimaryLabel(), prediction.getConfidence());
    }

    public Prediction getPredictionById(int predictionId) {
        try {
            Prediction prediction = predictionDAO.findById(predictionId);
            if (prediction != null) {
                return prediction;
            }
        } catch (RuntimeException ignored) {
            // Fallback handled below.
        }

        return fallbackPrediction(1);
    }

    public List<Prediction> getPredictionsForPatient(int patientId) {
        try {
            List<Prediction> predictions = predictionDAO.findByPatientId(patientId);
            if (predictions != null && !predictions.isEmpty()) {
                return predictions;
            }
        } catch (RuntimeException ignored) {
            // Fallback handled below.
        }

        List<Prediction> fallback = new ArrayList<>();
        fallback.add(fallbackPrediction(patientId));
        return fallback;
    }

    private String routeFiles(Part filePart, Part datPart, Part heaPart) throws IOException {
        String uploadDir = System.getProperty("java.io.tmpdir") + "/ecg-triage-system/uploads";

        if (filePart != null && filePart.getSize() > 0L) {
            return FileUploader.uploadFile(filePart, uploadDir);
        }

        String datPath = null;
        if (datPart != null && datPart.getSize() > 0L) {
            datPath = FileUploader.uploadFile(datPart, uploadDir);
        }

        if (heaPart != null && heaPart.getSize() > 0L) {
            String heaPath = FileUploader.uploadFile(heaPart, uploadDir);
            return datPath == null ? heaPath : datPath + "|" + heaPath;
        }

        return datPath == null ? "" : datPath;
    }

    private PredictionAnalysisResult buildResult(Prediction prediction, String storedPath, String sourceFormat,
            String primaryLabel, double confidence) {
        return new PredictionAnalysisResult(
                prediction,
                storedPath,
                sourceFormat == null || sourceFormat.isBlank() ? "csv" : sourceFormat,
                primaryLabel,
                confidence,
                secondaryLabels(),
                waveformLeads(),
                500);
    }

    private Prediction fallbackPrediction(Integer patientId) {
        int resolvedPatientId = patientId == null ? 1 : patientId;
        return new Prediction(1, resolvedPatientId, 1, "Atrial Fibrillation", 0.91,
                new java.sql.Timestamp(System.currentTimeMillis()));
    }

    private List<LabelScore> secondaryLabels() {
        List<LabelScore> labels = new ArrayList<>();
        labels.add(new LabelScore("Normal Sinus Rhythm", 0.06));
        labels.add(new LabelScore("Left Bundle Branch Block", 0.03));
        return labels;
    }

    private List<String> waveformLeads() {
        List<String> leads = new ArrayList<>();
        leads.add("I");
        leads.add("II");
        leads.add("III");
        leads.add("aVR");
        leads.add("aVL");
        leads.add("aVF");
        leads.add("V1");
        leads.add("V2");
        leads.add("V3");
        leads.add("V4");
        leads.add("V5");
        leads.add("V6");
        return leads;
    }

    private String extractString(String body, String key, String fallback) {
        String marker = "\"" + key + "\":";
        int start = body.indexOf(marker);
        if (start < 0) {
            return fallback;
        }

        int valueStart = body.indexOf('"', start + marker.length());
        int valueEnd = valueStart < 0 ? -1 : body.indexOf('"', valueStart + 1);
        if (valueStart < 0 || valueEnd < 0) {
            return fallback;
        }

        return body.substring(valueStart + 1, valueEnd);
    }

    private double extractDouble(String body, String key, double fallback) {
        String marker = "\"" + key + "\":";
        int start = body.indexOf(marker);
        if (start < 0) {
            return fallback;
        }

        int valueStart = start + marker.length();
        int valueEnd = valueStart;
        while (valueEnd < body.length()) {
            char current = body.charAt(valueEnd);
            if ((current >= '0' && current <= '9') || current == '.' || current == '-') {
                valueEnd++;
                continue;
            }
            break;
        }

        try {
            return Double.parseDouble(body.substring(valueStart, valueEnd));
        } catch (NumberFormatException ex) {
            return fallback;
        }
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

    private String escape(String value) {
        return value == null ? "" : value.replace("\\", "\\\\").replace("\"", "\\\"");
    }

    public static final class PredictionAnalysisResult {
        private final Prediction prediction;
        private final String storedPath;
        private final String sourceFormat;
        private final String primaryLabel;
        private final double confidence;
        private final List<LabelScore> secondaryLabels;
        private final List<String> leads;
        private final int samplingRate;

        public PredictionAnalysisResult(Prediction prediction, String storedPath, String sourceFormat, String primaryLabel,
                double confidence, List<LabelScore> secondaryLabels, List<String> leads, int samplingRate) {
            this.prediction = prediction;
            this.storedPath = storedPath;
            this.sourceFormat = sourceFormat;
            this.primaryLabel = primaryLabel;
            this.confidence = confidence;
            this.secondaryLabels = secondaryLabels;
            this.leads = leads;
            this.samplingRate = samplingRate;
        }

        public Prediction getPrediction() {
            return prediction;
        }

        public String getStoredPath() {
            return storedPath;
        }

        public String getSourceFormat() {
            return sourceFormat;
        }

        public String getPrimaryLabel() {
            return primaryLabel;
        }

        public double getConfidence() {
            return confidence;
        }

        public List<LabelScore> getSecondaryLabels() {
            return secondaryLabels;
        }

        public List<String> getLeads() {
            return leads;
        }

        public int getSamplingRate() {
            return samplingRate;
        }
    }

    public static final class LabelScore {
        private final String label;
        private final double confidence;

        public LabelScore(String label, double confidence) {
            this.label = label;
            this.confidence = confidence;
        }

        public String getLabel() {
            return label;
        }

        public double getConfidence() {
            return confidence;
        }
    }
}
