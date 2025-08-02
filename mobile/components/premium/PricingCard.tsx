/**
 * 프리미엄 요금제 카드 컴포넌트
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { PaymentProduct } from '@/services/payment/premium-service';
import { COLORS, SPACING, FONT_SIZES } from '@/utils/constants';
import { STATE_ICONS } from '@/utils/icons';

/**
 * PricingCard 컴포넌트 Props
 * @interface PricingCardProps
 */
interface PricingCardProps {
  /** 결제 상품 정보 */
  product: PaymentProduct;
  /** 선택 여부 */
  isSelected?: boolean;
  /** 인기 상품 여부 */
  isPopular?: boolean;
  /** 로딩 상태 */
  isLoading?: boolean;
  /** 상품 선택 핸들러 */
  onSelect: (productId: string) => void;
  /** 가격 포맷팅 함수 */
  formatPrice: (price: number) => string;
}

/**
 * 프리미엄 요금제 카드 컴포넌트 - 프리미엄 상품 표시
 * @component
 * @param {PricingCardProps} props - 컴포넌트 속성
 * @returns {JSX.Element} 요금제 카드 UI
 * @description 프리미엄 구독 및 일회성 결제 상품을 표시하는 카드 컴포넌트
 */
export const PricingCard: React.FC<PricingCardProps> = React.memo(({
  product,
  isSelected = false,
  isPopular = false,
  isLoading = false,
  onSelect,
  formatPrice,
}) => {
  const isSubscription = product.type === 'subscription';
  
  return (
    <TouchableOpacity
      style={[
        styles.card,
        isSelected && styles.selectedCard,
        isPopular && styles.popularCard,
      ]}
      onPress={() => onSelect(product.id)}
      disabled={isLoading}
      activeOpacity={0.8}
      accessibilityRole="button"
      accessibilityLabel={`${product.name} 선택`}
      accessibilityHint={`${formatPrice(product.price)} ${product.description}`}
    >
      {/* 인기 배지 */}
      {isPopular && (
        <View style={styles.popularBadge}>
          <Icon name="star" size={16} color={COLORS.TEXT.WHITE} />
          <Text style={styles.popularText}>인기</Text>
        </View>
      )}

      {/* 선택 표시 */}
      {isSelected && (
        <View style={styles.selectedIndicator}>
          <Icon name={STATE_ICONS.SUCCESS} size={24} color={COLORS.SUCCESS} />
        </View>
      )}

      {/* 상품 정보 */}
      <View style={styles.header}>
        <Text style={[styles.title, isPopular && styles.popularTitle]}>
          {product.name}
        </Text>
        <Text style={styles.description}>
          {product.description}
        </Text>
      </View>

      {/* 가격 정보 */}
      <View style={styles.priceContainer}>
        <Text style={[styles.price, isPopular && styles.popularPrice]}>
          {formatPrice(product.price)}
        </Text>
        {isSubscription && (
          <Text style={styles.period}>
            {product.id.includes('yearly') ? '/년' : '/월'}
          </Text>
        )}
      </View>

      {/* 할인 정보 (연간 플랜) */}
      {product.id.includes('yearly') && (
        <View style={styles.discountBadge}>
          <Text style={styles.discountText}>2개월 무료</Text>
        </View>
      )}

      {/* 혜택 목록 */}
      <View style={styles.benefitsContainer}>
        {product.benefits.map((benefit, index) => (
          <View key={index} style={styles.benefitRow}>
            <Icon 
              name={STATE_ICONS.SUCCESS} 
              size={16} 
              color={isPopular ? COLORS.SUCCESS : COLORS.PRIMARY} 
            />
            <Text style={[
              styles.benefitText,
              isPopular && styles.popularBenefitText
            ]}>
              {benefit}
            </Text>
          </View>
        ))}
      </View>

      {/* 구독 타입별 추가 정보 */}
      {isSubscription && (
        <View style={styles.subscriptionInfo}>
          <Text style={styles.subscriptionNote}>
            언제든지 취소 가능
          </Text>
        </View>
      )}

      {/* 원타임 구매 추가 정보 */}
      {!isSubscription && (
        <View style={styles.oneTimeInfo}>
          <Text style={styles.oneTimeNote}>
            즉시 사용 가능
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
});

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.SURFACE,
    borderRadius: 16,
    padding: SPACING.LG,
    marginVertical: SPACING.SM,
    marginHorizontal: SPACING.MD,
    elevation: 3,
    shadowColor: COLORS.SHADOW,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    borderWidth: 2,
    borderColor: COLORS.TRANSPARENT,
    position: 'relative',
  },
  selectedCard: {
    borderColor: COLORS.SUCCESS,
    backgroundColor: COLORS.SURFACE,
  },
  popularCard: {
    borderColor: COLORS.PRIMARY,
    backgroundColor: COLORS.PRIMARY + '10',
    transform: [{ scale: 1.02 }],
  },
  popularBadge: {
    position: 'absolute',
    top: -8,
    right: SPACING.LG,
    backgroundColor: COLORS.PRIMARY,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.SM,
    paddingVertical: SPACING.XS,
    borderRadius: 12,
    zIndex: 1,
  },
  popularText: {
    color: COLORS.TEXT.WHITE,
    fontSize: FONT_SIZES.XS,
    fontWeight: '600',
    marginLeft: 4,
  },
  selectedIndicator: {
    position: 'absolute',
    top: SPACING.MD,
    right: SPACING.MD,
  },
  header: {
    marginBottom: SPACING.MD,
  },
  title: {
    fontSize: FONT_SIZES.XL,
    fontWeight: 'bold',
    color: COLORS.TEXT.PRIMARY,
    marginBottom: SPACING.XS,
  },
  popularTitle: {
    color: COLORS.PRIMARY,
  },
  description: {
    fontSize: FONT_SIZES.SM,
    color: COLORS.TEXT.SECONDARY,
    lineHeight: 20,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: SPACING.SM,
  },
  price: {
    fontSize: FONT_SIZES.XXL,
    fontWeight: 'bold',
    color: COLORS.TEXT.PRIMARY,
  },
  popularPrice: {
    color: COLORS.PRIMARY,
  },
  period: {
    fontSize: FONT_SIZES.MD,
    color: COLORS.TEXT.SECONDARY,
    marginLeft: 4,
  },
  discountBadge: {
    alignSelf: 'flex-start',
    backgroundColor: COLORS.SUCCESS,
    paddingHorizontal: SPACING.SM,
    paddingVertical: SPACING.XS,
    borderRadius: 12,
    marginBottom: SPACING.MD,
  },
  discountText: {
    color: COLORS.TEXT.WHITE,
    fontSize: FONT_SIZES.XS,
    fontWeight: '600',
  },
  benefitsContainer: {
    marginVertical: SPACING.MD,
  },
  benefitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.SM,
  },
  benefitText: {
    fontSize: FONT_SIZES.SM,
    color: COLORS.TEXT.PRIMARY,
    marginLeft: SPACING.SM,
    flex: 1,
    lineHeight: 20,
  },
  popularBenefitText: {
    fontWeight: '500',
  },
  subscriptionInfo: {
    marginTop: SPACING.MD,
    paddingTop: SPACING.MD,
    borderTopWidth: 1,
    borderTopColor: COLORS.BORDER,
  },
  subscriptionNote: {
    fontSize: FONT_SIZES.XS,
    color: COLORS.TEXT.SECONDARY,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  oneTimeInfo: {
    marginTop: SPACING.MD,
    paddingTop: SPACING.MD,
    borderTopWidth: 1,
    borderTopColor: COLORS.BORDER,
  },
  oneTimeNote: {
    fontSize: FONT_SIZES.XS,
    color: COLORS.SUCCESS,
    textAlign: 'center',
    fontWeight: '600',
  },
});