package com.glimpse.server.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;

/**
 * 모든 엔티티의 공통 기본 클래스
 *
 * <p>Glimpse 애플리케이션의 모든 엔티티가 상속하는 추상 부모 클래스로,
 * 생성 시간(createdAt)과 수정 시간(updatedAt)을 자동으로 관리합니다.
 * Spring Data JPA의 Auditing 기능을 활용하여 데이터 변경 이력을 추적합니다.</p>
 *
 * <p>주요 기능:</p>
 * <ul>
 *   <li>생성 시간 자동 기록 (@CreatedDate)</li>
 *   <li>수정 시간 자동 갱신 (@LastModifiedDate)</li>
 *   <li>JPA 생명주기 콜백 (@PrePersist, @PreUpdate)을 통한 시간 보장</li>
 *   <li>모든 하위 엔티티에 일관된 타임스탬프 필드 제공</li>
 * </ul>
 *
 * <p>기술적 특징:</p>
 * <ul>
 *   <li>@MappedSuperclass: 엔티티가 아닌 매핑 정보 상속 클래스</li>
 *   <li>@EntityListeners: Spring Data JPA Auditing 활성화</li>
 *   <li>updatable = false: createdAt은 생성 후 변경 불가</li>
 *   <li>nullable = false: 두 필드 모두 필수값</li>
 * </ul>
 *
 * <p>사용 예시:</p>
 * <pre>{@code
 * @Entity
 * public class User extends BaseEntity {
 *     // User는 자동으로 createdAt, updatedAt 필드를 가지게 됨
 * }
 * }</pre>
 *
 * @author Glimpse Team
 * @version 1.0
 * @since 2025-01-14
 * @see org.springframework.data.jpa.domain.support.AuditingEntityListener
 */
@MappedSuperclass
@EntityListeners(AuditingEntityListener.class)
@Getter
@Setter
public abstract class BaseEntity {

    /**
     * 엔티티 생성 시간
     * <p>엔티티가 데이터베이스에 처음 저장된 시각을 기록합니다.
     * Spring Data JPA의 @CreatedDate 어노테이션을 통해 자동으로 설정되며,
     * 한번 설정되면 변경할 수 없습니다(updatable = false).</p>
     *
     * <p>특징:</p>
     * <ul>
     *   <li>자동 설정: 엔티티 저장 시 현재 시간이 자동으로 기록됨</li>
     *   <li>변경 불가: 최초 생성 시간 보존을 위해 업데이트 불가</li>
     *   <li>필수값: null이 될 수 없음</li>
     *   <li>타임존: 서버의 기본 타임존 사용 (UTC 권장)</li>
     * </ul>
     */
    @CreatedDate
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    /**
     * 엔티티 수정 시간
     * <p>엔티티가 마지막으로 수정된 시각을 기록합니다.
     * Spring Data JPA의 @LastModifiedDate 어노테이션을 통해
     * 엔티티가 업데이트될 때마다 자동으로 현재 시간으로 갱신됩니다.</p>
     *
     * <p>특징:</p>
     * <ul>
     *   <li>자동 갱신: 엔티티 업데이트 시 자동으로 현재 시간으로 변경</li>
     *   <li>생성 시에도 설정: 최초 생성 시 createdAt과 동일한 값으로 설정</li>
     *   <li>필수값: null이 될 수 없음</li>
     *   <li>변경 이력: 마지막 수정 시간만 기록 (모든 변경 이력은 별도 관리 필요)</li>
     * </ul>
     */
    @LastModifiedDate
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    /**
     * 엔티티 생성 시 실행되는 JPA 생명주기 콜백
     *
     * <p>@PrePersist 어노테이션을 통해 엔티티가 데이터베이스에 저장되기 직전에
     * 자동으로 호출됩니다. Spring Data JPA Auditing이 실패하거나
     * 명시적으로 시간을 설정하지 않은 경우를 대비한 폴백 메커니즘입니다.</p>
     *
     * <p>동작 방식:</p>
     * <ul>
     *   <li>createdAt이 null인 경우에만 현재 시간으로 설정</li>
     *   <li>updatedAt이 null인 경우에만 현재 시간으로 설정</li>
     *   <li>이미 값이 있으면 기존 값 유지 (명시적 설정 존중)</li>
     * </ul>
     *
     * <p>주의사항:</p>
     * <ul>
     *   <li>트랜잭션 내에서 실행되므로 예외 발생 시 트랜잭션 롤백</li>
     *   <li>영속성 컨텍스트에 진입하기 전 단계에서 실행</li>
     *   <li>@CreatedDate/@LastModifiedDate가 우선적으로 동작</li>
     * </ul>
     *
     * @see jakarta.persistence.PrePersist
     */
    @PrePersist
    protected void onCreate() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
        if (updatedAt == null) {
            updatedAt = LocalDateTime.now();
        }
    }

    /**
     * 엔티티 업데이트 시 실행되는 JPA 생명주기 콜백
     *
     * <p>@PreUpdate 어노테이션을 통해 엔티티가 데이터베이스에서 업데이트되기 직전에
     * 자동으로 호출됩니다. 항상 updatedAt을 현재 시간으로 갱신하여
     * 마지막 수정 시간을 정확하게 추적합니다.</p>
     *
     * <p>동작 방식:</p>
     * <ul>
     *   <li>엔티티의 어떤 필드라도 변경되면 자동 실행</li>
     *   <li>updatedAt을 무조건 현재 시간으로 갱신</li>
     *   <li>@LastModifiedDate와 중복 실행되지만 안전성 보장</li>
     * </ul>
     *
     * <p>주의사항:</p>
     * <ul>
     *   <li>실제 값 변경이 없어도 merge() 호출 시 실행될 수 있음</li>
     *   <li>트랜잭션 내에서 실행되므로 예외 발생 시 트랜잭션 롤백</li>
     *   <li>벌크 업데이트(UPDATE 쿼리)에는 실행되지 않음</li>
     * </ul>
     *
     * @see jakarta.persistence.PreUpdate
     */
    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}