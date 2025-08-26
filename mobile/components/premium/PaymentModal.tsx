/**
 * 결제 모달 컴포넌트
 * Stripe 결제 처리
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
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
import { COLORS, SPACING, FONT_SIZES } from '@/utils/constants';
import { UI_ICONS } from '@/utils/icons';
import { useTheme } from '@/hooks/useTheme';
import { useAndroidSafeTranslation } from '@/hooks/useAndroidSafeTranslation';

/**
 * PaymentModal 컴포넌트 Props
 * @interface PaymentModalProps
 */
interface PaymentModalProps {
  /** 모달 표시 여부 */
  visible: boolean;
  /** 결제할 상품 */
  product: PaymentProduct | null;
  /** 닫기 핸들러 */
  onClose: () => void;
  /** 결제 성공 핸들러 */
  onSuccess: () => void;
  /** 가격 포맷팅 함수 */
  formatPrice: (price: number) => string;
}

/**
 * 결제 모달 컴포넌트 - Stripe 결제 처리
 * @component
 * @param {PaymentModalProps} props - 컴포넌트 속성
 * @returns {JSX.Element} 결제 모달 UI
 * @description Stripe를 사용한 프리미엄 구독 및 좋아요 결제 처리 모달
 */
export const PaymentModal = ({
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
      <View style={styles.productDetails}>
        <Text style={[styles.productName, { color: colors.TEXT.PRIMARY }]}>{product.name}</Text>
        <Text style={[styles.productDescription, { color: colors.TEXT.SECONDARY }]}>{product.description}</Text>
        
        <View style={styles.priceContainer}>
          <Text style={[styles.price, { color: colors.PRIMARY }]}>{formatPrice(product.price)}</Text>
          {product.type === 'subscription' && (
            <Text style={[styles.period, { color: colors.TEXT.SECONDARY }]}>
              {product.id.includes('yearly') ? '/년' : '/월'}
            </Text>
          )}
        </View>

        {/* 혜택 목록 */}
        <View style={[styles.benefitsContainer, { backgroundColor: colors.SURFACE }]}>
          <Text style={[styles.benefitsTitle, { color: colors.TEXT.PRIMARY }]}>포함된 혜택:</Text>
          {product.benefits.map((benefit, index) => (
            <View key={index} style={styles.benefitRow}>
              <Icon name="checkmark-circle" size={16} color={colors.SUCCESS} />
              <Text style={[styles.benefitText, { color: colors.TEXT.PRIMARY }]}>{benefit}</Text>
            </View>
          ))}
        </View>

        {/* 구독 안내 */}
        {product.type === 'subscription' && (
          <View style={[styles.subscriptionInfo, { backgroundColor: colors.BACKGROUND, borderLeftColor: colors.PRIMARY }]}>
            <Text style={[styles.infoText, { color: colors.TEXT.SECONDARY }]}>
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
      <SafeAreaView style={[styles.container, { backgroundColor: colors.BACKGROUND }]}>
        {/* 헤더 */}
        <View style={[styles.header, { borderBottomColor: colors.BORDER }]}>
          <TouchableOpacity
            onPress={onClose}
            style={styles.closeButton}
            accessibilityRole="button"
            accessibilityLabel="닫기"
          >
            <Icon name={UI_ICONS.CLOSE} size={24} color={colors.TEXT.PRIMARY} />
          </TouchableOpacity>
          
          <Text style={[styles.headerTitle, { color: colors.TEXT.PRIMARY }]}>결제하기</Text>
          
          <View style={styles.placeholder} />
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {renderProductDetails()}

          {/* 보안 안내 */}
          <View style={[styles.securityInfo, { backgroundColor: colors.SUCCESS + '20' }]}>
            <Icon name="shield-checkmark" size={24} color={colors.SUCCESS} />
            <View style={styles.securityText}>
              <Text style={[styles.securityTitle, { color: colors.SUCCESS }]}>안전한 결제</Text>
              <Text style={[styles.securityDescription, { color: colors.TEXT.SECONDARY }]}>
                Stripe를 통한 안전한 결제 처리{'\n'}
                카드 정보는 저장되지 않습니다
              </Text>
            </View>
          </View>
        </ScrollView>

        {/* 결제 버튼 */}
        <View style={[styles.footer, { borderTopColor: colors.BORDER }]}>
          <TouchableOpacity
            style={[
              styles.paymentButton,
              { backgroundColor: colors.PRIMARY },
              (!isInitialized || isProcessingPayment) && [styles.disabledButton, { backgroundColor: colors.TEXT.LIGHT }],
            ]}
            onPress={handlePayment}
            disabled={!isInitialized || isProcessingPayment}
            accessibilityRole="button"
            accessibilityLabel="결제하기"
          >
            {isProcessingPayment ? (
              <ActivityIndicator color={colors.TEXT.WHITE} />
            ) : (
              <Text style={[styles.paymentButtonText, { color: colors.TEXT.WHITE }]}>
                {formatPrice(product.price)} 결제하기
              </Text>
            )}
          </TouchableOpacity>

          {!isInitialized && !isProcessingPayment && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator color={colors.PRIMARY} />
              <Text style={[styles.loadingText, { color: colors.TEXT.SECONDARY }]}>결제 준비 중...</Text>
            </View>
          )}
        </View>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.LG,
    paddingVertical: SPACING.MD,
    borderBottomWidth: 1,
  },
  closeButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: FONT_SIZES.LG,
    fontWeight: 'bold',
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    padding: SPACING.LG,
  },
  productDetails: {
    marginBottom: SPACING.XL,
  },
  productName: {
    fontSize: FONT_SIZES.XXL,
    fontWeight: 'bold',
    marginBottom: SPACING.SM,
    textAlign: 'center',
  },
  productDescription: {
    fontSize: FONT_SIZES.MD,
    textAlign: 'center',
    marginBottom: SPACING.LG,
  },
  priceContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'baseline',
    marginBottom: SPACING.LG,
  },
  price: {
    fontSize: 32,
    fontWeight: 'bold',
  },
  period: {
    fontSize: FONT_SIZES.LG,
    marginLeft: 4,
  },
  benefitsContainer: {
    padding: SPACING.LG,
    borderRadius: 12,
    marginBottom: SPACING.LG,
  },
  benefitsTitle: {
    fontSize: FONT_SIZES.MD,
    fontWeight: '600',
    marginBottom: SPACING.SM,
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
  },
  subscriptionInfo: {
    padding: SPACING.MD,
    borderRadius: 8,
    borderLeftWidth: 3,
  },
  infoText: {
    fontSize: FONT_SIZES.SM,
    lineHeight: 20,
  },
  securityInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.MD,
    borderRadius: 12,
    marginTop: SPACING.LG,
  },
  securityText: {
    marginLeft: SPACING.MD,
    flex: 1,
  },
  securityTitle: {
    fontSize: FONT_SIZES.MD,
    fontWeight: '600',
    marginBottom: 2,
  },
  securityDescription: {
    fontSize: FONT_SIZES.SM,
    lineHeight: 18,
  },
  footer: {
    padding: SPACING.LG,
    borderTopWidth: 1,
  },
  paymentButton: {
    paddingVertical: SPACING.LG,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 56,
  },
  disabledButton: {
    opacity: 0.6,
  },
  paymentButtonText: {
    fontSize: FONT_SIZES.LG,
    fontWeight: 'bold',
  },
  loadingContainer: {
    alignItems: 'center',
    marginTop: SPACING.MD,
  },
  loadingText: {
    fontSize: FONT_SIZES.SM,
    marginTop: SPACING.SM,
  },
});