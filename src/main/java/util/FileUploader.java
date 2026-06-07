package util;

import javax.servlet.http.Part;
import java.io.IOException;
import java.io.InputStream;
import java.io.File;
import java.nio.file.Paths;
import java.nio.file.Path;
import java.nio.file.Files;
import java.nio.file.StandardCopyOption;
import java.util.UUID;

public class FileUploader {
    
    // Allowed medical signal file extensions
    private static final String[] ALLOWED_EXTENSIONS = {".csv", ".dat", ".txt", ".hea"};
    
    /**
     * Uploads a file securely with UUID-based naming to prevent overwrites.
     * 
     * @param filePart the uploaded file Part from the servlet request
     * @param uploadDirectoryPath the target directory path for file storage
     * @return relative file path on success, or null if validation fails
     * @throws IOException if file operation or validation fails
     */
    public static String uploadFile(Part filePart, String uploadDirectoryPath) throws IOException {
        if (filePart == null || filePart.getSize() == 0) {
            throw new IOException("File part is null or empty");
        }
        
        String originalFileName = extractFileName(filePart);
        if (originalFileName == null || originalFileName.isEmpty()) {
            throw new IOException("Invalid or missing filename");
        }
        
        String fileExtension = getFileExtension(originalFileName);
        if (!isAllowedExtension(fileExtension)) {
            throw new IOException("File extension not allowed. Allowed types: .csv, .dat, .txt, .hea");
        }
        
        String uniqueFileName = UUID.randomUUID().toString() + fileExtension;
        Path uploadDir = Paths.get(uploadDirectoryPath);
        Files.createDirectories(uploadDir);
        Path targetPath = uploadDir.resolve(uniqueFileName);
        
        try (InputStream inputStream = filePart.getInputStream()) {
            Files.copy(inputStream, targetPath, StandardCopyOption.REPLACE_EXISTING);
        }
        
        return uploadDir.getFileName().toString() + File.separator + uniqueFileName;
    }
    
    private static String extractFileName(Part part) {
        String contentDisposition = part.getHeader("content-disposition");
        if (contentDisposition == null) return null;
        for (String token : contentDisposition.split(";")) {
            token = token.trim();
            if (token.startsWith("filename")) {
                int idx = token.indexOf('=');
                if (idx == -1) continue;
                String filename = token.substring(idx + 1).trim().replaceAll("\"", "");
                // remove any path components
                return Paths.get(filename).getFileName().toString();
            }
        }
        return null;
    }
    
    private static String getFileExtension(String fileName) {
        int lastDot = fileName.lastIndexOf('.');
        return lastDot >= 0 ? fileName.substring(lastDot).toLowerCase() : "";
    }
    
    private static boolean isAllowedExtension(String extension) {
        for (String allowed : ALLOWED_EXTENSIONS) {
            if (allowed.equals(extension)) {
                return true;
            }
        }
        return false;
    }
}