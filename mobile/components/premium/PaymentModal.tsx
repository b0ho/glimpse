/**
 * 결제 모달 컴포넌트 (NativeWind v4)
 * Stripe 결제 처리
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  SafeAreaView,
  ScrollView,
} from 'react-native';
import { useStripe } from '@stripe/stripe-react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useAuthStore } from '@/store/slices/authSlice';
import { PaymentProduct } from '@/services/payment/premium-service';
import { usePremiumStore } from '@/store/slices/premiumSlice';
import { UI_ICONS } from '@/utils/icons';
import { useTheme } from '@/hooks/useTheme';
import { useAndroidSafeTranslation } from '@/hooks/useAndroidSafeTranslation';
import { cn } from '@/lib/utils';

/**
 * PaymentModal 컴포넌트 Props
 * @interface PaymentModalProps
 */
interface PaymentModalProps {
  /** 모달 표시 여부 */
  visible: boolean;
  /** 결제할 상품 */
  product?: PaymentProduct | null;
  /** 닫기 핸들러 */
  onClose: () => void;
  /** 결제 성공 핸들러 */
  onSuccess: () => void;
  /** 가격 포맷팅 함수 */
  formatPrice?: (price: number) => string;
  /** 선택한 구독 티어 (optional) */
  selectedTier?: any;
  /** 결제 주기 (optional) */
  billingCycle?: 'monthly' | 'yearly';
}

/**
 * 결제 모달 컴포넌트 - Stripe 결제 처리 (NativeWind v4)
 * @component
 * @param {PaymentModalProps} props - 컴포넌트 속성
 * @returns {JSX.Element} 결제 모달 UI
 * @description Stripe를 사용한 프리미엄 구독 및 좋아요 결제 처리 모달
 */
export const PaymentModal: React.FC<PaymentModalProps> = ({
  visible,
  product,
  onClose,
  onSuccess,
  formatPrice,
}) => {
  const { user } = useAuthStore();
  const { initPaymentSheet, presentPaymentSheet } = useStripe();
  const { initiatePurchase, confirmPayment, isProcessingPayment, clearError } = usePremiumStore();
  const { colors } = useTheme();
  const { t } = useAndroidSafeTranslation(['premium', 'common']);
  
  const [isInitialized, setIsInitialized] = useState(false);
  const [clientSecret, setClientSecret] = useState<string>('');

  // 모달이 열릴 때 결제 시트 초기화
  useEffect(() => {
    if (visible && product && user) {
      initializePaymentSheet();
    }
  }, [visible, product, user]);

  /**
   * 결제 시트 초기화
   * @returns {Promise<void>}
   */
  const initializePaymentSheet = async () => {
    if (!product || !user) return;

    try {
      setIsInitialized(false);
      clearError();

      // Payment Intent 또는 Subscription 생성
      const result = await initiatePurchase(product.id, user.id);
      setClientSecret(result.clientSecret);

      // Stripe 결제 시트 초기화
      const { error } = await initPaymentSheet({
        paymentIntentClientSecret: result.clientSecret,
        merchantDisplayName: 'Glimpse Dating App',
        customerId: user.id,
        customerEphemeralKeySecret: undefined, // 실제로는 백엔드에서 생성
        allowsDelayedPaymentMethods: false,
        defaultBillingDetails: {
          name: user.nickname || '사용자',
          // email은 User 인터페이스에 없음 - phoneNumber 사용
          phone: user.phoneNumber,
        },
        returnURL: 'glimpse://payment-success',
        appearance: {
          colors: {
            primary: colors.PRIMARY,
            background: colors.SURFACE,
            componentBackground: colors.BACKGROUND,
            componentBorder: colors.BORDER,
            componentDivider: colors.BORDER,
            primaryText: colors.TEXT.PRIMARY,
            secondaryText: colors.TEXT.SECONDARY,
            componentText: colors.TEXT.PRIMARY,
            placeholderText: colors.TEXT.LIGHT,
          },
          shapes: {
            borderRadius: 12,
            borderWidth: 1,
          },
        },
      });

      if (error) {
        Alert.alert(t('common:alerts.error.title'), error.message);
        return;
      }

      setIsInitialized(true);
    } catch (error) {
      console.error('Payment sheet initialization failed:', error);
      Alert.alert(t('common:alerts.error.title'), t('premium:alerts.payment.error'));
    }
  };

  /**
   * 결제 처리 핸들러
   * @returns {Promise<void>}
   */
  const handlePayment = async () => {
    if (!isInitialized || !product || !user || !clientSecret) {
      Alert.alert(t('common:alerts.error.title'), t('premium:alerts.payment.notReady'));
      return;
    }

    try {
      // 결제 시트 표시
      const { error } = await presentPaymentSheet();

      if (error) {
        if (error.code !== 'Canceled') {
          Alert.alert(t('premium:alerts.payment.failed'), error.message);
        }
        return;
      }

      // 결제 성공 처리
      await confirmPayment(user.id, product.id);

      Alert.alert(
        t('premium:alerts.payment.complete'),
        product.type === 'subscription' 
          ? t('premium:alerts.payment.subscriptionActivated')
          : t('premium:alerts.payment.likesAdded'),
        [
          {
            text: t('common:buttons.confirm'),
            onPress: () => {
              onSuccess();
              onClose();
            }
          }
        ]
      );
    } catch (error) {
      console.error('Payment failed:', error);
      Alert.alert(t('common:alerts.error.title'), t('premium:alerts.payment.processing'));
    }
  };

  /**
   * 상품 상세 정보 렌더링
   * @returns {JSX.Element | null} 상품 상세 UI
   */
  const renderProductDetails = () => {
    if (!product) return null;

    return (
      <View className="mb-8">
        <Text className="text-2xl font-bold text-gray-900 dark:text-white text-center mb-3">
          {product.name}
        </Text>
        <Text className="text-base text-gray-600 dark:text-gray-400 text-center mb-6">
          {product.description}
        </Text>
        
        <View className="flex-row items-baseline justify-center mb-6">
          <Text className="text-4xl font-bold text-teal-400 dark:text-teal-300">
            {formatPrice(product.price)}
          </Text>
          {product.type === 'subscription' && (
            <Text className="text-lg text-gray-600 dark:text-gray-400 ml-1">
              {product.id.includes('yearly') ? '/년' : '/월'}
            </Text>
          )}
        </View>

        {/* 혜택 목록 */}
        <View className="bg-gray-50 dark:bg-gray-800 p-6 rounded-xl mb-6">
          <Text className="text-base font-semibold text-gray-900 dark:text-white mb-3">
            포함된 혜택:
          </Text>
          {product.benefits.map((benefit, index) => (
            <View key={index} className="flex-row items-center mb-3 last:mb-0">
              <Icon name="checkmark-circle" size={16} color="#10B981" />
              <Text className="text-sm text-gray-900 dark:text-white ml-3 flex-1">
                {benefit}
              </Text>
            </View>
          ))}
        </View>

        {/* 구독 안내 */}
        {product.type === 'subscription' && (
          <View className="bg-white dark:bg-gray-900 border-l-4 border-teal-400 p-4 rounded-lg">
            <Text className="text-sm text-gray-600 dark:text-gray-400 leading-5">
              • 언제든지 취소 가능합니다{'\n'}
              • 취소 후에도 구독 기간 종료까지 서비스 이용 가능{'\n'}
              • 자동 갱신되며, 갱신 24시간 전까지 취소 가능
            </Text>
          </View>
        )}
      </View>
    );
  };

  if (!product) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView className="flex-1 bg-white dark:bg-gray-900">
        {/* 헤더 */}
        <View className="flex-row items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <TouchableOpacity
            onPress={onClose}
            className="w-10 h-10 items-center justify-center"
            accessibilityRole="button"
            accessibilityLabel="닫기"
          >
            <Icon name={UI_ICONS.CLOSE} size={24} color={colors.TEXT.PRIMARY} />
          </TouchableOpacity>
          
          <Text className="text-lg font-bold text-gray-900 dark:text-white">
            결제하기
          </Text>
          
          <View className="w-10" />
        </View>

        <ScrollView className="flex-1 p-6" showsVerticalScrollIndicator={false}>
          {renderProductDetails()}

          {/* 보안 안내 */}
          <View className="flex-row items-center bg-green-50 dark:bg-green-900/20 p-4 rounded-xl mt-6">
            <Icon name="shield-checkmark" size={24} color="#10B981" />
            <View className="ml-4 flex-1">
              <Text className="text-base font-semibold text-green-700 dark:text-green-400 mb-1">
                안전한 결제
              </Text>
              <Text className="text-sm text-gray-600 dark:text-gray-400 leading-5">
                Stripe를 통한 안전한 결제 처리{'\n'}
                카드 정보는 저장되지 않습니다
              </Text>
            </View>
          </View>
        </ScrollView>

        {/* 결제 버튼 */}
        <View className="p-6 border-t border-gray-200 dark:border-gray-700">
          <TouchableOpacity
            className={cn(
              "py-4 rounded-xl items-center justify-center min-h-[56px]",
              (!isInitialized || isProcessingPayment)
                ? "bg-gray-300 dark:bg-gray-600 opacity-60"
                : "bg-teal-400 dark:bg-teal-500"
            )}
            onPress={handlePayment}
            disabled={!isInitialized || isProcessingPayment}
            accessibilityRole="button"
            accessibilityLabel="결제하기"
          >
            {isProcessingPayment ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text className="text-lg font-bold text-white">
                {formatPrice(product.price)} 결제하기
              </Text>
            )}
          </TouchableOpacity>

          {!isInitialized && !isProcessingPayment && (
            <View className="items-center mt-4">
              <ActivityIndicator color="#14B8A6" />
              <Text className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                결제 준비 중...
              </Text>
            </View>
          )}
        </View>
      </SafeAreaView>
    </Modal>
  );
};