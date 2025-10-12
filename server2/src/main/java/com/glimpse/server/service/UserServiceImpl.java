package com.glimpse.server.service;

import com.glimpse.server.dto.user.CreateUserDto;
import com.glimpse.server.dto.user.UpdateUserDto;
import com.glimpse.server.dto.user.UserDto;
import com.glimpse.server.entity.User;
import com.glimpse.server.entity.enums.PremiumLevel;
import com.glimpse.server.repository.UserRepository;
import com.glimpse.server.util.CuidGenerator;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * User Service Implementation
 *
 * <p>사용자 관련 비즈니스 로직을 구현하는 서비스입니다.</p>
 *
 * @author Glimpse Team
 * @version 1.0
 * @since 2025-01-14
 */
@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class UserServiceImpl implements UserService {

    private final UserRepository userRepository;

    @Override
    @Transactional
    public UserDto createUser(CreateUserDto createUserDto) {
        log.info("Creating new user with phone number: {}", createUserDto.getPhoneNumber());

        // 전화번호 중복 체크
        if (userRepository.existsByPhoneNumber(createUserDto.getPhoneNumber())) {
            throw new IllegalArgumentException("이미 등록된 전화번호입니다: " + createUserDto.getPhoneNumber());
        }

        // 익명 ID 생성
        String anonymousId = "anon_" + UUID.randomUUID().toString().substring(0, 8);

        // User 엔티티 생성
        User user = User.builder()
                .phoneNumber(createUserDto.getPhoneNumber())
                .nickname(createUserDto.getNickname())
                .age(createUserDto.getAge())
                .gender(createUserDto.getGender())
                .profileImage(createUserDto.getProfileImage())
                .bio(createUserDto.getBio())
                .clerkId(createUserDto.getClerkId())
                .anonymousId(anonymousId)
                .companyName(createUserDto.getCompanyName())
                .education(createUserDto.getEducation())
                .location(createUserDto.getLocation())
                .height(createUserDto.getHeight())
                .mbti(createUserDto.getMbti())
                .isVerified(false)
                .credits(1)
                .isPremium(false)
                .premiumLevel(PremiumLevel.FREE)
                .lastActive(LocalDateTime.now())
                .build();

        User savedUser = userRepository.save(user);
        log.info("User created successfully with ID: {}", savedUser.getId());

        return convertToDto(savedUser);
    }

    @Override
    public Optional<UserDto> getUserById(String id) {
        log.debug("Getting user by ID: {}", id);
        return userRepository.findById(id)
                .filter(user -> user.getDeletedAt() == null)
                .map(this::convertToDto);
    }

    @Override
    public Optional<User> getUserEntityById(String id) {
        log.debug("Getting user entity by ID: {}", id);
        return userRepository.findById(id)
                .filter(user -> user.getDeletedAt() == null);
    }

    @Override
    public Optional<UserDto> getUserByPhoneNumber(String phoneNumber) {
        log.debug("Getting user by phone number: {}", phoneNumber);
        return userRepository.findByPhoneNumber(phoneNumber)
                .filter(user -> user.getDeletedAt() == null)
                .map(this::convertToDto);
    }

    @Override
    public Optional<UserDto> getUserByClerkId(String clerkId) {
        log.debug("Getting user by Clerk ID: {}", clerkId);
        return userRepository.findByClerkId(clerkId)
                .filter(user -> user.getDeletedAt() == null)
                .map(this::convertToDto);
    }

    @Override
    public Optional<UserDto> getUserByAnonymousId(String anonymousId) {
        log.debug("Getting user by anonymous ID: {}", anonymousId);
        return userRepository.findByAnonymousId(anonymousId)
                .filter(user -> user.getDeletedAt() == null)
                .map(this::convertToDto);
    }

    @Override
    @Transactional
    public UserDto updateUser(String id, UpdateUserDto updateUserDto) {
        log.info("Updating user: {}", id);

        User user = userRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다: " + id));

        // 업데이트할 필드들 설정
        if (updateUserDto.getNickname() != null) {
            user.setNickname(updateUserDto.getNickname());
        }
        if (updateUserDto.getAge() != null) {
            user.setAge(updateUserDto.getAge());
        }
        if (updateUserDto.getProfileImage() != null) {
            user.setProfileImage(updateUserDto.getProfileImage());
        }
        if (updateUserDto.getBio() != null) {
            user.setBio(updateUserDto.getBio());
        }
        if (updateUserDto.getCompanyName() != null) {
            user.setCompanyName(updateUserDto.getCompanyName());
        }
        if (updateUserDto.getEducation() != null) {
            user.setEducation(updateUserDto.getEducation());
        }
        if (updateUserDto.getLocation() != null) {
            user.setLocation(updateUserDto.getLocation());
        }
        if (updateUserDto.getHeight() != null) {
            user.setHeight(updateUserDto.getHeight());
        }
        if (updateUserDto.getMbti() != null) {
            user.setMbti(updateUserDto.getMbti());
        }
        if (updateUserDto.getDrinking() != null) {
            user.setDrinking(updateUserDto.getDrinking());
        }
        if (updateUserDto.getSmoking() != null) {
            user.setSmoking(updateUserDto.getSmoking());
        }
        if (updateUserDto.getInterests() != null) {
            user.setInterests(updateUserDto.getInterests());
        }

        User updatedUser = userRepository.save(user);
        log.info("User updated successfully: {}", id);

        return convertToDto(updatedUser);
    }

    @Override
    @Transactional
    public void deleteUser(String id, String reason) {
        log.info("Deleting user: {}", id);

        User user = userRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다: " + id));

        user.setDeletedAt(LocalDateTime.now());
        user.setDeletionReason(reason);
        userRepository.save(user);

        log.info("User deleted successfully: {}", id);
    }

    @Override
    public List<UserDto> getActiveUsers() {
        log.debug("Getting all active users");
        return userRepository.findAllActive()
                .stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }

    @Override
    public List<UserDto> getPremiumUsers() {
        log.debug("Getting all premium users");
        return userRepository.findActivePremiumUsers(LocalDateTime.now())
                .stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }

    @Override
    public List<UserDto> getActiveUsersSince(LocalDateTime since) {
        log.debug("Getting active users since: {}", since);
        return userRepository.findActiveUsersSince(since)
                .stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public UserDto addCredits(String userId, int amount) {
        log.info("Adding {} credits to user: {}", amount, userId);

        if (amount <= 0) {
            throw new IllegalArgumentException("크레딧 양은 양수여야 합니다");
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다: " + userId));

        user.setCredits(user.getCredits() + amount);
        User updatedUser = userRepository.save(user);

        log.info("Credits added successfully. New balance: {}", updatedUser.getCredits());
        return convertToDto(updatedUser);
    }

    @Override
    @Transactional
    public UserDto deductCredits(String userId, int amount) {
        log.info("Deducting {} credits from user: {}", amount, userId);

        if (amount <= 0) {
            throw new IllegalArgumentException("크레딧 양은 양수여야 합니다");
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다: " + userId));

        if (user.getCredits() < amount) {
            throw new IllegalArgumentException("크레딧이 부족합니다. 현재: " + user.getCredits() + ", 필요: " + amount);
        }

        user.setCredits(user.getCredits() - amount);
        User updatedUser = userRepository.save(user);

        log.info("Credits deducted successfully. New balance: {}", updatedUser.getCredits());
        return convertToDto(updatedUser);
    }

    @Override
    @Transactional
    public UserDto activatePremium(String userId, LocalDateTime until) {
        log.info("Activating premium for user: {} until {}", userId, until);

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다: " + userId));

        user.setIsPremium(true);
        user.setPremiumLevel(PremiumLevel.PREMIUM);
        user.setPremiumUntil(until);
        User updatedUser = userRepository.save(user);

        log.info("Premium activated successfully for user: {}", userId);
        return convertToDto(updatedUser);
    }

    @Override
    @Transactional
    public UserDto deactivatePremium(String userId) {
        log.info("Deactivating premium for user: {}", userId);

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다: " + userId));

        user.setIsPremium(false);
        user.setPremiumLevel(PremiumLevel.FREE);
        user.setPremiumUntil(null);
        User updatedUser = userRepository.save(user);

        log.info("Premium deactivated successfully for user: {}", userId);
        return convertToDto(updatedUser);
    }

    @Override
    @Transactional
    public void updateLastActive(String userId) {
        log.debug("Updating last active time for user: {}", userId);

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다: " + userId));

        user.updateLastActive();
        userRepository.save(user);
    }

    @Override
    public boolean existsByPhoneNumber(String phoneNumber) {
        return userRepository.existsByPhoneNumber(phoneNumber);
    }

    @Override
    public boolean existsByEmail(String email) {
        return userRepository.existsByEmail(email);
    }

    @Override
    public boolean existsByNickname(String nickname) {
        return userRepository.existsByNickname(nickname);
    }

    @Override
    public long countActiveUsers() {
        return userRepository.countActiveUsers();
    }

    @Override
    public long countPremiumUsers() {
        return userRepository.countPremiumUsers(LocalDateTime.now());
    }

    /**
     * User 엔티티를 UserDto로 변환합니다.
     *
     * @param user User 엔티티
     * @return UserDto
     */
    private UserDto convertToDto(User user) {
        return UserDto.builder()
                .id(user.getId())
                .clerkId(user.getClerkId())
                .anonymousId(user.getAnonymousId())
                .phoneNumber(user.getPhoneNumber())
                .nickname(user.getNickname())
                .age(user.getAge())
                .gender(user.getGender())
                .profileImage(user.getProfileImage())
                .bio(user.getBio())
                .isVerified(user.getIsVerified())
                .credits(user.getCredits())
                .isPremium(user.getIsPremium())
                .premiumLevel(user.getPremiumLevel())
                .premiumUntil(user.getPremiumUntil())
                .lastActive(user.getLastActive())
                .lastOnline(user.getLastOnline())
                .companyName(user.getCompanyName())
                .education(user.getEducation())
                .location(user.getLocation())
                .height(user.getHeight())
                .mbti(user.getMbti())
                .drinking(user.getDrinking())
                .smoking(user.getSmoking())
                .interests(user.getInterests())
                .groups(user.getGroups())
                .createdAt(user.getCreatedAt())
                .updatedAt(user.getUpdatedAt())
                .build();
    }
}
