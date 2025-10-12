package com.glimpse.server.entity;

import com.glimpse.server.entity.enums.PaymentStatus;
import com.glimpse.server.entity.enums.PaymentMethod;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.GenericGenerator;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * Payment 엔티티
 *
 * <p>사용자의 결제 내역을 나타내는 엔티티입니다.
 * 크레딧 구매, 프리미엄 구독 등 모든 결제 거래를 관리합니다.</p>
 *
 * <p>주요 관계:</p>
 * <ul>
 *   <li>@ManyToOne User: 결제를 수행한 사용자 (LAZY 로딩, nullable하지 않음)</li>
 * </ul>
 *
 * <p>주요 기능:</p>
 * <ul>
 *   <li>다양한 결제 수단 지원 (Stripe, TossPay, KakaoPay)</li>
 *   <li>결제 상태 관리 (PENDING, PAID, FAILED, REFUNDED)</li>
 *   <li>크레딧 구매 및 프리미엄 구독 결제</li>
 *   <li>외부 결제 시스템 연동 (Stripe, Toss, Kakao)</li>
 *   <li>환불 처리 및 내역 관리</li>
 *   <li>다중 통화 지원</li>
 * </ul>
 *
 * @author Glimpse Team
 * @version 1.0
 * @since 2025-01-14
 */
@Entity
@Table(name = "Payment")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Payment extends BaseEntity {

    /**
     * 결제 고유 식별자
     * <p>CUID 전략을 사용하여 자동 생성됩니다.</p>
     */
    @Id
    @GeneratedValue(generator = "cuid")
    @GenericGenerator(name = "cuid", strategy = "com.glimpse.server.util.CuidGenerator")
    @Column(name = "id")
    private String id;

    /**
     * 결제를 수행한 사용자
     * <p>LAZY 로딩으로 성능을 최적화하며, null일 수 없습니다.</p>
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    /**
     * 결제 금액
     * <p>소수점 2자리까지 지원하며, null일 수 없습니다.</p>
     */
    @Column(name = "amount", precision = 10, scale = 2, nullable = false)
    private BigDecimal amount;

    /**
     * 통화 코드
     * <p>ISO 4217 통화 코드 (KRW, USD 등). 기본값: KRW</p>
     */
    @Column(name = "currency", length = 3)
    @Builder.Default
    private String currency = "KRW";

    /**
     * 결제 수단
     * <p>PaymentMethod enum (CARD, BANK_TRANSFER, TOSS, KAKAO, STRIPE 등).</p>
     */
    @Enumerated(EnumType.STRING)
    @Column(name = "method")
    private PaymentMethod method;

    /**
     * 결제 상태
     * <p>PaymentStatus enum (PENDING, PAID, FAILED, REFUNDED 등).
     * null일 수 없으며, 기본값: PENDING</p>
     */
    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    @Builder.Default
    private PaymentStatus status = PaymentStatus.PENDING;

    /**
     * 상품 타입
     * <p>결제 대상의 타입입니다 (예: CREDIT, SUBSCRIPTION, BOOST).</p>
     */
    @Column(name = "product_type")
    private String productType;

    /**
     * 상품 ID
     * <p>결제 대상의 식별자입니다.</p>
     */
    @Column(name = "product_id")
    private String productId;

    /**
     * 상품명
     * <p>사용자에게 표시되는 상품 이름입니다.</p>
     */
    @Column(name = "product_name")
    private String productName;

    /**
     * 구매한 크레딧 수
     * <p>크레딧 구매 시 얻은 크레딧의 개수입니다.</p>
     */
    @Column(name = "credits_purchased")
    private Integer creditsPurchased;

    /**
     * Stripe Payment Intent ID
     * <p>Stripe 결제 시스템의 Payment Intent 식별자입니다.</p>
     */
    @Column(name = "stripe_payment_intent_id")
    private String stripePaymentIntentId;

    /**
     * Stripe Charge ID
     * <p>Stripe 결제 시스템의 Charge 식별자입니다.</p>
     */
    @Column(name = "stripe_charge_id")
    private String stripeChargeId;

    /**
     * Toss Payment Key
     * <p>토스 페이먼츠의 결제 키입니다.</p>
     */
    @Column(name = "toss_payment_key")
    private String tossPaymentKey;

    /**
     * Kakao TID
     * <p>카카오페이의 거래 고유 번호입니다.</p>
     */
    @Column(name = "kakao_tid")
    private String kakaoTid;

    /**
     * 외부 참조 번호
     * <p>외부 결제 시스템의 추가 참조 번호입니다.</p>
     */
    @Column(name = "external_reference")
    private String externalReference;

    /**
     * 결제 완료 일시
     * <p>결제가 성공적으로 완료된 시각입니다.</p>
     */
    @Column(name = "paid_at")
    private LocalDateTime paidAt;

    /**
     * 결제 실패 일시
     * <p>결제가 실패한 시각입니다.</p>
     */
    @Column(name = "failed_at")
    private LocalDateTime failedAt;

    /**
     * 실패 사유
     * <p>결제가 실패한 이유를 설명합니다.</p>
     */
    @Column(name = "failure_reason")
    private String failureReason;

    /**
     * 환불 일시
     * <p>결제가 환불된 시각입니다.</p>
     */
    @Column(name = "refunded_at")
    private LocalDateTime refundedAt;

    /**
     * 환불 금액
     * <p>환불된 금액입니다. 부분 환불도 지원합니다.</p>
     */
    @Column(name = "refund_amount", precision = 10, scale = 2)
    private BigDecimal refundAmount;

    /**
     * 환불 사유
     * <p>환불이 발생한 이유를 설명합니다.</p>
     */
    @Column(name = "refund_reason")
    private String refundReason;

    /**
     * 메타데이터 (JSON)
     * <p>PostgreSQL JSONB 타입으로 저장되는 추가 정보입니다.</p>
     */
    @Column(name = "metadata", columnDefinition = "jsonb")
    private String metadata;

    /**
     * 결제를 완료 처리합니다.
     *
     * <p>status를 PAID로 설정하고 paidAt을 현재 시각으로 설정합니다.</p>
     */
    public void markAsPaid() {
        this.status = PaymentStatus.PAID;
        this.paidAt = LocalDateTime.now();
    }

    /**
     * 결제를 실패 처리합니다.
     *
     * <p>status를 FAILED로 설정하고 failedAt을 현재 시각으로, failureReason을 설정합니다.</p>
     *
     * @param reason 실패 사유
     */
    public void markAsFailed(String reason) {
        this.status = PaymentStatus.FAILED;
        this.failedAt = LocalDateTime.now();
        this.failureReason = reason;
    }

    /**
     * 결제를 환불 처리합니다.
     *
     * <p>status를 REFUNDED로 설정하고 환불 관련 정보를 기록합니다.</p>
     *
     * @param amount 환불 금액
     * @param reason 환불 사유
     */
    public void refund(BigDecimal amount, String reason) {
        this.status = PaymentStatus.REFUNDED;
        this.refundedAt = LocalDateTime.now();
        this.refundAmount = amount;
        this.refundReason = reason;
    }
}
