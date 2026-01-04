package com.glimpse.server.controller;

import com.glimpse.server.dto.chat.ChatMessageDto;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.handler.annotation.SendTo;
import org.springframework.messaging.simp.SimpMessageHeaderAccessor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.CrossOrigin;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

/**
 * WebSocket Chat Controller
 *
 * <p>STOMP over WebSocket을 사용한 실시간 채팅 메시지 처리 컨트롤러입니다.</p>
 *
 * @author Glimpse Team
 * @version 1.0
 * @since 2025-01-02
 */
@Slf4j
@Controller
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class WebSocketChatController {

    private final SimpMessagingTemplate messagingTemplate;

    /**
     * 채팅방에 메시지 전송
     * 
     * @param chatRoomId 채팅방 ID
     * @param message 메시지 내용
     * @return 전송된 메시지
     */
    @MessageMapping("/chat/{chatRoomId}")
    @SendTo("/topic/chat/{chatRoomId}")
    public ChatMessageDto sendMessage(
            @DestinationVariable String chatRoomId,
            @Payload ChatMessageDto message,
            SimpMessageHeaderAccessor headerAccessor) {
        
        log.info("WebSocket message received - ChatRoom: {}, From: {}, Type: {}", 
                chatRoomId, message.getSenderId(), message.getType());
        
        // 메시지에 타임스탬프 추가
        message.setTimestamp(LocalDateTime.now());
        
        return message;
    }

    /**
     * 특정 사용자에게 직접 메시지 전송
     * 
     * @param userId 수신자 ID
     * @param message 메시지 내용
     */
    @MessageMapping("/private/{userId}")
    public void sendPrivateMessage(
            @DestinationVariable String userId,
            @Payload ChatMessageDto message) {
        
        log.info("Private message - To: {}, From: {}", userId, message.getSenderId());
        
        message.setTimestamp(LocalDateTime.now());
        messagingTemplate.convertAndSendToUser(userId, "/queue/private", message);
    }

    /**
     * 채팅방 입장 알림
     * 
     * @param chatRoomId 채팅방 ID
     * @param headerAccessor WebSocket 세션 헤더
     * @return 입장 알림 메시지
     */
    @MessageMapping("/chat/{chatRoomId}/join")
    @SendTo("/topic/chat/{chatRoomId}")
    public Map<String, Object> joinChatRoom(
            @DestinationVariable String chatRoomId,
            SimpMessageHeaderAccessor headerAccessor) {
        
        Object userIdObj = headerAccessor.getSessionAttributes() != null 
                ? headerAccessor.getSessionAttributes().get("userId") 
                : null;
        
        if (userIdObj == null) {
            log.error("WebSocket session userId not found");
            throw new IllegalStateException("인증되지 않은 WebSocket 연결입니다");
        }
        
        String userId = userIdObj.toString();
        log.info("User {} joined chat room {}", userId, chatRoomId);
        
        Map<String, Object> message = new HashMap<>();
        message.put("type", "JOIN");
        message.put("userId", userId);
        message.put("chatRoomId", chatRoomId);
        message.put("timestamp", LocalDateTime.now());
        
        return message;
    }

    /**
     * 채팅방 퇴장 알림
     * 
     * @param chatRoomId 채팅방 ID
     * @param headerAccessor WebSocket 세션 헤더
     * @return 퇴장 알림 메시지
     */
    @MessageMapping("/chat/{chatRoomId}/leave")
    @SendTo("/topic/chat/{chatRoomId}")
    public Map<String, Object> leaveChatRoom(
            @DestinationVariable String chatRoomId,
            SimpMessageHeaderAccessor headerAccessor) {
        
        Object userIdObj = headerAccessor.getSessionAttributes() != null 
                ? headerAccessor.getSessionAttributes().get("userId") 
                : null;
        
        if (userIdObj == null) {
            log.error("WebSocket session userId not found");
            throw new IllegalStateException("인증되지 않은 WebSocket 연결입니다");
        }
        
        String userId = userIdObj.toString();
        log.info("User {} left chat room {}", userId, chatRoomId);
        
        Map<String, Object> message = new HashMap<>();
        message.put("type", "LEAVE");
        message.put("userId", userId);
        message.put("chatRoomId", chatRoomId);
        message.put("timestamp", LocalDateTime.now());
        
        return message;
    }

    /**
     * 타이핑 상태 알림
     * 
     * @param chatRoomId 채팅방 ID
     * @param data 타이핑 데이터
     */
    @MessageMapping("/chat/{chatRoomId}/typing")
    public void sendTypingStatus(
            @DestinationVariable String chatRoomId,
            @Payload Map<String, Object> data) {
        
        log.debug("Typing status - ChatRoom: {}, User: {}", chatRoomId, data.get("userId"));
        
        messagingTemplate.convertAndSend("/topic/chat/" + chatRoomId + "/typing", data);
    }

    /**
     * 읽음 상태 업데이트
     * 
     * @param chatRoomId 채팅방 ID
     * @param data 읽음 데이터
     */
    @MessageMapping("/chat/{chatRoomId}/read")
    public void sendReadStatus(
            @DestinationVariable String chatRoomId,
            @Payload Map<String, Object> data) {
        
        log.debug("Read status - ChatRoom: {}, User: {}, MessageId: {}", 
                chatRoomId, data.get("userId"), data.get("messageId"));
        
        messagingTemplate.convertAndSend("/topic/chat/" + chatRoomId + "/read", data);
    }

    /**
     * 온라인 상태 브로드캐스트
     * 
     * @param data 사용자 상태 데이터
     */
    @MessageMapping("/status/online")
    @SendTo("/topic/status")
    public Map<String, Object> broadcastOnlineStatus(@Payload Map<String, Object> data) {
        log.debug("Online status broadcast - User: {}", data.get("userId"));
        data.put("timestamp", LocalDateTime.now());
        return data;
    }
}


