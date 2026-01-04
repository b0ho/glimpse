package com.glimpse.server.controller;

import com.glimpse.server.dto.common.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

/**
 * File Upload Controller
 *
 * <p>파일 업로드 REST API를 제공하는 컨트롤러입니다.</p>
 *
 * @author Glimpse Team
 * @version 1.0
 * @since 2025-01-02
 */
@Slf4j
@RestController
@RequestMapping("/api/v1/upload")
@RequiredArgsConstructor
@Tag(name = "File Upload", description = "파일 업로드 API")
public class FileUploadController {

    @Value("${file.upload-dir:./uploads}")
    private String uploadDir;

    @Value("${file.max-size:10485760}") // 10MB
    private long maxFileSize;

    private static final String[] ALLOWED_IMAGE_TYPES = {
            "image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"
    };

    /**
     * 프로필 이미지 업로드
     */
    @PostMapping("/profile")
    @Operation(summary = "프로필 이미지 업로드", description = "사용자 프로필 이미지를 업로드합니다")
    public ResponseEntity<ApiResponse<Map<String, String>>> uploadProfileImage(
            @RequestParam("file") MultipartFile file,
            @RequestParam("userId") String userId) {
        log.info("POST /api/v1/upload/profile - Uploading profile image for user: {}", userId);

        try {
            // 파일 유효성 검사
            validateImageFile(file);

            // 파일 저장
            String fileName = saveFile(file, "profile", userId);

            // 파일 URL 생성
            String fileUrl = generateFileUrl(fileName);

            Map<String, String> result = new HashMap<>();
            result.put("url", fileUrl);
            result.put("fileName", fileName);

            ApiResponse<Map<String, String>> response = ApiResponse.<Map<String, String>>builder()
                    .success(true)
                    .data(result)
                    .message("프로필 이미지가 업로드되었습니다")
                    .build();

            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            log.error("Invalid file: {}", e.getMessage());
            ApiResponse<Map<String, String>> response = ApiResponse.<Map<String, String>>builder()
                    .success(false)
                    .message(e.getMessage())
                    .build();
            return ResponseEntity.badRequest().body(response);
        } catch (IOException e) {
            log.error("Failed to upload file: {}", e.getMessage(), e);
            ApiResponse<Map<String, String>> response = ApiResponse.<Map<String, String>>builder()
                    .success(false)
                    .message("파일 업로드에 실패했습니다")
                    .build();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }

    /**
     * 그룹 이미지 업로드
     */
    @PostMapping("/group")
    @Operation(summary = "그룹 이미지 업로드", description = "그룹 커버 이미지를 업로드합니다")
    public ResponseEntity<ApiResponse<Map<String, String>>> uploadGroupImage(
            @RequestParam("file") MultipartFile file,
            @RequestParam("groupId") String groupId) {
        log.info("POST /api/v1/upload/group - Uploading group image for group: {}", groupId);

        try {
            validateImageFile(file);
            String fileName = saveFile(file, "group", groupId);
            String fileUrl = generateFileUrl(fileName);

            Map<String, String> result = new HashMap<>();
            result.put("url", fileUrl);
            result.put("fileName", fileName);

            ApiResponse<Map<String, String>> response = ApiResponse.<Map<String, String>>builder()
                    .success(true)
                    .data(result)
                    .message("그룹 이미지가 업로드되었습니다")
                    .build();

            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            ApiResponse<Map<String, String>> response = ApiResponse.<Map<String, String>>builder()
                    .success(false)
                    .message(e.getMessage())
                    .build();
            return ResponseEntity.badRequest().body(response);
        } catch (IOException e) {
            log.error("Failed to upload file: {}", e.getMessage(), e);
            ApiResponse<Map<String, String>> response = ApiResponse.<Map<String, String>>builder()
                    .success(false)
                    .message("파일 업로드에 실패했습니다")
                    .build();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }

    /**
     * 채팅 이미지 업로드
     */
    @PostMapping("/chat")
    @Operation(summary = "채팅 이미지 업로드", description = "채팅 메시지 이미지를 업로드합니다")
    public ResponseEntity<ApiResponse<Map<String, String>>> uploadChatImage(
            @RequestParam("file") MultipartFile file,
            @RequestParam("chatRoomId") String chatRoomId,
            @RequestParam("userId") String userId) {
        log.info("POST /api/v1/upload/chat - Uploading chat image for room: {}", chatRoomId);

        try {
            validateImageFile(file);
            String fileName = saveFile(file, "chat", chatRoomId + "_" + userId);
            String fileUrl = generateFileUrl(fileName);

            Map<String, String> result = new HashMap<>();
            result.put("url", fileUrl);
            result.put("fileName", fileName);

            ApiResponse<Map<String, String>> response = ApiResponse.<Map<String, String>>builder()
                    .success(true)
                    .data(result)
                    .message("이미지가 업로드되었습니다")
                    .build();

            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            ApiResponse<Map<String, String>> response = ApiResponse.<Map<String, String>>builder()
                    .success(false)
                    .message(e.getMessage())
                    .build();
            return ResponseEntity.badRequest().body(response);
        } catch (IOException e) {
            log.error("Failed to upload file: {}", e.getMessage(), e);
            ApiResponse<Map<String, String>> response = ApiResponse.<Map<String, String>>builder()
                    .success(false)
                    .message("파일 업로드에 실패했습니다")
                    .build();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }

    /**
     * 파일 유효성 검사
     */
    private void validateImageFile(MultipartFile file) {
        if (file.isEmpty()) {
            throw new IllegalArgumentException("파일이 비어있습니다");
        }

        if (file.getSize() > maxFileSize) {
            throw new IllegalArgumentException("파일 크기가 너무 큽니다 (최대 " + (maxFileSize / 1024 / 1024) + "MB)");
        }

        String contentType = file.getContentType();
        boolean isAllowedType = false;
        for (String allowedType : ALLOWED_IMAGE_TYPES) {
            if (allowedType.equals(contentType)) {
                isAllowedType = true;
                break;
            }
        }

        if (!isAllowedType) {
            throw new IllegalArgumentException("지원하지 않는 파일 형식입니다");
        }
    }

    /**
     * 파일 저장
     */
    private String saveFile(MultipartFile file, String category, String identifier) throws IOException {
        // 디렉토리 생성
        Path uploadPath = Paths.get(uploadDir, category);
        if (!Files.exists(uploadPath)) {
            Files.createDirectories(uploadPath);
        }

        // 고유한 파일명 생성
        String originalFilename = file.getOriginalFilename();
        String extension = "";
        if (originalFilename != null && originalFilename.contains(".")) {
            extension = originalFilename.substring(originalFilename.lastIndexOf("."));
        }

        String fileName = category + "_" + identifier + "_" + UUID.randomUUID().toString() + extension;
        Path filePath = uploadPath.resolve(fileName);

        // 파일 저장
        Files.copy(file.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);

        log.info("File saved: {}", filePath);

        return category + "/" + fileName;
    }

    /**
     * 파일 URL 생성
     */
    private String generateFileUrl(String fileName) {
        // 개발 환경: 로컬 파일 경로
        // 프로덕션: CDN URL 또는 S3 URL 반환
        return "/uploads/" + fileName;
    }
}


