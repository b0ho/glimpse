package com.glimpse.server;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.autoconfigure.jdbc.DataSourceAutoConfiguration;
import org.springframework.boot.autoconfigure.orm.jpa.HibernateJpaAutoConfiguration;
import org.springframework.web.bind.annotation.*;

import java.util.*;
import java.time.Instant;

/**
 * Glimpse 간소화 REST API 서버
 *
 * <p>데이터베이스 없이 메모리 기반으로 동작하는 개발용 Mock API 서버입니다.
 * 모바일 앱 개발 시 백엔드 서버 구축 전에 빠르게 프로토타입을 테스트할 수 있습니다.</p>
 *
 * <p>주요 특징:</p>
 * <ul>
 *   <li>DataSource와 JPA 자동 구성 제외 (메모리 기반 운영)</li>
 *   <li>CORS 전체 허용 (개발 환경용)</li>
 *   <li>개발 모드 인증 (x-dev-auth: true 헤더)</li>
 *   <li>포트 3001에서 실행</li>
 * </ul>
 *
 * <p>제공하는 API 카테고리:</p>
 * <ul>
 *   <li>인증 (로그인)</li>
 *   <li>사용자 프로필</li>
 *   <li>그룹 조회</li>
 *   <li>콘텐츠 관리</li>
 *   <li>매칭 시스템</li>
 *   <li>채팅 (메모리 기반)</li>
 *   <li>관심사 매칭</li>
 * </ul>
 *
 * @author Glimpse Team
 * @version 1.0
 * @since 2025-01-14
 */
@SpringBootApplication(exclude = {
    DataSourceAutoConfiguration.class,
    HibernateJpaAutoConfiguration.class
})
@RestController
@CrossOrigin(origins = "*")
public class SimpleRestServer {

    /** 채팅 메시지 메모리 저장소 (서버 재시작 시 초기화됨) */
    private static final List<Map<String, Object>> chatMessages = Collections.synchronizedList(new ArrayList<>());

    /**
     * Spring Boot 애플리케이션 진입점
     *
     * <p>포트 3001에서 서버를 시작합니다.</p>
     *
     * @param args 명령줄 인수
     */
    public static void main(String[] args) {
        System.setProperty("server.port", "3001");
        SpringApplication.run(SimpleRestServer.class, args);
    }
    
    /**
     * 서버 헬스 체크 엔드포인트
     *
     * @param devAuth 개발 모드 인증 헤더 (x-dev-auth)
     * @return 서버 상태 정보
     */
    @GetMapping("/api/v1/health")
    public Map<String, Object> health(@RequestHeader(value = "x-dev-auth", required = false) String devAuth) {
        Map<String, Object> response = new HashMap<>();
        response.put("status", "ok");
        response.put("message", "Spring Boot REST server is running");
        response.put("server", "server2-rest");
        response.put("devMode", "true".equals(devAuth));
        response.put("timestamp", System.currentTimeMillis());
        return response;
    }
    
    /**
     * 그룹 목록 조회 (Mock 데이터)
     *
     * @param devAuth 개발 모드 인증 헤더
     * @param page 페이지 번호 (기본값: 1)
     * @param limit 페이지당 항목 수 (기본값: 10)
     * @return 그룹 목록 및 페이징 정보
     */
    @GetMapping("/api/v1/groups")
    public Map<String, Object> getGroups(
            @RequestHeader(value = "x-dev-auth", required = false) String devAuth,
            @RequestParam(value = "page", defaultValue = "1") int page,
            @RequestParam(value = "limit", defaultValue = "10") int limit) {
        Map<String, Object> response = new HashMap<>();
        
        if (!"true".equals(devAuth)) {
            response.put("error", "Unauthorized");
            response.put("message", "Development authentication required");
            return response;
        }
        
        List<Map<String, Object>> groups = new ArrayList<>();
        
        Map<String, Object> group1 = new HashMap<>();
        group1.put("id", "group-1");
        group1.put("name", "서강대학교");
        group1.put("type", "OFFICIAL");
        group1.put("memberCount", 1234);
        group1.put("maleCount", 654);
        group1.put("femaleCount", 580);
        group1.put("description", "서강대학교 공식 그룹입니다");
        group1.put("isMatchingActive", true);
        group1.put("createdAt", "2025-01-14T10:00:00Z");
        group1.put("updatedAt", "2025-01-14T10:00:00Z");
        group1.put("creatorId", "admin");
        group1.put("location", Map.of(
            "address", "서울 마포구 서강대로",
            "latitude", 37.5512,
            "longitude", 126.9409
        ));
        groups.add(group1);
        
        Map<String, Object> group2 = new HashMap<>();
        group2.put("id", "group-2");
        group2.put("name", "강남 러닝 크루");
        group2.put("type", "CREATED");
        group2.put("memberCount", 89);
        group2.put("maleCount", 45);
        group2.put("femaleCount", 44);
        group2.put("description", "강남에서 함께 러닝하는 크루입니다");
        group2.put("isMatchingActive", true);
        group2.put("createdAt", "2025-01-13T15:00:00Z");
        group2.put("updatedAt", "2025-01-13T15:00:00Z");
        group2.put("creatorId", "user123");
        group2.put("location", Map.of(
            "address", "서울 강남구 테헤란로",
            "latitude", 37.5013,
            "longitude", 127.0377
        ));
        groups.add(group2);
        
        response.put("success", true);
        response.put("data", groups);
        return response;
    }
    
    /**
     * 특정 그룹 상세 정보 조회 (Mock 데이터)
     *
     * @param groupId 조회할 그룹 ID
     * @param devAuth 개발 모드 인증 헤더
     * @return 그룹 상세 정보
     */
    @GetMapping("/api/v1/groups/{groupId}")
    public Map<String, Object> getGroupDetail(
            @PathVariable String groupId,
            @RequestHeader(value = "x-dev-auth", required = false) String devAuth) {
        Map<String, Object> response = new HashMap<>();
        
        if (!"true".equals(devAuth)) {
            response.put("error", "Unauthorized");
            return response;
        }
        
        Map<String, Object> group = new HashMap<>();
        group.put("id", groupId);
        group.put("name", "서강대학교 IT학과");
        group.put("description", "서강대학교 IT학과 학생들의 모임입니다");
        group.put("type", "OFFICIAL");
        group.put("memberCount", 46);
        group.put("isMatchingActive", true);
        group.put("location", Map.of(
            "address", "서울 마포구 서강대로",
            "latitude", 37.5512,
            "longitude", 126.9409
        ));
        
        response.put("success", true);
        response.put("data", group);
        return response;
    }
    
    /**
     * 콘텐츠 목록 조회 (Mock 데이터)
     *
     * @param devAuth 개발 모드 인증 헤더
     * @return 콘텐츠 리스트
     */
    @GetMapping("/api/v1/contents")
    public Map<String, Object> getContents(
            @RequestHeader(value = "x-dev-auth", required = false) String devAuth) {
        Map<String, Object> response = new HashMap<>();
        
        if (!"true".equals(devAuth)) {
            response.put("error", "Unauthorized");
            return response;
        }
        
        List<Map<String, Object>> contents = new ArrayList<>();
        
        Map<String, Object> content1 = new HashMap<>();
        content1.put("id", "content-1");
        content1.put("type", "POST");
        content1.put("author", Map.of("id", "user-1", "nickname", "김철수"));
        content1.put("content", "오늘 날씨가 정말 좋네요!");
        content1.put("likeCount", 12);
        content1.put("commentCount", 3);
        content1.put("createdAt", System.currentTimeMillis());
        contents.add(content1);
        
        response.put("success", true);
        response.put("data", contents);
        return response;
    }
    
    /**
     * 매칭 목록 조회 (Mock 데이터)
     *
     * @param devAuth 개발 모드 인증 헤더
     * @return 매칭된 사용자 리스트 및 페이징 정보
     */
    @GetMapping("/api/v1/matching/matches")
    public Map<String, Object> getMatches(
            @RequestHeader(value = "x-dev-auth", required = false) String devAuth) {
        Map<String, Object> response = new HashMap<>();
        
        if (!"true".equals(devAuth)) {
            response.put("error", "Unauthorized");
            return response;
        }
        
        List<Map<String, Object>> matches = new ArrayList<>();
        
        Map<String, Object> match1 = new HashMap<>();
        match1.put("id", "match-1");
        match1.put("user", Map.of(
            "id", "user-3",
            "nickname", "별님",
            "profileImageUrl", "https://example.com/profile1.jpg"
        ));
        match1.put("matchedAt", System.currentTimeMillis() - 86400000);
        match1.put("lastMessage", "안녕하세요!");
        match1.put("unreadCount", 2);
        matches.add(match1);
        
        Map<String, Object> data = new HashMap<>();
        data.put("matches", matches);
        data.put("total", 1);
        data.put("page", 1);
        data.put("hasMore", false);
        
        response.put("success", true);
        response.put("data", data);
        return response;
    }
    
    /**
     * 사용자 프로필 조회 (Mock 데이터)
     *
     * @param devAuth 개발 모드 인증 헤더
     * @return 사용자 프로필 정보
     */
    @GetMapping("/api/v1/users/profile")
    public Map<String, Object> getUserProfile(
            @RequestHeader(value = "x-dev-auth", required = false) String devAuth) {
        Map<String, Object> response = new HashMap<>();
        
        if (!"true".equals(devAuth)) {
            response.put("error", "Unauthorized");
            return response;
        }
        
        Map<String, Object> profile = new HashMap<>();
        profile.put("id", "test-user-001");
        profile.put("nickname", "테스트 사용자");
        profile.put("phoneNumber", "+821012345678");
        profile.put("isPremium", true);
        profile.put("premiumType", "MONTHLY");
        profile.put("credits", 10);
        profile.put("joinedGroups", 5);
        
        response.put("success", true);
        response.put("data", profile);
        return response;
    }
    
    /**
     * 현재 로그인한 사용자 정보 조회 (Mock 데이터)
     *
     * @param devAuth 개발 모드 인증 헤더
     * @return 현재 사용자 정보
     */
    @GetMapping("/api/v1/users/me")
    public Map<String, Object> getCurrentUser(@RequestHeader(value = "x-dev-auth", required = false) String devAuth) {
        Map<String, Object> response = new HashMap<>();
        
        if (!"true".equals(devAuth)) {
            response.put("error", "Unauthorized");
            response.put("message", "Development authentication required");
            return response;
        }
        
        response.put("id", "test-user-001");
        response.put("nickname", "테스트 사용자");
        response.put("phoneNumber", "+821012345678");
        response.put("isVerified", true);
        response.put("credits", 10);
        response.put("isPremium", false);
        response.put("success", true);
        
        return response;
    }
    
    /**
     * 매칭별 채팅 메시지 조회 (메모리 기반)
     *
     * @param matchId 매칭 ID
     * @param devAuth 개발 모드 인증 헤더
     * @return 해당 매칭의 메시지 리스트
     */
    @GetMapping("/api/v1/chat/messages/{matchId}")
    public Map<String, Object> getMessages(
            @PathVariable String matchId,
            @RequestHeader(value = "x-dev-auth", required = false) String devAuth) {
        Map<String, Object> response = new HashMap<>();
        
        if (!"true".equals(devAuth)) {
            response.put("error", "Unauthorized");
            return response;
        }
        
        // 해당 matchId의 메시지들 필터링
        List<Map<String, Object>> matchMessages = chatMessages.stream()
            .filter(msg -> matchId.equals(msg.get("matchId")))
            .collect(ArrayList::new, (list, msg) -> list.add(msg), ArrayList::addAll);
        
        response.put("success", true);
        response.put("data", matchMessages);
        return response;
    }
    
    /**
     * 채팅 메시지 전송 (메모리에 저장)
     *
     * @param matchId 매칭 ID
     * @param message 전송할 메시지 데이터
     * @param devAuth 개발 모드 인증 헤더
     * @return 저장된 메시지 정보
     */
    @PostMapping("/api/v1/chat/messages/{matchId}/send")
    public Map<String, Object> sendMessage(
            @PathVariable String matchId,
            @RequestBody Map<String, Object> message,
            @RequestHeader(value = "x-dev-auth", required = false) String devAuth) {
        Map<String, Object> response = new HashMap<>();
        
        if (!"true".equals(devAuth)) {
            response.put("error", "Unauthorized");
            return response;
        }
        
        // 메시지 저장
        message.put("matchId", matchId);
        message.put("id", "msg_" + System.currentTimeMillis());
        message.put("createdAt", new Date());
        chatMessages.add(message);
        
        response.put("success", true);
        response.put("data", message);
        return response;
    }
    
    /**
     * 채팅방 나가기 (해당 매칭의 메시지 삭제)
     *
     * @param matchId 매칭 ID
     * @param devAuth 개발 모드 인증 헤더
     * @return 성공 메시지
     */
    @DeleteMapping("/api/v1/chat/{matchId}/leave")
    public Map<String, Object> leaveChat(
            @PathVariable String matchId,
            @RequestHeader(value = "x-dev-auth", required = false) String devAuth) {
        Map<String, Object> response = new HashMap<>();
        
        if (!"true".equals(devAuth)) {
            response.put("error", "Unauthorized");
            return response;
        }
        
        // 해당 매치의 메시지 삭제
        chatMessages.removeIf(msg -> matchId.equals(msg.get("matchId")));
        
        response.put("success", true);
        response.put("message", "Successfully left chat");
        return response;
    }
    
    /**
     * 관심사 기반 검색 결과 조회 (Mock 데이터)
     *
     * @param devAuth 개발 모드 인증 헤더
     * @return 관심사 검색 결과
     */
    @GetMapping("/api/v1/interest/searches")
    public Map<String, Object> getInterestSearches(
            @RequestHeader(value = "x-dev-auth", required = false) String devAuth) {
        Map<String, Object> response = new HashMap<>();
        
        if (!"true".equals(devAuth)) {
            response.put("error", "Unauthorized");
            return response;
        }
        
        Map<String, Object> data = new HashMap<>();
        data.put("searches", new ArrayList<>());
        data.put("total", 0);
        
        response.put("success", true);
        response.put("data", data);
        return response;
    }
    
    /**
     * 관심사 기반 매칭 결과 조회 (Mock 데이터)
     *
     * @param devAuth 개발 모드 인증 헤더
     * @return 관심사 매칭 결과
     */
    @GetMapping("/api/v1/interest/matches")
    public Map<String, Object> getInterestMatches(
            @RequestHeader(value = "x-dev-auth", required = false) String devAuth) {
        Map<String, Object> response = new HashMap<>();
        
        if (!"true".equals(devAuth)) {
            response.put("error", "Unauthorized");
            return response;
        }
        
        Map<String, Object> data = new HashMap<>();
        data.put("matches", new ArrayList<>());
        data.put("total", 0);
        
        response.put("success", true);
        response.put("data", data);
        return response;
    }
    
    /**
     * 사용자의 관심사 검색 상태 조회 (Mock 데이터)
     *
     * @param devAuth 개발 모드 인증 헤더
     * @return 남은 검색 횟수 등 상태 정보
     */
    @GetMapping("/api/v1/interest/secure/my-status")
    public Map<String, Object> getInterestStatus(
            @RequestHeader(value = "x-dev-auth", required = false) String devAuth) {
        Map<String, Object> response = new HashMap<>();
        
        if (!"true".equals(devAuth)) {
            response.put("error", "Unauthorized");
            return response;
        }
        
        Map<String, Object> data = new HashMap<>();
        data.put("status", "active");
        data.put("remainingSearches", 3);
        
        response.put("success", true);
        response.put("data", data);
        return response;
    }
    
    /**
     * 로그인 (Mock 인증)
     *
     * @param request 로그인 요청 데이터 (phoneNumber 등)
     * @return 액세스 토큰 및 사용자 정보
     */
    @PostMapping("/api/v1/auth/login")
    public Map<String, Object> login(@RequestBody Map<String, String> request) {
        Map<String, Object> response = new HashMap<>();
        
        Map<String, Object> user = new HashMap<>();
        user.put("id", "test-user-001");
        user.put("nickname", "테스트 사용자");
        
        response.put("accessToken", "test-token-12345");
        response.put("refreshToken", "refresh-token-67890");
        response.put("user", user);
        response.put("success", true);
        
        return response;
    }
    
    /**
     * FCM 푸시 알림 토큰 등록
     *
     * @param devAuth 개발 모드 인증 헤더
     * @param request FCM 토큰 데이터
     * @return 등록 성공 메시지
     */
    @PostMapping("/api/v1/users/fcm/token")
    public Map<String, Object> registerFcmToken(
            @RequestHeader(value = "x-dev-auth", required = false) String devAuth,
            @RequestBody Map<String, String> request) {
        Map<String, Object> response = new HashMap<>();
        
        if (!"true".equals(devAuth)) {
            response.put("error", "Unauthorized");
            return response;
        }
        
        response.put("success", true);
        response.put("message", "FCM token registered");
        return response;
    }
}