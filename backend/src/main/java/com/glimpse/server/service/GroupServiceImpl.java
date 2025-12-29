package com.glimpse.server.service;

import com.glimpse.server.dto.group.CreateGroupDto;
import com.glimpse.server.dto.group.GroupDto;
import com.glimpse.server.dto.group.UpdateGroupDto;
import com.glimpse.server.entity.Group;
import com.glimpse.server.entity.User;
import com.glimpse.server.entity.enums.GroupCategory;
import com.glimpse.server.entity.enums.GroupType;
import com.glimpse.server.repository.GroupRepository;
import com.glimpse.server.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Group Service Implementation
 *
 * <p>그룹 관련 비즈니스 로직을 구현하는 서비스입니다.</p>
 *
 * @author Glimpse Team
 * @version 1.0
 * @since 2025-01-14
 */
@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class GroupServiceImpl implements GroupService {

    private final GroupRepository groupRepository;
    private final UserRepository userRepository;

    @Override
    @Transactional
    public GroupDto createGroup(CreateGroupDto createGroupDto, String creatorId) {
        log.info("Creating new group: {} by user: {}", createGroupDto.getName(), creatorId);

        // 그룹 이름 중복 체크
        if (groupRepository.existsByName(createGroupDto.getName())) {
            throw new IllegalArgumentException("이미 존재하는 그룹 이름입니다: " + createGroupDto.getName());
        }

        // 생성자 확인
        User creator = userRepository.findById(creatorId)
                .orElseThrow(() -> new IllegalArgumentException("생성자를 찾을 수 없습니다: " + creatorId));

        // 초대 코드 생성 (비공개 그룹인 경우)
        String inviteCode = null;
        if (Boolean.FALSE.equals(createGroupDto.getIsPublic())) {
            inviteCode = "INV_" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
        }

        // Group 엔티티 생성
        Group group = Group.builder()
                .name(createGroupDto.getName())
                .description(createGroupDto.getDescription())
                .type(createGroupDto.getType())
                .category(createGroupDto.getCategory())
                .profileImage(createGroupDto.getProfileImage())
                .coverImage(createGroupDto.getCoverImage())
                .verificationRequired(createGroupDto.getVerificationRequired() != null ? createGroupDto.getVerificationRequired() : false)
                .verificationMethod(createGroupDto.getVerificationMethod())
                .maxMembers(createGroupDto.getMaxMembers())
                .isPublic(createGroupDto.getIsPublic() != null ? createGroupDto.getIsPublic() : true)
                .isActive(true)
                .isOfficial(false)
                .location(createGroupDto.getLocation())
                .latitude(createGroupDto.getLatitude())
                .longitude(createGroupDto.getLongitude())
                .radius(createGroupDto.getRadius())
                .inviteCode(inviteCode)
                .memberCount(0)
                .totalLikes(0)
                .totalMatches(0)
                .creator(creator)
                .build();

        // 태그 설정
        if (createGroupDto.getTags() != null) {
            group.setTags(createGroupDto.getTags());
        }

        Group savedGroup = groupRepository.save(group);
        log.info("Group created successfully with ID: {}", savedGroup.getId());

        return convertToDto(savedGroup);
    }

    @Override
    public Optional<GroupDto> getGroupById(String id) {
        log.debug("Getting group by ID: {}", id);
        return groupRepository.findById(id)
                .filter(Group::getIsActive)
                .map(this::convertToDto);
    }

    @Override
    public Optional<Group> getGroupEntityById(String id) {
        log.debug("Getting group entity by ID: {}", id);
        return groupRepository.findById(id)
                .filter(Group::getIsActive);
    }

    @Override
    @Transactional
    public GroupDto updateGroup(String id, UpdateGroupDto updateGroupDto) {
        log.info("Updating group: {}", id);

        Group group = groupRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("그룹을 찾을 수 없습니다: " + id));

        // 업데이트할 필드들 설정
        if (updateGroupDto.getName() != null) {
            // 이름 변경 시 중복 체크
            if (!group.getName().equals(updateGroupDto.getName()) && 
                groupRepository.existsByName(updateGroupDto.getName())) {
                throw new IllegalArgumentException("이미 존재하는 그룹 이름입니다: " + updateGroupDto.getName());
            }
            group.setName(updateGroupDto.getName());
        }
        if (updateGroupDto.getDescription() != null) {
            group.setDescription(updateGroupDto.getDescription());
        }
        if (updateGroupDto.getProfileImage() != null) {
            group.setProfileImage(updateGroupDto.getProfileImage());
        }
        if (updateGroupDto.getCoverImage() != null) {
            group.setCoverImage(updateGroupDto.getCoverImage());
        }
        if (updateGroupDto.getVerificationRequired() != null) {
            group.setVerificationRequired(updateGroupDto.getVerificationRequired());
        }
        if (updateGroupDto.getVerificationMethod() != null) {
            group.setVerificationMethod(updateGroupDto.getVerificationMethod());
        }
        if (updateGroupDto.getMaxMembers() != null) {
            group.setMaxMembers(updateGroupDto.getMaxMembers());
        }
        if (updateGroupDto.getIsPublic() != null) {
            group.setIsPublic(updateGroupDto.getIsPublic());
        }
        if (updateGroupDto.getLocation() != null) {
            group.setLocation(updateGroupDto.getLocation());
        }
        if (updateGroupDto.getTags() != null) {
            group.setTags(updateGroupDto.getTags());
        }

        Group updatedGroup = groupRepository.save(group);
        log.info("Group updated successfully: {}", id);

        return convertToDto(updatedGroup);
    }

    @Override
    @Transactional
    public void deleteGroup(String id) {
        log.info("Deleting group: {}", id);

        Group group = groupRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("그룹을 찾을 수 없습니다: " + id));

        group.setIsActive(false);
        groupRepository.save(group);

        log.info("Group deleted successfully: {}", id);
    }

    @Override
    public List<GroupDto> getPublicGroups() {
        log.debug("Getting all public groups");
        return groupRepository.findByIsPublicTrueAndIsActiveTrue()
                .stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }

    @Override
    public Page<GroupDto> getPublicGroupsPage(Pageable pageable) {
        log.debug("Getting public groups page: {}", pageable);
        return groupRepository.findByIsPublicTrueAndIsActiveTrue(pageable)
                .map(this::convertToDto);
    }

    @Override
    public List<GroupDto> getOfficialGroups() {
        log.debug("Getting all official groups");
        return groupRepository.findOfficialGroups()
                .stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }

    @Override
    public List<GroupDto> getGroupsByType(GroupType type) {
        log.debug("Getting groups by type: {}", type);
        return groupRepository.findByType(type)
                .stream()
                .filter(Group::getIsActive)
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }

    @Override
    public List<GroupDto> getGroupsByCategory(GroupCategory category) {
        log.debug("Getting groups by category: {}", category);
        return groupRepository.findByCategory(category)
                .stream()
                .filter(Group::getIsActive)
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }

    @Override
    public List<GroupDto> getGroupsByCreator(String userId) {
        log.debug("Getting groups by creator: {}", userId);
        return groupRepository.findByCreatorId(userId)
                .stream()
                .filter(Group::getIsActive)
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }

    @Override
    public List<GroupDto> getGroupsByUserId(String userId) {
        log.debug("Getting groups by user ID: {}", userId);
        return groupRepository.findGroupsByUserId(userId)
                .stream()
                .filter(Group::getIsActive)
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }

    @Override
    public Page<GroupDto> searchGroups(String keyword, Pageable pageable) {
        log.debug("Searching groups with keyword: {}", keyword);
        return groupRepository.searchGroups(keyword, pageable)
                .map(this::convertToDto);
    }

    @Override
    public List<GroupDto> getNearbyGroups(double latitude, double longitude, double radiusKm) {
        log.debug("Getting nearby groups at ({}, {}) within {}km", latitude, longitude, radiusKm);

        // Haversine 공식을 사용한 거리 계산을 위한 위도/경도 범위 계산
        // 1도 = 약 111km
        double latRange = radiusKm / 111.0;
        double lngRange = radiusKm / (111.0 * Math.cos(Math.toRadians(latitude)));

        double minLat = latitude - latRange;
        double maxLat = latitude + latRange;
        double minLng = longitude - lngRange;
        double maxLng = longitude + lngRange;

        List<Group> candidateGroups = groupRepository.findNearbyGroups(minLat, maxLat, minLng, maxLng);

        // 정확한 거리 계산 및 필터링
        return candidateGroups.stream()
                .filter(group -> {
                    if (group.getLatitude() == null || group.getLongitude() == null) {
                        return false;
                    }
                    double distance = calculateDistance(latitude, longitude, 
                                                       group.getLatitude(), group.getLongitude());
                    return distance <= radiusKm;
                })
                .filter(Group::getIsActive)
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }

    @Override
    public Optional<GroupDto> getGroupByInviteCode(String inviteCode) {
        log.debug("Getting group by invite code: {}", inviteCode);
        return groupRepository.findByInviteCode(inviteCode)
                .filter(Group::getIsActive)
                .map(this::convertToDto);
    }

    @Override
    public long countActiveMembers(String groupId) {
        log.debug("Counting active members for group: {}", groupId);
        return groupRepository.countActiveMembers(groupId);
    }

    @Override
    public boolean existsByName(String name) {
        return groupRepository.existsByName(name);
    }

    /**
     * Haversine 공식을 사용하여 두 지점 간의 거리를 계산합니다.
     *
     * @param lat1 첫 번째 지점의 위도
     * @param lon1 첫 번째 지점의 경도
     * @param lat2 두 번째 지점의 위도
     * @param lon2 두 번째 지점의 경도
     * @return 거리 (킬로미터)
     */
    private double calculateDistance(double lat1, double lon1, double lat2, double lon2) {
        final int EARTH_RADIUS = 6371; // 지구 반경 (km)

        double dLat = Math.toRadians(lat2 - lat1);
        double dLon = Math.toRadians(lon2 - lon1);

        double a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                   Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2)) *
                   Math.sin(dLon / 2) * Math.sin(dLon / 2);

        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

        return EARTH_RADIUS * c;
    }

    /**
     * Group 엔티티를 GroupDto로 변환합니다.
     *
     * @param group Group 엔티티
     * @return GroupDto
     */
    private GroupDto convertToDto(Group group) {
        return GroupDto.builder()
                .id(group.getId())
                .name(group.getName())
                .description(group.getDescription())
                .type(group.getType())
                .category(group.getCategory())
                .profileImage(group.getProfileImage())
                .coverImage(group.getCoverImage())
                .verificationRequired(group.getVerificationRequired())
                .verificationMethod(group.getVerificationMethod())
                .memberCount(group.getMemberCount())
                .maxMembers(group.getMaxMembers())
                .isPublic(group.getIsPublic())
                .isActive(group.getIsActive())
                .isOfficial(group.getIsOfficial())
                .location(group.getLocation())
                .latitude(group.getLatitude())
                .longitude(group.getLongitude())
                .radius(group.getRadius())
                .inviteCode(group.getInviteCode())
                .inviteCodeExpiresAt(group.getInviteCodeExpiresAt())
                .creatorId(group.getCreator() != null ? group.getCreator().getId() : null)
                .tags(group.getTags())
                .totalLikes(group.getTotalLikes())
                .totalMatches(group.getTotalMatches())
                .createdAt(group.getCreatedAt())
                .updatedAt(group.getUpdatedAt())
                .build();
    }
}
