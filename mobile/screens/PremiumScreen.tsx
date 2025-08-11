/**
 * 프리미엄 구독 화면 컴포넌트 - 요금제 선택 및 결제
 * @component
 * @returns {JSX.Element} 프리미엄 화면 UI
 * @description 프리미엄 구독 플랫8, 좋아요 패키지 선택 및 Stripe 결제를 처리하는 화면
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  Alert,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '@/store/slices/authSlice';
import Icon from 'react-native-vector-icons/Ionicons';
import { PricingCard } from '@/components/premium/PricingCard';
import { PaymentModal } from '@/components/premium/PaymentModal';
import { usePremiumStore, premiumSelectors } from '@/store/slices/premiumSlice';
import { PaymentProduct, PremiumPlan, premiumService } from '@/services/payment/premium-service';
import { COLORS, SPACING, FONT_SIZES } from '@/utils/constants';
import { STATE_ICONS, UI_ICONS } from '@/utils/icons';

/**
 * 프리미엄 화면 컴포넌트
 * @component
 * @returns {JSX.Element} 프리미엄 화면 UI
 */
export const PremiumScreen = () => {
  const navigation = useNavigation();
  const { user } = useAuthStore();
  const { t } = useTranslation('premium');
  
  const {
    subscription,
    paymentProducts,
    loadSubscription,
    loadPaymentProducts,
    cancelSubscription,
    clearError,
  } = usePremiumStore();

  const [selectedProduct, setSelectedProduct] = useState<PaymentProduct | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const isPremiumUser = usePremiumStore(premiumSelectors.isPremiumUser());
  const currentPlan = usePremiumStore(premiumSelectors.getCurrentPlan());
  const daysUntilExpiry = usePremiumStore(premiumSelectors.getDaysUntilExpiry());

  /**
   * 초기 데이터 로드
   * @effect
   * @description 결제 상품 및 현재 구독 상태를 로드
   */
  useEffect(() => {
    if (user?.id) {
      loadData();
    }
  }, [user?.id]);

  /**
   * 데이터 로드 함수
   * @returns {Promise<void>}
   * @description 결제 상품 및 구독 정보를 서버에서 가져오기
   */
  const loadData = useCallback(async () => {
    try {
      loadPaymentProducts();
      if (user?.id) {
        await loadSubscription(user.id);
      }
    } catch (error) {
      console.error('Failed to load data:', error);
    }
  }, [user?.id, loadSubscription, loadPaymentProducts]);

  /**
   * 새로고침 핸들러
   * @returns {Promise<void>}
   * @description Pull-to-refresh로 데이터를 다시 로드
   */
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, [loadData]);

  /**
   * 상품 선택 핸들러
   * @param {string} productId - 선택한 상품 ID
   * @description 선택한 상품으로 결제 모달을 표시
   */
  const handleProductSelect = (productId: string) => {
    const product = paymentProducts.find(p => p.id === productId);
    if (product) {
      setSelectedProduct(product);
      setShowPaymentModal(true);
    }
  };

  /**
   * 결제 성공 핸들러
   * @returns {Promise<void>}
   * @description 결제 성공 후 구독 상태를 업데이트
   */
  const handlePaymentSuccess = useCallback(async () => {
    if (user?.id) {
      await loadSubscription(user.id);
    }
  }, [user?.id, loadSubscription]);

  /**
   * 구독 취소 핸들러
   * @description 프리미엄 구독을 취소하고 기간 만료 후 해지 처리
   */
  const handleCancelSubscription = () => {
    if (!user?.id) return;

    Alert.alert(
      t('subscription.confirmCancel.title'),
      t('subscription.confirmCancel.message'),
      [
        { text: t('subscription.confirmCancel.goBack'), style: 'cancel' },
        {
          text: t('subscription.confirmCancel.confirm'),
          style: 'destructive',
          onPress: async () => {
            try {
              await cancelSubscription(user.id);
              Alert.alert(t('common:actions.completed'), t('subscription.confirmCancel.success'));
            } catch {
              Alert.alert(t('errors.title'), t('subscription.confirmCancel.error'));
            }
          },
        },
      ]
    );
  };

  /**
   * 에러 처리
   * @effect
   * @description 결제 및 구독 관련 에러를 사용자에게 표시
   */
  const error = usePremiumStore(state => state.error);
  useEffect(() => {
    if (error) {
      Alert.alert(t('errors.title'), error, [
        {
          text: t('common:actions.confirm'),
          onPress: clearError,
        },
      ]);
    }
  }, [error, clearError]);

  /**
   * 현재 구독 상태 렌더링
   * @returns {JSX.Element | null} 구독 상태 UI
   * @description 활성 프리미엄 구독 정보를 표시
   */
  const renderCurrentSubscription = () => {
    if (!isPremiumUser) return null;

    return (
      <View style={styles.currentSubscription}>
        <View style={styles.subscriptionHeader}>
          <Icon name={STATE_ICONS.SUCCESS} size={24} color={COLORS.SUCCESS} />
          <Text style={styles.subscriptionTitle}>{t('subscription.activeTitle')}</Text>
        </View>
        
        <View style={styles.subscriptionInfo}>
          <Text style={styles.planName}>
            {currentPlan === PremiumPlan.PREMIUM_MONTHLY ? t('subscription.monthlyPlan') : t('subscription.yearlyPlan')}
          </Text>
          
          {subscription?.expiresAt && (
            <Text style={styles.expiryInfo}>
              {daysUntilExpiry > 0 
                ? t('subscription.daysLeft', { days: daysUntilExpiry })
                : t('subscription.expiresToday')
              }
            </Text>
          )}
          
          {subscription?.cancelAtPeriodEnd && (
            <Text style={styles.cancelNotice}>
              {t('subscription.cancelNotice')}
            </Text>
          )}
        </View>

        {!subscription?.cancelAtPeriodEnd && (
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={handleCancelSubscription}
            accessibilityRole="button"
            accessibilityLabel={t('subscription.cancel')}
          >
            <Text style={styles.cancelButtonText}>{t('subscription.cancel')}</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  /**
   * 구독 플랜 렌더링
   * @returns {JSX.Element} 구독 플랜 UI
   * @description 월간/연간 프리미엄 구독 플랜을 표시
   */
  const renderSubscriptionPlans = () => {
    const subscriptionProducts = paymentProducts.filter(p => p.type === 'subscription');

    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('subscription.title')}</Text>
        <Text style={styles.sectionDescription}>
          {t('subscription.description')}
        </Text>
        
        {subscriptionProducts.map((product, index) => (
          <PricingCard
            key={product.id}
            product={product}
            isPopular={index === 1} // 연간 플랜을 인기로 표시
            isSelected={selectedProduct?.id === product.id}
            onSelect={handleProductSelect}
            formatPrice={premiumService.formatPrice}
          />
        ))}
      </View>
    );
  };

  /**
   * 좋아요 패키지 렌더링
   * @returns {JSX.Element} 좋아요 패키지 UI
   * @description 일회성 좋아요 구매 패키지를 표시
   */
  const renderLikePackages = () => {
    const likeProducts = paymentProducts.filter(p => p.type === 'one_time');

    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('likes.title')}</Text>
        <Text style={styles.sectionDescription}>
          {t('likes.description')}
        </Text>
        
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.horizontalScrollContainer}
        >
          {likeProducts.map((product) => (
            <View key={product.id} style={styles.likePackageContainer}>
              <PricingCard
                product={product}
                isSelected={selectedProduct?.id === product.id}
                onSelect={handleProductSelect}
                formatPrice={premiumService.formatPrice}
              />
            </View>
          ))}
        </ScrollView>
      </View>
    );
  };

  /**
   * 헤더 렌더링
   * @returns {JSX.Element} 헤더 UI
   * @description 네비게이션 헤더를 표시
   */
  const renderHeader = () => (
    <View style={styles.header}>
      <TouchableOpacity
        onPress={() => navigation.goBack()}
        style={styles.backButton}
        accessibilityRole="button"
        accessibilityLabel={t('actions.back')}
      >
        <Icon name={UI_ICONS.ARROW_LEFT} size={24} color={COLORS.TEXT.PRIMARY} />
      </TouchableOpacity>
      
      <Text style={styles.headerTitle}>{t('title')}</Text>
      
      <View style={styles.placeholder} />
    </View>
  );

  /**
   * FAQ 섹션 렌더링
   * @returns {JSX.Element} FAQ UI
   * @description 자주 묻는 질문과 답변을 표시
   */
  const renderFAQ = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{t('faq.title')}</Text>
      
      <View style={styles.faqContainer}>
        <View style={styles.faqItem}>
          <Text style={styles.faqQuestion}>{t('faq.questions.cancel.question')}</Text>
          <Text style={styles.faqAnswer}>
            {t('faq.questions.cancel.answer')}
          </Text>
        </View>
        
        <View style={styles.faqItem}>
          <Text style={styles.faqQuestion}>{t('faq.questions.payment.question')}</Text>
          <Text style={styles.faqAnswer}>
            {t('faq.questions.payment.answer')}
          </Text>
        </View>
        
        <View style={styles.faqItem}>
          <Text style={styles.faqQuestion}>{t('faq.questions.likes.question')}</Text>
          <Text style={styles.faqAnswer}>
            {t('faq.questions.likes.answer')}
          </Text>
        </View>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {renderHeader()}
      
      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[COLORS.PRIMARY]}
            tintColor={COLORS.PRIMARY}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {renderCurrentSubscription()}
        {renderSubscriptionPlans()}
        {renderLikePackages()}
        {renderFAQ()}
      </ScrollView>

      <PaymentModal
        visible={showPaymentModal}
        product={selectedProduct}
        onClose={() => {
          setShowPaymentModal(false);
          setSelectedProduct(null);
        }}
        onSuccess={handlePaymentSuccess}
        formatPrice={premiumService.formatPrice}
      />
    </SafeAreaView>
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
  backButton: {
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
  },
  currentSubscription: {
    backgroundColor: COLORS.SUCCESS + '20',
    margin: SPACING.MD,
    padding: SPACING.LG,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.SUCCESS + '40',
  },
  subscriptionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.MD,
  },
  subscriptionTitle: {
    fontSize: FONT_SIZES.LG,
    fontWeight: 'bold',
    color: COLORS.SUCCESS,
    marginLeft: SPACING.SM,
  },
  subscriptionInfo: {
    marginBottom: SPACING.MD,
  },
  planName: {
    fontSize: FONT_SIZES.MD,
    fontWeight: '600',
    color: COLORS.TEXT.PRIMARY,
    marginBottom: SPACING.XS,
  },
  expiryInfo: {
    fontSize: FONT_SIZES.SM,
    color: COLORS.TEXT.SECONDARY,
  },
  cancelNotice: {
    fontSize: FONT_SIZES.SM,
    color: COLORS.WARNING,
    fontStyle: 'italic',
    marginTop: SPACING.XS,
  },
  cancelButton: {
    alignSelf: 'flex-start',
    paddingHorizontal: SPACING.MD,
    paddingVertical: SPACING.SM,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.ERROR,
  },
  cancelButtonText: {
    color: COLORS.ERROR,
    fontSize: FONT_SIZES.SM,
    fontWeight: '600',
  },
  section: {
    margin: SPACING.MD,
  },
  sectionTitle: {
    fontSize: FONT_SIZES.XL,
    fontWeight: 'bold',
    color: COLORS.TEXT.PRIMARY,
    marginBottom: SPACING.SM,
  },
  sectionDescription: {
    fontSize: FONT_SIZES.MD,
    color: COLORS.TEXT.SECONDARY,
    marginBottom: SPACING.LG,
    lineHeight: 22,
  },
  horizontalScrollContainer: {
    paddingRight: SPACING.MD,
  },
  likePackageContainer: {
    width: 200,
    marginRight: SPACING.MD,
  },
  faqContainer: {
    backgroundColor: COLORS.SURFACE,
    borderRadius: 12,
    padding: SPACING.LG,
  },
  faqItem: {
    marginBottom: SPACING.LG,
  },
  faqQuestion: {
    fontSize: FONT_SIZES.MD,
    fontWeight: '600',
    color: COLORS.TEXT.PRIMARY,
    marginBottom: SPACING.SM,
  },
  faqAnswer: {
    fontSize: FONT_SIZES.SM,
    color: COLORS.TEXT.SECONDARY,
    lineHeight: 20,
  },
});