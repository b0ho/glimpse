package com.glimpse.server.entity;

import com.glimpse.server.entity.enums.SubscriptionStatus;
import com.glimpse.server.entity.enums.SubscriptionPlan;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.GenericGenerator;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * Subscription 엔티티
 *
 * <p>사용자의 프리미엄 구독을 나타내는 엔티티입니다.
 * 정기 결제를 통한 프리미엄 기능 이용권을 관리합니다.</p>
 *
 * <p>주요 관계:</p>
 * <ul>
 *   <li>@ManyToOne User: 구독 중인 사용자 (LAZY 로딩, nullable하지 않음)</li>
 * </ul>
 *
 * <p>주요 기능:</p>
 * <ul>
 *   <li>다양한 구독 플랜 지원 (BASIC, PREMIUM, VIP)</li>
 *   <li>구독 상태 관리 (ACTIVE, CANCELLED, EXPIRED, PAUSED)</li>
 *   <li>자동 갱신 설정</li>
 *   <li>외부 구독 시스템 연동 (Stripe)</li>
 *   <li>할인 및 프로모션 코드 지원</li>
 *   <li>월간/연간 결제 주기 관리</li>
 * </ul>
 *
 * @author Glimpse Team
 * @version 1.0
 * @since 2025-01-14
 */
@Entity
@Table(name = "Subscription")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Subscription extends BaseEntity {

    /**
     * 구독 고유 식별자
     * <p>CUID 전략을 사용하여 자동 생성됩니다.</p>
     */
    @Id
    @GeneratedValue(generator = "cuid")
    @GenericGenerator(name = "cuid", strategy = "com.glimpse.server.util.CuidGenerator")
    @Column(name = "id")
    private String id;

    /**
     * 구독 중인 사용자
     * <p>LAZY 로딩으로 성능을 최적화하며, null일 수 없습니다.</p>
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    /**
     * 구독 플랜
     * <p>SubscriptionPlan enum (BASIC, PREMIUM, VIP 등).
     * null일 수 없습니다.</p>
     */
    @Enumerated(EnumType.STRING)
    @Column(name = "plan", nullable = false)
    private SubscriptionPlan plan;

    /**
     * 구독 상태
     * <p>SubscriptionStatus enum (ACTIVE, CANCELLED, EXPIRED, PAUSED 등).
     * null일 수 없으며, 기본값: ACTIVE</p>
     */
    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    @Builder.Default
    private SubscriptionStatus status = SubscriptionStatus.ACTIVE;

    /**
     * 구독 시작 일시
     * <p>구독이 시작된 시각입니다. null일 수 없습니다.</p>
     */
    @Column(name = "started_at", nullable = false)
    private LocalDateTime startedAt;

    /**
     * 구독 만료 일시
     * <p>현재 결제 주기의 만료 시각입니다. null일 수 없습니다.</p>
     */
    @Column(name = "expires_at", nullable = false)
    private LocalDateTime expiresAt;

    /**
     * 구독 취소 일시
     * <p>사용자가 구독을 취소한 시각입니다.</p>
     */
    @Column(name = "cancelled_at")
    private LocalDateTime cancelledAt;

    /**
     * 취소 사유
     * <p>구독을 취소한 이유를 기록합니다.</p>
     */
    @Column(name = "cancel_reason")
    private String cancelReason;

    /**
     * 구독 가격
     * <p>결제 주기당 가격입니다. 소수점 2자리까지 지원합니다.</p>
     */
    @Column(name = "price", precision = 10, scale = 2)
    private BigDecimal price;

    /**
     * 통화 코드
     * <p>ISO 4217 통화 코드 (KRW, USD 등). 기본값: KRW</p>
     */
    @Column(name = "currency", length = 3)
    @Builder.Default
    private String currency = "KRW";

    /**
     * 결제 주기
     * <p>MONTHLY 또는 YEARLY 값을 가집니다.</p>
     */
    @Column(name = "billing_cycle")
    private String billingCycle;

    /**
     * 자동 갱신 여부
     * <p>구독이 자동으로 갱신될지 여부입니다. 기본값: true</p>
     */
    @Column(name = "auto_renew")
    @Builder.Default
    private Boolean autoRenew = true;

    /**
     * 다음 결제 일시
     * <p>다음 자동 결제가 예정된 시각입니다.</p>
     */
    @Column(name = "next_billing_date")
    private LocalDateTime nextBillingDate;

    /**
     * Stripe Subscription ID
     * <p>Stripe 결제 시스템의 구독 식별자입니다.</p>
     */
    @Column(name = "stripe_subscription_id")
    private String stripeSubscriptionId;

    /**
     * Stripe Customer ID
     * <p>Stripe 결제 시스템의 고객 식별자입니다.</p>
     */
    @Column(name = "stripe_customer_id")
    private String stripeCustomerId;

    /**
     * 외부 참조 번호
     * <p>외부 구독 시스템의 추가 참조 번호입니다.</p>
     */
    @Column(name = "external_reference")
    private String externalReference;

    /**
     * 할인율 (%)
     * <p>적용된 할인 비율입니다 (0-100).</p>
     */
    @Column(name = "discount_percentage")
    private Integer discountPercentage;

    /**
     * 할인 금액
     * <p>적용된 할인 금액입니다.</p>
     */
    @Column(name = "discount_amount", precision = 10, scale = 2)
    private BigDecimal discountAmount;

    /**
     * 프로모션 코드
     * <p>적용된 프로모션 또는 쿠폰 코드입니다.</p>
     */
    @Column(name = "promo_code")
    private String promoCode;

    /**
     * 메타데이터 (JSON)
     * <p>PostgreSQL JSONB 타입으로 저장되는 추가 정보입니다.</p>
     */
    @Column(name = "metadata", columnDefinition = "jsonb")
    private String metadata;

    /**
     * 구독이 활성 상태인지 확인합니다.
     *
     * <p>status가 ACTIVE이고 expiresAt이 현재 시각 이후인 경우 활성 구독입니다.</p>
     *
     * @return 활성 구독이면 true, 그렇지 않으면 false
     */
    public boolean isActive() {
        return status == SubscriptionStatus.ACTIVE &&
               expiresAt.isAfter(LocalDateTime.now());
    }

    /**
     * 구독을 취소 처리합니다.
     *
     * <p>status를 CANCELLED로 설정하고 취소 관련 정보를 기록합니다.
     * 자동 갱신도 비활성화됩니다.</p>
     *
     * @param reason 취소 사유
     */
    public void cancel(String reason) {
        this.status = SubscriptionStatus.CANCELLED;
        this.cancelledAt = LocalDateTime.now();
        this.cancelReason = reason;
        this.autoRenew = false;
    }

    /**
     * 구독을 만료 처리합니다.
     *
     * <p>status를 EXPIRED로 설정합니다.</p>
     */
    public void expire() {
        this.status = SubscriptionStatus.EXPIRED;
    }

    /**
     * 구독을 갱신합니다.
     *
     * <p>새로운 만료 일시와 다음 결제 일시를 설정합니다.</p>
     *
     * @param newExpiryDate 새로운 만료 일시
     */
    public void renew(LocalDateTime newExpiryDate) {
        this.expiresAt = newExpiryDate;
        this.nextBillingDate = newExpiryDate;
    }
}
