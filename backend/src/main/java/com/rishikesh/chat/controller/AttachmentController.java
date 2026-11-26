package com.rishikesh.chat.controller;

import java.io.IOException;
import java.net.MalformedURLException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/attachments")
public class AttachmentController {

    private final Path uploadDir = Paths.get("uploads", "attachments").toAbsolutePath().normalize();

    private static final long MAX_FILE_SIZE_BYTES = 25 * 1024 * 1024; // 25 MB
    private static final java.util.Set<String> ALLOWED_EXTENSIONS = java.util.Set.of(
            ".jpg", ".jpeg", ".png", ".webp", ".gif",
            ".pdf", ".docx", ".doc", ".xlsx", ".xls",
            ".pptx", ".ppt", ".txt", ".md", ".csv", ".zip"
    );

    public AttachmentController() {
        try {
            Files.createDirectories(uploadDir);
        } catch (IOException e) {
            System.err.println("Could not initialize attachment upload directory: " + e.getMessage());
        }
    }

    @PostMapping("/upload")
    public ResponseEntity<Map<String, Object>> uploadAttachment(
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "conversationId", required = false) Long conversationId) {

        if (file.isEmpty()) {
            Map<String, Object> err = new HashMap<>();
            err.put("error", "Cannot upload empty file");
            return ResponseEntity.badRequest().body(err);
        }

        if (file.getSize() > MAX_FILE_SIZE_BYTES) {
            Map<String, Object> err = new HashMap<>();
            err.put("error", "File exceeds maximum permitted size of 25 MB");
            return ResponseEntity.badRequest().body(err);
        }

        String originalName = file.getOriginalFilename();
        if (originalName == null || originalName.trim().isEmpty()) {
            originalName = "attachment";
        }

        String lowerName = originalName.toLowerCase();
        int dotIndex = lowerName.lastIndexOf('.');
        String ext = dotIndex != -1 ? lowerName.substring(dotIndex) : "";

        if (!ALLOWED_EXTENSIONS.contains(ext)) {
            Map<String, Object> err = new HashMap<>();
            err.put("error", "File format not supported. Only safe images, documents, and archives are allowed.");
            return ResponseEntity.badRequest().body(err);
        }

        try {
            Files.createDirectories(uploadDir);

            // Clean filename and generate unguessable UUID storage path
            String cleanName = originalName.replaceAll("[^a-zA-Z0-9._-]", "_");
            String storedFileName = UUID.randomUUID().toString() + "_" + cleanName;
            Path targetLocation = uploadDir.resolve(storedFileName);

            Files.copy(file.getInputStream(), targetLocation, StandardCopyOption.REPLACE_EXISTING);

            String downloadUrl = "/api/attachments/" + storedFileName;

            Map<String, Object> response = new HashMap<>();
            response.put("url", downloadUrl);
            response.put("fileName", storedFileName);
            response.put("originalName", originalName);
            response.put("size", file.getSize());
            response.put("contentType", file.getContentType());
            response.put("conversationId", conversationId);

            return ResponseEntity.status(HttpStatus.CREATED).body(response);

        } catch (IOException e) {
            Map<String, Object> err = new HashMap<>();
            err.put("error", "Failed to store file: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(err);
        }
    }

    @GetMapping("/{fileName:.+}")
    public ResponseEntity<Resource> downloadAttachment(@PathVariable String fileName) {
        try {
            Path filePath = uploadDir.resolve(fileName).normalize();
            if (!filePath.startsWith(uploadDir)) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
            }

            Resource resource = new UrlResource(filePath.toUri());
            if (!resource.exists() || !resource.isReadable()) {
                return ResponseEntity.notFound().build();
            }

            String contentType = Files.probeContentType(filePath);
            if (contentType == null) {
                contentType = "application/octet-stream";
            }

            // Defense against Stored XSS: Only safe raster images are rendered inline, others forced to download
            boolean isSafeRasterImage = contentType.equals("image/jpeg") || contentType.equals("image/png") ||
                                       contentType.equals("image/webp") || contentType.equals("image/gif");
            String disposition = isSafeRasterImage ? "inline" : "attachment";

            return ResponseEntity.ok()
                    .contentType(MediaType.parseMediaType(contentType))
                    .header("X-Content-Type-Options", "nosniff")
                    .header(HttpHeaders.CONTENT_DISPOSITION, disposition + "; filename=\"" + resource.getFilename() + "\"")
                    .body(resource);

        } catch (MalformedURLException e) {
            return ResponseEntity.badRequest().build();
        } catch (IOException e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/health")
    public ResponseEntity<Map<String, String>> healthCheck() {
        Map<String, String> status = new HashMap<>();
        status.put("status", "UP");
        status.put("uploadDir", uploadDir.toString());
        return ResponseEntity.ok(status);
    }
}
