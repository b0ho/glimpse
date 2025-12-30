package com.glimpse.server.entity;

import com.glimpse.server.entity.enums.InviteStatus;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.GenericGenerator;

import java.time.LocalDateTime;

/**
 * 그룹 초대 엔티티
 *
 * <p>사용자가 다른 사용자를 그룹에 초대하는 기능을 관리합니다.
 * 초대는 전화번호나 이메일을 통해 발송되며, 고유한 초대 코드를 생성하여
 * 초대받은 사람이 그룹에 참여할 수 있도록 합니다.</p>
 *
 * <p>주요 관계:</p>
 * <ul>
 *   <li>@ManyToOne - Group: 초대 대상 그룹 (LAZY 로딩, 필수)</li>
 *   <li>@ManyToOne - User (inviter): 초대를 보낸 사용자 (LAZY 로딩, 필수)</li>
 * </ul>
 *
 * <p>주요 기능:</p>
 * <ul>
 *   <li>그룹 초대 생성 및 관리</li>
 *   <li>초대 코드 발급 및 검증</li>
 *   <li>초대 상태 추적 (PENDING, ACCEPTED, DECLINED)</li>
 *   <li>만료 시간 관리 및 유효성 검증</li>
 *   <li>수락/거절 시간 기록</li>
 * </ul>
 *
 * <p>초대 생명주기:</p>
 * <ol>
 *   <li>초대 생성: inviter가 inviteePhone/Email로 초대 발송</li>
 *   <li>대기 상태: status = PENDING, expiresAt 설정</li>
 *   <li>수락: accept() 메서드 호출, status = ACCEPTED</li>
 *   <li>거절: decline() 메서드 호출, status = DECLINED</li>
 *   <li>만료: expiresAt 시간 경과 시 isExpired() = true</li>
 * </ol>
 *
 * @author Glimpse Team
 * @version 1.0
 * @since 2025-01-14
 */
@Entity
@Table(name = "group_invite")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class GroupInvite extends BaseEntity {

    /**
     * 그룹 초대 고유 식별자
     * <p>CUID 생성 전략을 사용하여 충돌 없는 고유한 ID를 자동 생성합니다.
     * CUID는 분산 시스템에서도 안전하게 사용할 수 있는 정렬 가능한 고유 식별자입니다.</p>
     */
    @Id
    @GeneratedValue(generator = "cuid")
    @GenericGenerator(name = "cuid", strategy = "com.glimpse.server.util.CuidGenerator")
    @Column(name = "id")
    private String id;

    /**
     * 초대 대상 그룹
     * <p>사용자가 초대받을 그룹을 나타냅니다.
     * LAZY 로딩을 사용하여 초대 정보 조회 시 그룹 정보는 필요할 때만 로드됩니다.</p>
     *
     * <p>특징:</p>
     * <ul>
     *   <li>필수값: 모든 초대는 반드시 그룹과 연결되어야 함</li>
     *   <li>LAZY 로딩: 성능 최적화를 위한 지연 로딩</li>
     *   <li>CASCADE 없음: 그룹 삭제 시 초대는 별도 처리 필요</li>
     * </ul>
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "group_id", nullable = false)
    private Group group;

    /**
     * 초대를 보낸 사용자
     * <p>그룹 초대를 발송한 사용자입니다.
     * 초대한 사용자는 그룹의 멤버이거나 관리자여야 합니다.</p>
     *
     * <p>특징:</p>
     * <ul>
     *   <li>필수값: 모든 초대는 발신자가 있어야 함</li>
     *   <li>LAZY 로딩: 필요 시에만 초대자 정보 로드</li>
     *   <li>권한 검증: 초대 생성 시 그룹 멤버십 확인 필요</li>
     * </ul>
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "inviter_id", nullable = false)
    private User inviter;

    /**
     * 초대받을 사용자의 전화번호
     * <p>초대장을 받을 사용자의 전화번호입니다.
     * inviteeEmail과 함께 선택적으로 사용되며, 둘 중 하나는 반드시 있어야 합니다.</p>
     *
     * <p>용도:</p>
     * <ul>
     *   <li>SMS를 통한 초대 발송</li>
     *   <li>전화번호로 사용자 매칭</li>
     *   <li>초대 코드 전달</li>
     * </ul>
     */
    @Column(name = "invitee_phone")
    private String inviteePhone;

    /**
     * 초대받을 사용자의 이메일
     * <p>초대장을 받을 사용자의 이메일 주소입니다.
     * inviteePhone과 함께 선택적으로 사용되며, 둘 중 하나는 반드시 있어야 합니다.</p>
     *
     * <p>용도:</p>
     * <ul>
     *   <li>이메일을 통한 초대 발송</li>
     *   <li>이메일로 사용자 매칭</li>
     *   <li>초대 코드 전달</li>
     * </ul>
     */
    @Column(name = "invitee_email")
    private String inviteeEmail;

    /**
     * 그룹 초대 코드
     * <p>초대를 고유하게 식별하는 코드입니다.
     * 초대받은 사람이 이 코드를 입력하여 그룹에 참여할 수 있습니다.</p>
     *
     * <p>특징:</p>
     * <ul>
     *   <li>고유성: 데이터베이스 레벨에서 유일성 보장 (unique = true)</li>
     *   <li>보안: 예측 불가능한 랜덤 문자열 (예: UUID 또는 난수 기반)</li>
     *   <li>사용자 친화적: 짧고 입력하기 쉬운 형태 권장</li>
     *   <li>일회성: 한 번 사용되면 재사용 불가</li>
     * </ul>
     */
    @Column(name = "invite_code", unique = true)
    private String inviteCode;

    /**
     * 초대 상태
     * <p>초대의 현재 상태를 나타냅니다.
     * PENDING(대기), ACCEPTED(수락), DECLINED(거절) 중 하나의 값을 가집니다.</p>
     *
     * <p>상태 전이:</p>
     * <ul>
     *   <li>PENDING → ACCEPTED: accept() 메서드 호출</li>
     *   <li>PENDING → DECLINED: decline() 메서드 호출</li>
     *   <li>ACCEPTED/DECLINED: 최종 상태, 더 이상 변경 불가</li>
     * </ul>
     *
     * <p>기본값: PENDING (초대 생성 시 자동 설정)</p>
     */
    @Enumerated(EnumType.STRING)
    @Column(name = "status")
    @Builder.Default
    private InviteStatus status = InviteStatus.PENDING;

    /**
     * 초대 만료 시간
     * <p>초대가 유효한 마지막 시각입니다.
     * 이 시간이 지나면 초대를 더 이상 수락할 수 없습니다.</p>
     *
     * <p>특징:</p>
     * <ul>
     *   <li>보안: 오래된 초대 코드의 무단 사용 방지</li>
     *   <li>관리: 만료된 초대 자동 정리 가능</li>
     *   <li>유효성 검증: isExpired() 메서드로 확인</li>
     *   <li>권장 기간: 7일 ~ 30일</li>
     * </ul>
     */
    @Column(name = "expires_at")
    private LocalDateTime expiresAt;

    /**
     * 초대 수락 시간
     * <p>초대받은 사용자가 초대를 수락한 시각입니다.
     * accept() 메서드 호출 시 자동으로 현재 시간이 기록됩니다.</p>
     *
     * <p>용도:</p>
     * <ul>
     *   <li>수락 이력 추적</li>
     *   <li>통계 분석 (초대 수락률, 평균 응답 시간 등)</li>
     *   <li>감사 로그</li>
     * </ul>
     */
    @Column(name = "accepted_at")
    private LocalDateTime acceptedAt;

    /**
     * 초대 거절 시간
     * <p>초대받은 사용자가 초대를 거절한 시각입니다.
     * decline() 메서드 호출 시 자동으로 현재 시간이 기록됩니다.</p>
     *
     * <p>용도:</p>
     * <ul>
     *   <li>거절 이력 추적</li>
     *   <li>통계 분석 (초대 거절률 등)</li>
     *   <li>감사 로그</li>
     * </ul>
     */
    @Column(name = "declined_at")
    private LocalDateTime declinedAt;

    /**
     * 초대 메시지
     * <p>초대를 보낼 때 포함할 개인화된 메시지입니다.
     * 초대자가 초대받은 사람에게 전달하고 싶은 내용을 자유롭게 작성할 수 있습니다.</p>
     *
     * <p>특징:</p>
     * <ul>
     *   <li>선택적 필드: 메시지 없이도 초대 가능</li>
     *   <li>개인화: 초대 수락률 향상에 기여</li>
     *   <li>최대 길이: 데이터베이스 컬럼 타입에 따라 제한 (예: VARCHAR(500))</li>
     *   <li>XSS 방지: 프론트엔드에서 적절한 이스케이프 처리 필요</li>
     * </ul>
     */
    @Column(name = "message")
    private String message;

    /**
     * 초대 만료 여부를 확인합니다
     *
     * <p>현재 시간이 expiresAt을 초과했는지 확인하여
     * 초대가 만료되었는지 판단합니다.</p>
     *
     * <p>동작 방식:</p>
     * <ul>
     *   <li>expiresAt이 null인 경우: false 반환 (만료 시간 없음 = 무제한)</li>
     *   <li>expiresAt이 현재 시간 이전: true 반환 (만료됨)</li>
     *   <li>expiresAt이 현재 시간 이후: false 반환 (유효함)</li>
     * </ul>
     *
     * <p>사용 예시:</p>
     * <pre>{@code
     * if (groupInvite.isExpired()) {
     *     throw new InviteExpiredException("초대가 만료되었습니다.");
     * }
     * }</pre>
     *
     * @return 만료되었으면 true, 유효하면 false
     */
    public boolean isExpired() {
        return expiresAt != null && expiresAt.isBefore(LocalDateTime.now());
    }

    /**
     * 초대를 수락합니다
     *
     * <p>초대 상태를 ACCEPTED로 변경하고 수락 시간을 기록합니다.
     * 이 메서드는 초대받은 사용자가 초대를 승인할 때 호출됩니다.</p>
     *
     * <p>수행 작업:</p>
     * <ul>
     *   <li>status를 InviteStatus.ACCEPTED로 변경</li>
     *   <li>acceptedAt을 현재 시간으로 설정</li>
     * </ul>
     *
     * <p>주의사항:</p>
     * <ul>
     *   <li>만료 여부를 먼저 확인해야 함 (isExpired() 체크)</li>
     *   <li>이미 수락/거절된 초대는 다시 수락할 수 없음 (상태 검증 필요)</li>
     *   <li>실제 그룹 멤버십 추가는 별도 로직에서 처리</li>
     *   <li>트랜잭션 내에서 호출 필요 (영속성 컨텍스트 관리)</li>
     * </ul>
     *
     * <p>사용 예시:</p>
     * <pre>{@code
     * if (invite.isExpired()) {
     *     throw new InviteExpiredException();
     * }
     * if (invite.getStatus() != InviteStatus.PENDING) {
     *     throw new InvalidInviteStatusException();
     * }
     * invite.accept();
     * groupMemberService.addMember(invite.getGroup(), user);
     * }</pre>
     */
    public void accept() {
        this.status = InviteStatus.ACCEPTED;
        this.acceptedAt = LocalDateTime.now();
    }

    /**
     * 초대를 거절합니다
     *
     * <p>초대 상태를 DECLINED로 변경하고 거절 시간을 기록합니다.
     * 이 메서드는 초대받은 사용자가 초대를 거부할 때 호출됩니다.</p>
     *
     * <p>수행 작업:</p>
     * <ul>
     *   <li>status를 InviteStatus.DECLINED로 변경</li>
     *   <li>declinedAt을 현재 시간으로 설정</li>
     * </ul>
     *
     * <p>주의사항:</p>
     * <ul>
     *   <li>만료 여부와 관계없이 거절 가능</li>
     *   <li>이미 수락/거절된 초대는 다시 거절할 수 없음 (상태 검증 필요)</li>
     *   <li>거절 후에는 동일한 초대 코드로 재수락 불가</li>
     *   <li>트랜잭션 내에서 호출 필요 (영속성 컨텍스트 관리)</li>
     * </ul>
     *
     * <p>사용 예시:</p>
     * <pre>{@code
     * if (invite.getStatus() != InviteStatus.PENDING) {
     *     throw new InvalidInviteStatusException();
     * }
     * invite.decline();
     * notificationService.notifyInviter(invite, "거절됨");
     * }</pre>
     */
    public void decline() {
        this.status = InviteStatus.DECLINED;
        this.declinedAt = LocalDateTime.now();
    }
}