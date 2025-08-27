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
import { SPACING, FONT_SIZES } from '@/utils/constants';
import { STATE_ICONS } from '@/utils/icons';
import { useTheme } from '@/hooks/useTheme';
import { shadowPresets } from '@/utils/styles/platformStyles';

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
  const { colors } = useTheme();
  const isSubscription = product.type === 'subscription';
  
  return (
    <TouchableOpacity
      style={[
        styles.card,
        { backgroundColor: colors.SURFACE, borderColor: colors.TRANSPARENT },
        isSelected && { borderColor: colors.SUCCESS },
        isPopular && { 
          borderColor: colors.PRIMARY, 
          backgroundColor: colors.PRIMARY + '10',
          transform: [{ scale: 1.02 }]
        },
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
        <View style={[styles.popularBadge, { backgroundColor: colors.PRIMARY }]}>
          <Icon name="star" size={16} color={colors.TEXT.WHITE} />
          <Text style={[styles.popularText, { color: colors.TEXT.WHITE }]}>인기</Text>
        </View>
      )}

      {/* 선택 표시 */}
      {isSelected && (
        <View style={styles.selectedIndicator}>
          <Icon name={STATE_ICONS.SUCCESS} size={24} color={colors.SUCCESS} />
        </View>
      )}

      {/* 상품 정보 */}
      <View style={styles.header}>
        <Text style={[
          styles.title, 
          { color: colors.TEXT.PRIMARY },
          isPopular && { color: colors.PRIMARY }
        ]}>
          {product.name}
        </Text>
        <Text style={[styles.description, { color: colors.TEXT.SECONDARY }]}>
          {product.description}
        </Text>
      </View>

      {/* 가격 정보 */}
      <View style={styles.priceContainer}>
        <Text style={[
          styles.price, 
          { color: colors.TEXT.PRIMARY },
          isPopular && { color: colors.PRIMARY }
        ]}>
          {formatPrice(product.price)}
        </Text>
        {isSubscription && (
          <Text style={[styles.period, { color: colors.TEXT.SECONDARY }]}>
            {product.id.includes('yearly') ? '/년' : '/월'}
          </Text>
        )}
      </View>

      {/* 할인 정보 (연간 플랜) */}
      {product.id.includes('yearly') && (
        <View style={[styles.discountBadge, { backgroundColor: colors.SUCCESS }]}>
          <Text style={[styles.discountText, { color: colors.TEXT.WHITE }]}>2개월 무료</Text>
        </View>
      )}

      {/* 혜택 목록 */}
      <View style={styles.benefitsContainer}>
        {product.benefits.map((benefit, index) => (
          <View key={index} style={styles.benefitRow}>
            <Icon 
              name={STATE_ICONS.SUCCESS} 
              size={16} 
              color={isPopular ? colors.SUCCESS : colors.PRIMARY} 
            />
            <Text style={[
              styles.benefitText,
              { color: colors.TEXT.PRIMARY },
              isPopular && { fontWeight: '500' }
            ]}>
              {benefit}
            </Text>
          </View>
        ))}
      </View>

      {/* 구독 타입별 추가 정보 */}
      {isSubscription && (
        <View style={[styles.subscriptionInfo, { borderTopColor: colors.BORDER }]}>
          <Text style={[styles.subscriptionNote, { color: colors.TEXT.SECONDARY }]}>
            언제든지 취소 가능
          </Text>
        </View>
      )}

      {/* 원타임 구매 추가 정보 */}
      {!isSubscription && (
        <View style={[styles.oneTimeInfo, { borderTopColor: colors.BORDER }]}>
          <Text style={[styles.oneTimeNote, { color: colors.SUCCESS }]}>
            즉시 사용 가능
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
});

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    padding: SPACING.LG,
    marginVertical: SPACING.SM,
    marginHorizontal: SPACING.MD,
    ...shadowPresets.card,
    borderWidth: 2,
    position: 'relative',
  },
  popularBadge: {
    position: 'absolute',
    top: -8,
    right: SPACING.LG,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.SM,
    paddingVertical: SPACING.XS,
    borderRadius: 12,
    zIndex: 1,
  },
  popularText: {
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
    marginBottom: SPACING.XS,
  },
  description: {
    fontSize: FONT_SIZES.SM,
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
  },
  period: {
    fontSize: FONT_SIZES.MD,
    marginLeft: 4,
  },
  discountBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: SPACING.SM,
    paddingVertical: SPACING.XS,
    borderRadius: 12,
    marginBottom: SPACING.MD,
  },
  discountText: {
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
    marginLeft: SPACING.SM,
    flex: 1,
    lineHeight: 20,
  },
  subscriptionInfo: {
    marginTop: SPACING.MD,
    paddingTop: SPACING.MD,
    borderTopWidth: 1,
  },
  subscriptionNote: {
    fontSize: FONT_SIZES.XS,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  oneTimeInfo: {
    marginTop: SPACING.MD,
    paddingTop: SPACING.MD,
    borderTopWidth: 1,
  },
  oneTimeNote: {
    fontSize: FONT_SIZES.XS,
    textAlign: 'center',
    fontWeight: '600',
  },
});