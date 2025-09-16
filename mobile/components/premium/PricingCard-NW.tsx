/**
 * 프리미엄 요금제 카드 컴포넌트
 */

import React from 'react';
import {
  View,
  Text
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
        <View className="popularBadge">
          <Icon name="star" size={16} color={colors.TEXT.WHITE} />
          <Text className="popularText">인기</Text>
        </View>
      )}

      {/* 선택 표시 */}
      {isSelected && (
        <View className="selectedIndicator">
          <Icon name={STATE_ICONS.SUCCESS} size={24} color={colors.SUCCESS} />
        </View>
      )}

      {/* 상품 정보 */}
      <View className="header">
        <Text className="title">
          {product.name}
        </Text>
        <Text className="description">
          {product.description}
        </Text>
      </View>

      {/* 가격 정보 */}
      <View className="priceContainer">
        <Text className="price">
          {formatPrice(product.price)}
        </Text>
        {isSubscription && (
          <Text className="period">
            {product.id.includes('yearly') ? '/년' : '/월'}
          </Text>
        )}
      </View>

      {/* 할인 정보 (연간 플랜) */}
      {product.id.includes('yearly') && (
        <View className="discountBadge">
          <Text className="discountText">2개월 무료</Text>
        </View>
      )}

      {/* 혜택 목록 */}
      <View className="benefitsContainer">
        {product.benefits.map((benefit, index) => (
          <View key={index} className="benefitRow">
            <Icon 
              name={STATE_ICONS.SUCCESS} 
              size={16} 
              color={isPopular ? colors.SUCCESS : colors.PRIMARY} 
            />
            <Text className="benefitText">
              {benefit}
            </Text>
          </View>
        ))}
      </View>

      {/* 구독 타입별 추가 정보 */}
      {isSubscription && (
        <View className="subscriptionInfo">
          <Text className="subscriptionNote">
            언제든지 취소 가능
          </Text>
        </View>
      )}

      {/* 원타임 구매 추가 정보 */}
      {!isSubscription && (
        <View className="oneTimeInfo">
          <Text className="oneTimeNote">
            즉시 사용 가능
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
});

