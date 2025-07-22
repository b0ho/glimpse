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
import { useUser } from '@clerk/clerk-expo';
import { PaymentProduct } from '@/services/payment/premium-service';
import { usePremiumStore } from '@/store/slices/premiumSlice';
import { COLORS, SPACING, FONT_SIZES } from '@/utils/constants';
import { UI_ICONS } from '@/utils/icons';

interface PaymentModalProps {
  visible: boolean;
  product: PaymentProduct | null;
  onClose: () => void;
  onSuccess: () => void;
  formatPrice: (price: number) => string;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({
  visible,
  product,
  onClose,
  onSuccess,
  formatPrice,
}) => {
  const { user } = useUser();
  const { initPaymentSheet, presentPaymentSheet } = useStripe();
  const { initiatePurchase, confirmPayment, isProcessingPayment, clearError } = usePremiumStore();
  
  const [isInitialized, setIsInitialized] = useState(false);
  const [clientSecret, setClientSecret] = useState<string>('');

  // 모달이 열릴 때 결제 시트 초기화
  useEffect(() => {
    if (visible && product && user) {
      initializePaymentSheet();
    }
  }, [visible, product, user]);

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
          name: user.firstName + ' ' + user.lastName,
          email: user.emailAddresses[0]?.emailAddress,
        },
        returnURL: 'glimpse://payment-success',
        appearance: {
          colors: {
            primary: COLORS.PRIMARY,
            background: COLORS.SURFACE,
            componentBackground: COLORS.BACKGROUND,
            componentBorder: COLORS.BORDER,
            componentDivider: COLORS.BORDER,
            primaryText: COLORS.TEXT.PRIMARY,
            secondaryText: COLORS.TEXT.SECONDARY,
            componentText: COLORS.TEXT.PRIMARY,
            placeholderText: COLORS.TEXT.LIGHT,
          },
          shapes: {
            borderRadius: 12,
            borderWidth: 1,
          },
        },
      });

      if (error) {
        Alert.alert('오류', error.message);
        return;
      }

      setIsInitialized(true);
    } catch (error) {
      console.error('Payment sheet initialization failed:', error);
      Alert.alert('오류', '결제 준비 중 오류가 발생했습니다.');
    }
  };

  const handlePayment = async () => {
    if (!isInitialized || !product || !user || !clientSecret) {
      Alert.alert('오류', '결제가 준비되지 않았습니다.');
      return;
    }

    try {
      // 결제 시트 표시
      const { error } = await presentPaymentSheet();

      if (error) {
        if (error.code !== 'Canceled') {
          Alert.alert('결제 실패', error.message);
        }
        return;
      }

      // 결제 성공 처리
      await confirmPayment(user.id, product.id);

      Alert.alert(
        '결제 완료! 🎉',
        product.type === 'subscription' 
          ? '프리미엄 구독이 활성화되었습니다.' 
          : '좋아요가 추가되었습니다.',
        [
          {
            text: '확인',
            onPress: () => {
              onSuccess();
              onClose();
            }
          }
        ]
      );
    } catch (error) {
      console.error('Payment failed:', error);
      Alert.alert('오류', '결제 처리 중 오류가 발생했습니다.');
    }
  };

  const renderProductDetails = () => {
    if (!product) return null;

    return (
      <View style={styles.productDetails}>
        <Text style={styles.productName}>{product.name}</Text>
        <Text style={styles.productDescription}>{product.description}</Text>
        
        <View style={styles.priceContainer}>
          <Text style={styles.price}>{formatPrice(product.price)}</Text>
          {product.type === 'subscription' && (
            <Text style={styles.period}>
              {product.id.includes('yearly') ? '/년' : '/월'}
            </Text>
          )}
        </View>

        {/* 혜택 목록 */}
        <View style={styles.benefitsContainer}>
          <Text style={styles.benefitsTitle}>포함된 혜택:</Text>
          {product.benefits.map((benefit, index) => (
            <View key={index} style={styles.benefitRow}>
              <Icon name="checkmark-circle" size={16} color={COLORS.SUCCESS} />
              <Text style={styles.benefitText}>{benefit}</Text>
            </View>
          ))}
        </View>

        {/* 구독 안내 */}
        {product.type === 'subscription' && (
          <View style={styles.subscriptionInfo}>
            <Text style={styles.infoText}>
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
      <SafeAreaView style={styles.container}>
        {/* 헤더 */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={onClose}
            style={styles.closeButton}
            accessibilityRole="button"
            accessibilityLabel="닫기"
          >
            <Icon name={UI_ICONS.CLOSE} size={24} color={COLORS.TEXT.PRIMARY} />
          </TouchableOpacity>
          
          <Text style={styles.headerTitle}>결제하기</Text>
          
          <View style={styles.placeholder} />
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {renderProductDetails()}

          {/* 보안 안내 */}
          <View style={styles.securityInfo}>
            <Icon name="shield-checkmark" size={24} color={COLORS.SUCCESS} />
            <View style={styles.securityText}>
              <Text style={styles.securityTitle}>안전한 결제</Text>
              <Text style={styles.securityDescription}>
                Stripe를 통한 안전한 결제 처리{'\n'}
                카드 정보는 저장되지 않습니다
              </Text>
            </View>
          </View>
        </ScrollView>

        {/* 결제 버튼 */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={[
              styles.paymentButton,
              (!isInitialized || isProcessingPayment) && styles.disabledButton,
            ]}
            onPress={handlePayment}
            disabled={!isInitialized || isProcessingPayment}
            accessibilityRole="button"
            accessibilityLabel="결제하기"
          >
            {isProcessingPayment ? (
              <ActivityIndicator color={COLORS.TEXT.WHITE} />
            ) : (
              <Text style={styles.paymentButtonText}>
                {formatPrice(product.price)} 결제하기
              </Text>
            )}
          </TouchableOpacity>

          {!isInitialized && !isProcessingPayment && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator color={COLORS.PRIMARY} />
              <Text style={styles.loadingText}>결제 준비 중...</Text>
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
    backgroundColor: COLORS.BACKGROUND,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.LG,
    paddingVertical: SPACING.MD,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.BORDER,
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
    color: COLORS.TEXT.PRIMARY,
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
    color: COLORS.TEXT.PRIMARY,
    marginBottom: SPACING.SM,
    textAlign: 'center',
  },
  productDescription: {
    fontSize: FONT_SIZES.MD,
    color: COLORS.TEXT.SECONDARY,
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
    color: COLORS.PRIMARY,
  },
  period: {
    fontSize: FONT_SIZES.LG,
    color: COLORS.TEXT.SECONDARY,
    marginLeft: 4,
  },
  benefitsContainer: {
    backgroundColor: COLORS.SURFACE,
    padding: SPACING.LG,
    borderRadius: 12,
    marginBottom: SPACING.LG,
  },
  benefitsTitle: {
    fontSize: FONT_SIZES.MD,
    fontWeight: '600',
    color: COLORS.TEXT.PRIMARY,
    marginBottom: SPACING.SM,
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
  },
  subscriptionInfo: {
    backgroundColor: COLORS.BACKGROUND,
    padding: SPACING.MD,
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.PRIMARY,
  },
  infoText: {
    fontSize: FONT_SIZES.SM,
    color: COLORS.TEXT.SECONDARY,
    lineHeight: 20,
  },
  securityInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.SUCCESS + '20',
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
    color: COLORS.SUCCESS,
    marginBottom: 2,
  },
  securityDescription: {
    fontSize: FONT_SIZES.SM,
    color: COLORS.TEXT.SECONDARY,
    lineHeight: 18,
  },
  footer: {
    padding: SPACING.LG,
    borderTopWidth: 1,
    borderTopColor: COLORS.BORDER,
  },
  paymentButton: {
    backgroundColor: COLORS.PRIMARY,
    paddingVertical: SPACING.LG,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 56,
  },
  disabledButton: {
    backgroundColor: COLORS.TEXT.LIGHT,
    opacity: 0.6,
  },
  paymentButtonText: {
    color: COLORS.TEXT.WHITE,
    fontSize: FONT_SIZES.LG,
    fontWeight: 'bold',
  },
  loadingContainer: {
    alignItems: 'center',
    marginTop: SPACING.MD,
  },
  loadingText: {
    fontSize: FONT_SIZES.SM,
    color: COLORS.TEXT.SECONDARY,
    marginTop: SPACING.SM,
  },
});