package com.glimpse.server.repository;

import com.glimpse.server.entity.GroupMember;
import com.glimpse.server.entity.enums.GroupRole;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * GroupMember Repository
 */
@Repository
public interface GroupMemberRepository extends JpaRepository<GroupMember, String> {
    
    Optional<GroupMember> findByGroupIdAndUserId(String groupId, String userId);
    
    List<GroupMember> findByGroupId(String groupId);
    
    List<GroupMember> findByUserId(String userId);
    
    Page<GroupMember> findByGroupIdAndIsActiveTrue(String groupId, Pageable pageable);
    
    boolean existsByGroupIdAndUserIdAndIsActiveTrue(String groupId, String userId);
    
    @Query("SELECT gm FROM GroupMember gm WHERE gm.group.id = :groupId AND gm.role IN :roles AND gm.isActive = true")
    List<GroupMember> findByGroupIdAndRoles(@Param("groupId") String groupId, @Param("roles") List<GroupRole> roles);
    
    @Query("SELECT COUNT(gm) FROM GroupMember gm WHERE gm.group.id = :groupId AND gm.isActive = true")
    long countActiveMembers(@Param("groupId") String groupId);
    
    @Query("SELECT gm FROM GroupMember gm WHERE gm.group.id = :groupId AND gm.isVerified = false AND gm.isActive = true")
    List<GroupMember> findUnverifiedMembers(@Param("groupId") String groupId);
    
    void deleteByGroupIdAndUserId(String groupId, String userId);
}