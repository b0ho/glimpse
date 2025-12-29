package com.glimpse.server.service;

import com.glimpse.server.dto.user.CreateUserDto;
import com.glimpse.server.dto.user.UpdateUserDto;
import com.glimpse.server.dto.user.UserDto;
import com.glimpse.server.entity.User;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

/**
 * User Service Interface
 *
 * <p>사용자 관련 비즈니스 로직을 처리하는 서비스입니다.</p>
 *
 * <p>주요 기능:</p>
 * <ul>
 *   <li>사용자 CRUD 작업</li>
 *   <li>크레딧 및 프리미엄 구독 관리</li>
 *   <li>프로필 정보 관리</li>
 *   <li>사용자 검색 및 필터링</li>
 * </ul>
 *
 * @author Glimpse Team
 * @version 1.0
 * @since 2025-01-14
 */
public interface UserService {

    /**
     * 새로운 사용자를 생성합니다.
     *
     * @param createUserDto 사용자 생성 정보
     * @return 생성된 사용자 DTO
     * @throws IllegalArgumentException 중복된 전화번호나 이메일인 경우
     */
    UserDto createUser(CreateUserDto createUserDto);

    /**
     * ID로 사용자를 조회합니다.
     *
     * @param id 사용자 ID
     * @return 사용자 DTO (Optional)
     */
    Optional<UserDto> getUserById(String id);

    /**
     * ID로 사용자 엔티티를 조회합니다.
     *
     * @param id 사용자 ID
     * @return 사용자 엔티티 (Optional)
     */
    Optional<User> getUserEntityById(String id);

    /**
     * 전화번호로 사용자를 조회합니다.
     *
     * @param phoneNumber 전화번호
     * @return 사용자 DTO (Optional)
     */
    Optional<UserDto> getUserByPhoneNumber(String phoneNumber);

    /**
     * Clerk ID로 사용자를 조회합니다.
     *
     * @param clerkId Clerk 사용자 ID
     * @return 사용자 DTO (Optional)
     */
    Optional<UserDto> getUserByClerkId(String clerkId);

    /**
     * 익명 ID로 사용자를 조회합니다.
     *
     * @param anonymousId 익명 ID
     * @return 사용자 DTO (Optional)
     */
    Optional<UserDto> getUserByAnonymousId(String anonymousId);

    /**
     * 사용자 정보를 업데이트합니다.
     *
     * @param id 사용자 ID
     * @param updateUserDto 업데이트할 사용자 정보
     * @return 업데이트된 사용자 DTO
     * @throws IllegalArgumentException 사용자를 찾을 수 없는 경우
     */
    UserDto updateUser(String id, UpdateUserDto updateUserDto);

    /**
     * 사용자를 삭제합니다 (Soft Delete).
     *
     * @param id 사용자 ID
     * @param reason 삭제 사유
     * @throws IllegalArgumentException 사용자를 찾을 수 없는 경우
     */
    void deleteUser(String id, String reason);

    /**
     * 활성 사용자 목록을 조회합니다.
     *
     * @return 활성 사용자 DTO 목록
     */
    List<UserDto> getActiveUsers();

    /**
     * 프리미엄 사용자 목록을 조회합니다.
     *
     * @return 프리미엄 사용자 DTO 목록
     */
    List<UserDto> getPremiumUsers();

    /**
     * 특정 시간 이후 활동한 사용자 목록을 조회합니다.
     *
     * @param since 조회 시작 시각
     * @return 활동한 사용자 DTO 목록
     */
    List<UserDto> getActiveUsersSince(LocalDateTime since);

    /**
     * 사용자의 크레딧을 추가합니다.
     *
     * @param userId 사용자 ID
     * @param amount 추가할 크레딧 양
     * @return 업데이트된 사용자 DTO
     * @throws IllegalArgumentException 사용자를 찾을 수 없거나 양수가 아닌 경우
     */
    UserDto addCredits(String userId, int amount);

    /**
     * 사용자의 크레딧을 차감합니다.
     *
     * @param userId 사용자 ID
     * @param amount 차감할 크레딧 양
     * @return 업데이트된 사용자 DTO
     * @throws IllegalArgumentException 사용자를 찾을 수 없거나 크레딧이 부족한 경우
     */
    UserDto deductCredits(String userId, int amount);

    /**
     * 사용자의 프리미엄 구독을 활성화합니다.
     *
     * @param userId 사용자 ID
     * @param until 프리미엄 만료 시각
     * @return 업데이트된 사용자 DTO
     * @throws IllegalArgumentException 사용자를 찾을 수 없는 경우
     */
    UserDto activatePremium(String userId, LocalDateTime until);

    /**
     * 사용자의 프리미엄 구독을 취소합니다.
     *
     * @param userId 사용자 ID
     * @return 업데이트된 사용자 DTO
     * @throws IllegalArgumentException 사용자를 찾을 수 없는 경우
     */
    UserDto deactivatePremium(String userId);

    /**
     * 사용자의 마지막 활동 시각을 업데이트합니다.
     *
     * @param userId 사용자 ID
     * @throws IllegalArgumentException 사용자를 찾을 수 없는 경우
     */
    void updateLastActive(String userId);

    /**
     * 전화번호 중복 여부를 확인합니다.
     *
     * @param phoneNumber 전화번호
     * @return 중복이면 true, 아니면 false
     */
    boolean existsByPhoneNumber(String phoneNumber);

    /**
     * 이메일 중복 여부를 확인합니다.
     *
     * @param email 이메일
     * @return 중복이면 true, 아니면 false
     */
    boolean existsByEmail(String email);

    /**
     * 닉네임 중복 여부를 확인합니다.
     *
     * @param nickname 닉네임
     * @return 중복이면 true, 아니면 false
     */
    boolean existsByNickname(String nickname);

    /**
     * 활성 사용자 수를 조회합니다.
     *
     * @return 활성 사용자 수
     */
    long countActiveUsers();

    /**
     * 프리미엄 사용자 수를 조회합니다.
     *
     * @return 프리미엄 사용자 수
     */
    long countPremiumUsers();
}
