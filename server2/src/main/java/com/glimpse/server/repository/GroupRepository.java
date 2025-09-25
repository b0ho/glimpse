package com.glimpse.server.repository;

import com.glimpse.server.entity.Group;
import com.glimpse.server.entity.enums.GroupType;
import com.glimpse.server.entity.enums.GroupCategory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * Group Repository
 */
@Repository
public interface GroupRepository extends JpaRepository<Group, String> {
    
    Optional<Group> findByInviteCode(String inviteCode);
    
    List<Group> findByType(GroupType type);
    
    List<Group> findByCategory(GroupCategory category);
    
    List<Group> findByIsPublicTrueAndIsActiveTrue();
    
    Page<Group> findByIsPublicTrueAndIsActiveTrue(Pageable pageable);
    
    @Query("SELECT g FROM Group g WHERE g.isOfficial = true AND g.isActive = true")
    List<Group> findOfficialGroups();
    
    @Query("SELECT g FROM Group g WHERE g.creator.id = :userId")
    List<Group> findByCreatorId(@Param("userId") String userId);
    
    @Query("SELECT g FROM Group g JOIN g.members m WHERE m.user.id = :userId AND m.isActive = true")
    List<Group> findGroupsByUserId(@Param("userId") String userId);
    
    @Query("SELECT g FROM Group g WHERE " +
           "g.isActive = true AND g.isPublic = true AND " +
           "(LOWER(g.name) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
           "LOWER(g.description) LIKE LOWER(CONCAT('%', :keyword, '%')))")
    Page<Group> searchGroups(@Param("keyword") String keyword, Pageable pageable);
    
    @Query("SELECT g FROM Group g WHERE " +
           "g.type = 'LOCATION' AND g.isActive = true AND " +
           "g.latitude BETWEEN :minLat AND :maxLat AND " +
           "g.longitude BETWEEN :minLng AND :maxLng")
    List<Group> findNearbyGroups(@Param("minLat") double minLat,
                                 @Param("maxLat") double maxLat,
                                 @Param("minLng") double minLng,
                                 @Param("maxLng") double maxLng);
    
    @Query("SELECT COUNT(m) FROM GroupMember m WHERE m.group.id = :groupId AND m.isActive = true")
    long countActiveMembers(@Param("groupId") String groupId);
    
    @Query("SELECT g FROM Group g WHERE g.verificationRequired = true")
    List<Group> findGroupsRequiringVerification();
    
    boolean existsByName(String name);
}