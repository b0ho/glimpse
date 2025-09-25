package com.glimpse.server.entity;

import com.glimpse.server.entity.enums.SubscriptionStatus;
import com.glimpse.server.entity.enums.SubscriptionPlan;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.GenericGenerator;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * 구독 Entity
 * 프리미엄 구독 관리
 */
@Entity
@Table(name = "Subscription")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Subscription extends BaseEntity {
    
    @Id
    @GeneratedValue(generator = "cuid")
    @GenericGenerator(name = "cuid", strategy = "com.glimpse.server.util.CuidGenerator")
    @Column(name = "id")
    private String id;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;
    
    @Enumerated(EnumType.STRING)
    @Column(name = "plan", nullable = false)
    private SubscriptionPlan plan;
    
    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    @Builder.Default
    private SubscriptionStatus status = SubscriptionStatus.ACTIVE;
    
    @Column(name = "started_at", nullable = false)
    private LocalDateTime startedAt;
    
    @Column(name = "expires_at", nullable = false)
    private LocalDateTime expiresAt;
    
    @Column(name = "cancelled_at")
    private LocalDateTime cancelledAt;
    
    @Column(name = "cancel_reason")
    private String cancelReason;
    
    @Column(name = "price", precision = 10, scale = 2)
    private BigDecimal price;
    
    @Column(name = "currency", length = 3)
    @Builder.Default
    private String currency = "KRW";
    
    @Column(name = "billing_cycle")
    private String billingCycle; // MONTHLY, YEARLY
    
    @Column(name = "auto_renew")
    @Builder.Default
    private Boolean autoRenew = true;
    
    @Column(name = "next_billing_date")
    private LocalDateTime nextBillingDate;
    
    // 외부 구독 정보
    @Column(name = "stripe_subscription_id")
    private String stripeSubscriptionId;
    
    @Column(name = "stripe_customer_id")
    private String stripeCustomerId;
    
    @Column(name = "external_reference")
    private String externalReference;
    
    // 할인 정보
    @Column(name = "discount_percentage")
    private Integer discountPercentage;
    
    @Column(name = "discount_amount", precision = 10, scale = 2)
    private BigDecimal discountAmount;
    
    @Column(name = "promo_code")
    private String promoCode;
    
    // 메타데이터
    @Column(name = "metadata", columnDefinition = "jsonb")
    private String metadata;
    
    // 헬퍼 메소드
    public boolean isActive() {
        return status == SubscriptionStatus.ACTIVE && 
               expiresAt.isAfter(LocalDateTime.now());
    }
    
    public void cancel(String reason) {
        this.status = SubscriptionStatus.CANCELLED;
        this.cancelledAt = LocalDateTime.now();
        this.cancelReason = reason;
        this.autoRenew = false;
    }
    
    public void expire() {
        this.status = SubscriptionStatus.EXPIRED;
    }
    
    public void renew(LocalDateTime newExpiryDate) {
        this.expiresAt = newExpiryDate;
        this.nextBillingDate = newExpiryDate;
    }
}