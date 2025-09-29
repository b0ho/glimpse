package com.glimpse.server.service;

import com.glimpse.server.entity.Match;
import com.glimpse.server.entity.enums.MatchStatus;
import com.glimpse.server.repository.MatchRepositoryNew;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional(readOnly = true)
public class MatchServiceImpl {
    
    private final MatchRepositoryNew matchRepository;
    
    // Native Query 활용 - 매치 목록 with 상세 정보
    public List<Map<String, Object>> getUserMatches(String userId) {
        List<Object[]> results = matchRepository.findUserMatchesWithDetails(userId);
        List<Map<String, Object>> matches = new ArrayList<>();
        
        for (Object[] row : results) {
            Match match = (Match) row[0];
            String matchedUserNickname = (String) row[1];
            String matchedUserImage = (String) row[2];
            Long unreadCount = row[3] != null ? ((Number) row[3]).longValue() : 0L;
            String lastMessage = (String) row[4];
            LocalDateTime lastMessageTime = row[5] != null ? 
                ((java.sql.Timestamp) row[5]).toLocalDateTime() : null;
            
            Map<String, Object> matchData = new HashMap<>();
            matchData.put("id", match.getId());
            matchData.put("matchedAt", match.getCreatedAt());
            matchData.put("matchedUser", Map.of(
                "nickname", matchedUserNickname != null ? matchedUserNickname : "익명",
                "profileImage", matchedUserImage
            ));
            matchData.put("unreadCount", unreadCount);
            matchData.put("lastMessage", lastMessage);
            matchData.put("lastMessageTime", lastMessageTime);
            matchData.put("isActive", MatchStatus.ACTIVE.equals(match.getStatus()));
            
            matches.add(matchData);
        }
        
        return matches;
    }
    
    // Native Query 활용 - 매치 통계
    public Map<String, Object> getMatchStatistics(String userId) {
        LocalDateTime thirtyDaysAgo = LocalDateTime.now().minusDays(30);
        Object result = matchRepository.getMatchStatistics(userId, thirtyDaysAgo);
        
        if (result instanceof Object[]) {
            Object[] row = (Object[]) result;
            Map<String, Object> stats = new HashMap<>();
            stats.put("totalMatches", row[0] != null ? ((Number) row[0]).longValue() : 0L);
            stats.put("recentMatches", row[1] != null ? ((Number) row[1]).longValue() : 0L);
            stats.put("activeChats", row[2] != null ? ((Number) row[2]).longValue() : 0L);
            stats.put("avgMatchAgeHours", row[3] != null ? ((Number) row[3]).doubleValue() : 0.0);
            return stats;
        }
        
        return Map.of(
            "totalMatches", 0L,
            "recentMatches", 0L,
            "activeChats", 0L,
            "avgMatchAgeHours", 0.0
        );
    }
    
    @Transactional
    public Match createMatch(String user1Id, String user2Id) {
        // 이미 매치가 존재하는지 확인
        Optional<Match> existing = matchRepository.findByUser1IdAndUser2Id(user1Id, user2Id);
        if (existing.isPresent()) {
            return existing.get();
        }
        
        // 역방향 확인
        existing = matchRepository.findByUser1IdAndUser2Id(user2Id, user1Id);
        if (existing.isPresent()) {
            return existing.get();
        }
        
        // 새 매치 생성
        Match match = Match.builder()
            .status(MatchStatus.ACTIVE)
            .build();
        
        match = matchRepository.save(match);
        log.info("Created new match between {} and {}", user1Id, user2Id);
        return match;
    }
    
    @Transactional
    public void processPendingMutualLikes() {
        LocalDateTime sevenDaysAgo = LocalDateTime.now().minusDays(7);
        List<Object[]> pendingLikes = matchRepository.findPendingMutualLikes(sevenDaysAgo, 100);
        
        int processedCount = 0;
        for (Object[] row : pendingLikes) {
            String senderId = (String) row[0];
            String receiverId = (String) row[1];
            
            try {
                createMatch(senderId, receiverId);
                processedCount++;
            } catch (Exception e) {
                log.error("Failed to create match for {} and {}: {}", 
                    senderId, receiverId, e.getMessage());
            }
        }
        
        log.info("Processed {} pending mutual likes into matches", processedCount);
    }
}