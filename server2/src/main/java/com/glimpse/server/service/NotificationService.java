package com.glimpse.server.service;

import com.glimpse.server.entity.User;
import com.glimpse.server.repository.NotificationRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

/**
 * Notification Service
 * 알림 관련 비즈니스 로직
 */
@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class NotificationService {
    
    private final NotificationRepository notificationRepository;
    
    /**
     * 좋아요 알림 발송
     */
    public void sendLikeNotification(User receiver, User sender, boolean isAnonymous) {
        // TODO: Implement notification
        log.info("Like notification would be sent to user");
    }
    
    /**
     * 매칭 알림 발송
     */
    public void sendMatchNotification(User receiver, User otherUser) {
        // TODO: Implement notification
        log.info("Match notification would be sent to user");
    }
    
    /**
     * 메시지 알림 발송
     */
    public void sendMessageNotification(User receiver, User sender, String message) {
        // TODO: Implement notification
        log.info("Message notification would be sent to user");
    }
    
    /**
     * 시스템 알림 발송
     */
    public void sendSystemNotification(User user, String title, String content) {
        // TODO: Implement notification
        log.info("System notification would be sent to user");
    }
}