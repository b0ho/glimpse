package com.glimpse.server.service;

import com.glimpse.server.entity.User;
import com.glimpse.server.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

/**
 * 사용자 서비스 (간소화 버전)
 */
@Service
@RequiredArgsConstructor
@Slf4j
@Transactional(readOnly = true)
public class UserService {
    
    private final UserRepository userRepository;
    
    /**
     * 사용자 ID로 조회
     */
    public Optional<User> findById(String userId) {
        return userRepository.findById(userId);
    }
    
    /**
     * 전화번호로 사용자 조회
     */
    public Optional<User> findByPhoneNumber(String phoneNumber) {
        return userRepository.findByPhoneNumber(phoneNumber);
    }
    
    /**
     * 모든 활성 사용자 조회
     */
    public List<User> findAllActive() {
        return userRepository.findAllActive();
    }
    
    /**
     * 사용자 수 조회
     */
    public long countActiveUsers() {
        return userRepository.countActiveUsers();
    }
}