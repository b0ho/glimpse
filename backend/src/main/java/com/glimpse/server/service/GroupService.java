package com.glimpse.server.service;

import com.glimpse.server.dto.group.CreateGroupDto;
import com.glimpse.server.dto.group.GroupDto;
import com.glimpse.server.dto.group.UpdateGroupDto;
import com.glimpse.server.entity.Group;
import com.glimpse.server.entity.enums.GroupCategory;
import com.glimpse.server.entity.enums.GroupType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;
import java.util.Optional;

/**
 * Group Service Interface
 *
 * <p>그룹 관련 비즈니스 로직을 처리하는 서비스입니다.</p>
 *
 * <p>주요 기능:</p>
 * <ul>
 *   <li>그룹 CRUD 작업</li>
 *   <li>그룹 검색 및 필터링</li>
 *   <li>위치 기반 그룹 조회</li>
 *   <li>그룹 멤버 관리</li>
 * </ul>
 *
 * @author Glimpse Team
 * @version 1.0
 * @since 2025-01-14
 */
public interface GroupService {

    /**
     * 새로운 그룹을 생성합니다.
     *
     * @param createGroupDto 그룹 생성 정보
     * @param creatorId 생성자 사용자 ID
     * @return 생성된 그룹 DTO
     * @throws IllegalArgumentException 중복된 그룹 이름이거나 생성자를 찾을 수 없는 경우
     */
    GroupDto createGroup(CreateGroupDto createGroupDto, String creatorId);

    /**
     * ID로 그룹을 조회합니다.
     *
     * @param id 그룹 ID
     * @return 그룹 DTO (Optional)
     */
    Optional<GroupDto> getGroupById(String id);

    /**
     * ID로 그룹 엔티티를 조회합니다.
     *
     * @param id 그룹 ID
     * @return 그룹 엔티티 (Optional)
     */
    Optional<Group> getGroupEntityById(String id);

    /**
     * 그룹 정보를 업데이트합니다.
     *
     * @param id 그룹 ID
     * @param updateGroupDto 업데이트할 그룹 정보
     * @return 업데이트된 그룹 DTO
     * @throws IllegalArgumentException 그룹을 찾을 수 없는 경우
     */
    GroupDto updateGroup(String id, UpdateGroupDto updateGroupDto);

    /**
     * 그룹을 삭제합니다 (비활성화).
     *
     * @param id 그룹 ID
     * @throws IllegalArgumentException 그룹을 찾을 수 없는 경우
     */
    void deleteGroup(String id);

    /**
     * 공개 활성 그룹 목록을 조회합니다.
     *
     * @return 공개 그룹 DTO 목록
     */
    List<GroupDto> getPublicGroups();

    /**
     * 공개 활성 그룹 목록을 페이징하여 조회합니다.
     *
     * @param pageable 페이징 정보
     * @return 공개 그룹 DTO 페이지
     */
    Page<GroupDto> getPublicGroupsPage(Pageable pageable);

    /**
     * 공식 그룹 목록을 조회합니다.
     *
     * @return 공식 그룹 DTO 목록
     */
    List<GroupDto> getOfficialGroups();

    /**
     * 특정 타입의 그룹 목록을 조회합니다.
     *
     * @param type 그룹 타입
     * @return 그룹 DTO 목록
     */
    List<GroupDto> getGroupsByType(GroupType type);

    /**
     * 특정 카테고리의 그룹 목록을 조회합니다.
     *
     * @param category 그룹 카테고리
     * @return 그룹 DTO 목록
     */
    List<GroupDto> getGroupsByCategory(GroupCategory category);

    /**
     * 특정 사용자가 생성한 그룹 목록을 조회합니다.
     *
     * @param userId 사용자 ID
     * @return 그룹 DTO 목록
     */
    List<GroupDto> getGroupsByCreator(String userId);

    /**
     * 특정 사용자가 가입한 그룹 목록을 조회합니다.
     *
     * @param userId 사용자 ID
     * @return 그룹 DTO 목록
     */
    List<GroupDto> getGroupsByUserId(String userId);

    /**
     * 키워드로 그룹을 검색합니다.
     *
     * @param keyword 검색 키워드
     * @param pageable 페이징 정보
     * @return 그룹 DTO 페이지
     */
    Page<GroupDto> searchGroups(String keyword, Pageable pageable);

    /**
     * 위치 기반으로 주변 그룹을 조회합니다.
     *
     * @param latitude 위도
     * @param longitude 경도
     * @param radiusKm 반경 (km)
     * @return 그룹 DTO 목록
     */
    List<GroupDto> getNearbyGroups(double latitude, double longitude, double radiusKm);

    /**
     * 초대 코드로 그룹을 조회합니다.
     *
     * @param inviteCode 초대 코드
     * @return 그룹 DTO (Optional)
     */
    Optional<GroupDto> getGroupByInviteCode(String inviteCode);

    /**
     * 그룹의 활성 멤버 수를 조회합니다.
     *
     * @param groupId 그룹 ID
     * @return 활성 멤버 수
     */
    long countActiveMembers(String groupId);

    /**
     * 그룹 이름 중복 여부를 확인합니다.
     *
     * @param name 그룹 이름
     * @return 중복이면 true, 아니면 false
     */
    boolean existsByName(String name);
}
