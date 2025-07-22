/**
 * 프리미엄 구독 화면
 * 요금제 선택 및 결제 처리
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
import { useUser } from '@clerk/clerk-expo';
import Icon from 'react-native-vector-icons/Ionicons';
import { PricingCard } from '@/components/premium/PricingCard';
import { PaymentModal } from '@/components/premium/PaymentModal';
import { usePremiumStore, premiumSelectors } from '@/store/slices/premiumSlice';
import { PaymentProduct, PremiumPlan, premiumService } from '@/services/payment/premium-service';
import { COLORS, SPACING, FONT_SIZES } from '@/utils/constants';
import { STATE_ICONS, UI_ICONS } from '@/utils/icons';

export const PremiumScreen: React.FC = () => {
  const navigation = useNavigation();
  const { user } = useUser();
  
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

  // 초기 데이터 로드
  useEffect(() => {
    if (user?.id) {
      loadData();
    }
  }, [user?.id]);

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

  // 새로고침
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, [loadData]);

  // 상품 선택
  const handleProductSelect = (productId: string) => {
    const product = paymentProducts.find(p => p.id === productId);
    if (product) {
      setSelectedProduct(product);
      setShowPaymentModal(true);
    }
  };

  // 결제 성공 처리
  const handlePaymentSuccess = useCallback(async () => {
    if (user?.id) {
      await loadSubscription(user.id);
    }
  }, [user?.id, loadSubscription]);

  // 구독 취소
  const handleCancelSubscription = () => {
    if (!user?.id) return;

    Alert.alert(
      '구독 취소',
      '정말로 프리미엄 구독을 취소하시겠습니까?\n\n취소 후에도 현재 구독 기간이 끝날 때까지는 프리미엄 기능을 사용할 수 있습니다.',
      [
        { text: '돌아가기', style: 'cancel' },
        {
          text: '취소하기',
          style: 'destructive',
          onPress: async () => {
            try {
              await cancelSubscription(user.id);
              Alert.alert('완료', '구독이 취소되었습니다.');
            } catch {
              Alert.alert('오류', '구독 취소 중 오류가 발생했습니다.');
            }
          },
        },
      ]
    );
  };

  // 에러 처리
  const error = usePremiumStore(state => state.error);
  useEffect(() => {
    if (error) {
      Alert.alert('오류', error, [
        {
          text: '확인',
          onPress: clearError,
        },
      ]);
    }
  }, [error, clearError]);

  // 현재 구독 상태 렌더링
  const renderCurrentSubscription = () => {
    if (!isPremiumUser) return null;

    return (
      <View style={styles.currentSubscription}>
        <View style={styles.subscriptionHeader}>
          <Icon name={STATE_ICONS.SUCCESS} size={24} color={COLORS.SUCCESS} />
          <Text style={styles.subscriptionTitle}>활성 구독</Text>
        </View>
        
        <View style={styles.subscriptionInfo}>
          <Text style={styles.planName}>
            {currentPlan === PremiumPlan.PREMIUM_MONTHLY ? 'Premium 월간' : 'Premium 연간'}
          </Text>
          
          {subscription?.expiresAt && (
            <Text style={styles.expiryInfo}>
              {daysUntilExpiry > 0 
                ? `${daysUntilExpiry}일 남음` 
                : '오늘 만료'
              }
            </Text>
          )}
          
          {subscription?.cancelAtPeriodEnd && (
            <Text style={styles.cancelNotice}>
              구독이 취소되었습니다. 현재 기간 종료 시까지 이용 가능합니다.
            </Text>
          )}
        </View>

        {!subscription?.cancelAtPeriodEnd && (
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={handleCancelSubscription}
            accessibilityRole="button"
            accessibilityLabel="구독 취소"
          >
            <Text style={styles.cancelButtonText}>구독 취소</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  // 구독 플랜 렌더링
  const renderSubscriptionPlans = () => {
    const subscriptionProducts = paymentProducts.filter(p => p.type === 'subscription');

    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>프리미엄 구독</Text>
        <Text style={styles.sectionDescription}>
          모든 기능을 무제한으로 이용하세요
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

  // 좋아요 패키지 렌더링
  const renderLikePackages = () => {
    const likeProducts = paymentProducts.filter(p => p.type === 'one_time');

    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>추가 좋아요</Text>
        <Text style={styles.sectionDescription}>
          좋아요가 부족할 때 필요한 만큼만 구매하세요
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

  // 헤더 렌더링
  const renderHeader = () => (
    <View style={styles.header}>
      <TouchableOpacity
        onPress={() => navigation.goBack()}
        style={styles.backButton}
        accessibilityRole="button"
        accessibilityLabel="뒤로 가기"
      >
        <Icon name={UI_ICONS.ARROW_LEFT} size={24} color={COLORS.TEXT.PRIMARY} />
      </TouchableOpacity>
      
      <Text style={styles.headerTitle}>Glimpse Premium</Text>
      
      <View style={styles.placeholder} />
    </View>
  );

  // FAQ 섹션
  const renderFAQ = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>자주 묻는 질문</Text>
      
      <View style={styles.faqContainer}>
        <View style={styles.faqItem}>
          <Text style={styles.faqQuestion}>언제든지 구독을 취소할 수 있나요?</Text>
          <Text style={styles.faqAnswer}>
            네, 언제든지 구독을 취소할 수 있습니다. 취소 후에도 현재 구독 기간이 끝날 때까지는 프리미엄 기능을 계속 사용하실 수 있습니다.
          </Text>
        </View>
        
        <View style={styles.faqItem}>
          <Text style={styles.faqQuestion}>결제 정보는 안전한가요?</Text>
          <Text style={styles.faqAnswer}>
            모든 결제 정보는 Stripe를 통해 안전하게 처리되며, Glimpse는 카드 정보를 저장하지 않습니다.
          </Text>
        </View>
        
        <View style={styles.faqItem}>
          <Text style={styles.faqQuestion}>구매한 좋아요는 언제까지 사용할 수 있나요?</Text>
          <Text style={styles.faqAnswer}>
            구매한 좋아요는 사용할 때까지 계정에 보관되며, 만료되지 않습니다.
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