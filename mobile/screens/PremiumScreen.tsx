/**
 * 프리미엄 구독 화면 컴포넌트 - 3단계 구독 모델
 * @component
 * @returns {JSX.Element} 프리미엄 화면 UI
 * @description Basic/Advanced/Premium 3단계 구독 모델과 결제를 처리하는 화면
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
  Dimensions,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAndroidSafeTranslation } from '@/hooks/useAndroidSafeTranslation';
import { useAuthStore } from '@/store/slices/authSlice';
import { useTheme } from '@/hooks/useTheme';
import { IconWrapper as Icon } from '@/components/IconWrapper';
import { PaymentModal } from '@/components/premium/PaymentModal';
import { usePremiumStore } from '@/store/slices/premiumSlice';
import { PaymentProduct, premiumService } from '@/services/payment/premium-service';
import { COLORS, SPACING, FONT_SIZES } from '@/utils/constants';
import { SubscriptionTier, SUBSCRIPTION_FEATURES, SUBSCRIPTION_PRICING } from '@/types/subscription';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

/**
 * 프리미엄 화면 컴포넌트
 * @component
 * @returns {JSX.Element} 프리미엄 화면 UI
 */
export const PremiumScreen = () => {
  const navigation = useNavigation();
  const { user, getSubscriptionTier, updateSubscriptionTier } = useAuthStore();
  const { colors } = useTheme();
  const { t } = useAndroidSafeTranslation('premium');
  
  const currentTier = getSubscriptionTier();
  const [selectedTier, setSelectedTier] = useState<SubscriptionTier>(
    currentTier === SubscriptionTier.BASIC ? SubscriptionTier.ADVANCED : currentTier
  );
  const [selectedBilling, setSelectedBilling] = useState<'monthly' | 'yearly'>('monthly');
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  /**
   * 새로고침 핸들러
   */
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    // 구독 상태 새로고침 로직
    setTimeout(() => setRefreshing(false), 1000);
  }, []);

  /**
   * 구독 선택 핸들러
   */
  const handleSubscribe = (tier: SubscriptionTier) => {
    if (tier === SubscriptionTier.BASIC) {
      Alert.alert(t('alerts.freePlan.title'), t('alerts.freePlan.message'));
      return;
    }
    
    setSelectedTier(tier);
    setShowPaymentModal(true);
  };

  /**
   * 결제 성공 핸들러
   */
  const handlePaymentSuccess = useCallback(() => {
    updateSubscriptionTier(selectedTier);
    Alert.alert(t('alerts.subscription.complete'), t('alerts.subscription.activated'));
    setShowPaymentModal(false);
  }, [selectedTier, updateSubscriptionTier]);

  /**
   * 헤더 렌더링
   */
  const renderHeader = () => (
    <View style={[styles.header, { borderBottomColor: colors.BORDER }]}>
      <TouchableOpacity
        onPress={() => navigation.goBack()}
        style={styles.backButton}
      >
        <Icon name="arrow-back" size={24} color={colors.TEXT.PRIMARY} />
      </TouchableOpacity>
      
      <Text style={[styles.headerTitle, { color: colors.TEXT.PRIMARY }]}>{t('screen.title')}</Text>
      
      <View style={styles.placeholder} />
    </View>
  );

  /**
   * 현재 구독 상태 렌더링
   */
  const renderCurrentStatus = () => (
    <View style={[styles.currentStatus, { backgroundColor: colors.PRIMARY + '10' }]}>
      <Icon 
        name={currentTier === SubscriptionTier.PREMIUM ? 'star' : 
              currentTier === SubscriptionTier.ADVANCED ? 'star-outline' : 'person-outline'} 
        size={24} 
        color={colors.PRIMARY} 
      />
      <View style={styles.statusInfo}>
        <Text style={[styles.statusTitle, { color: colors.TEXT.PRIMARY }]}>
          {t('screen.currentPlan', { 
            tier: currentTier === SubscriptionTier.BASIC ? t('plans.free') : 
                  currentTier === SubscriptionTier.ADVANCED ? t('plans.advanced') : t('plans.premium')
          })}
        </Text>
        {currentTier !== SubscriptionTier.BASIC && (
          <Text style={[styles.statusSubtitle, { color: colors.TEXT.SECONDARY }]}>
            {t('screen.nextPayment', { date: '2025년 2월 19일' })}
          </Text>
        )}
      </View>
    </View>
  );

  /**
   * 결제 주기 선택기 렌더링
   */
  const renderBillingToggle = () => (
    <View style={styles.billingContainer}>
      <View style={[styles.billingToggle, { backgroundColor: colors.SURFACE }]}>
        <TouchableOpacity
          style={[
            styles.billingOption,
            selectedBilling === 'monthly' && { backgroundColor: colors.PRIMARY }
          ]}
          onPress={() => setSelectedBilling('monthly')}
        >
          <Text style={[
            styles.billingText,
            { color: selectedBilling === 'monthly' ? '#FFFFFF' : colors.TEXT.PRIMARY }
          ]}>
            {t('billing.monthly')}
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[
            styles.billingOption,
            selectedBilling === 'yearly' && { backgroundColor: colors.PRIMARY }
          ]}
          onPress={() => setSelectedBilling('yearly')}
        >
          <Text style={[
            styles.billingText,
            { color: selectedBilling === 'yearly' ? '#FFFFFF' : colors.TEXT.PRIMARY }
          ]}>
            {t('billing.yearly')}
          </Text>
          <View style={styles.saveBadge}>
            <Text style={styles.saveText}>{t('billing.discount')}</Text>
          </View>
        </TouchableOpacity>
      </View>
    </View>
  );

  /**
   * 구독 플랜 카드 렌더링
   */
  const renderPlanCard = (tier: SubscriptionTier) => {
    const pricing = SUBSCRIPTION_PRICING.find(p => p.tier === tier)!;
    const features = SUBSCRIPTION_FEATURES[tier];
    const isCurrentPlan = currentTier === tier;
    const isPopular = tier === SubscriptionTier.ADVANCED;

    return (
      <View 
        key={tier}
        style={[
          styles.planCard,
          { backgroundColor: colors.SURFACE, borderColor: colors.BORDER },
          isCurrentPlan && { borderColor: colors.PRIMARY, borderWidth: 2 },
          isPopular && styles.popularCard
        ]}
      >
        {isPopular && (
          <View style={[styles.popularBadge, { backgroundColor: colors.SUCCESS }]}>
            <Text style={styles.popularText}>{t('plans.popular')}</Text>
          </View>
        )}

        <View style={styles.planHeader}>
          <Icon 
            name={tier === SubscriptionTier.PREMIUM ? 'star' : 
                  tier === SubscriptionTier.ADVANCED ? 'star-outline' : 'person-outline'} 
            size={32} 
            color={tier === SubscriptionTier.PREMIUM ? '#FFD700' : 
                   tier === SubscriptionTier.ADVANCED ? colors.PRIMARY : colors.TEXT.SECONDARY} 
          />
          <Text style={[styles.planName, { color: colors.TEXT.PRIMARY }]}>
            {tier === SubscriptionTier.BASIC ? t('plans.free') : 
             tier === SubscriptionTier.ADVANCED ? t('plans.advanced') : t('plans.premium')}
          </Text>
          <Text style={[styles.planPrice, { color: colors.TEXT.PRIMARY }]}>
            {tier === SubscriptionTier.BASIC ? '₩0' : 
             selectedBilling === 'monthly' ? `₩${pricing.monthly.toLocaleString()}` : 
             `₩${pricing.yearlyMonthly.toLocaleString()}`}
          </Text>
          {tier !== SubscriptionTier.BASIC && (
            <Text style={[styles.planPeriod, { color: colors.TEXT.SECONDARY }]}>
              {selectedBilling === 'monthly' ? t('plans.perMonth') : t('plans.perMonthYearly')}
            </Text>
          )}
        </View>

        <View style={styles.featuresList}>
          {/* 관심상대 찾기 */}
          <View style={styles.featureItem}>
            <Icon name="search" size={16} color={colors.PRIMARY} />
            <Text style={[styles.featureText, { color: colors.TEXT.PRIMARY }]}>
              {features.interestSearchLimit === 'unlimited' ? t('features.interestSearchUnlimited') : 
               features.interestSearchLimit === 3 ? t('features.interestSearchThree') : 
               t('features.interestSearchAllTypes')}
            </Text>
          </View>

          {/* 검색 유효기간 */}
          <View style={styles.featureItem}>
            <Icon name="time-outline" size={16} color={colors.PRIMARY} />
            <Text style={[styles.featureText, { color: colors.TEXT.PRIMARY }]}>
              {features.interestSearchDuration === 365 ? t('features.searchDurationUnlimited') : 
               t('features.searchDuration', { days: features.interestSearchDuration })}
            </Text>
          </View>

          {/* 일일 좋아요 */}
          <View style={styles.featureItem}>
            <Icon name="heart-outline" size={16} color={colors.PRIMARY} />
            <Text style={[styles.featureText, { color: colors.TEXT.PRIMARY }]}>
              {features.dailyLikeLimit === 'unlimited' ? t('features.dailyLikesUnlimited') : 
               t('features.dailyLikes', { count: features.dailyLikeLimit })}
            </Text>
          </View>

          {/* 추가 기능들 */}
          {features.canSendInterestFirst && (
            <View style={styles.featureItem}>
              <Icon name="send" size={16} color={colors.SUCCESS} />
              <Text style={[styles.featureText, { color: colors.TEXT.PRIMARY }]}>
                {t('features.sendInterestFirst')}
              </Text>
            </View>
          )}

          {features.noAds && (
            <View style={styles.featureItem}>
              <Icon name="eye-off-outline" size={16} color={colors.SUCCESS} />
              <Text style={[styles.featureText, { color: colors.TEXT.PRIMARY }]}>
                {t('features.noAds')}
              </Text>
            </View>
          )}

          {features.readReceipts && (
            <View style={styles.featureItem}>
              <Icon name="checkmark-done" size={16} color={colors.SUCCESS} />
              <Text style={[styles.featureText, { color: colors.TEXT.PRIMARY }]}>
                {t('features.readReceipts')}
              </Text>
            </View>
          )}

          {features.seeWhoLikedYou && (
            <View style={styles.featureItem}>
              <Icon name="eye-outline" size={16} color={colors.SUCCESS} />
              <Text style={[styles.featureText, { color: colors.TEXT.PRIMARY }]}>
                {t('features.seeWhoLikedYou')}
              </Text>
            </View>
          )}

          {features.priorityMatching && (
            <View style={styles.featureItem}>
              <Icon name="flash" size={16} color={colors.SUCCESS} />
              <Text style={[styles.featureText, { color: colors.TEXT.PRIMARY }]}>
                {t('features.priorityMatching')}
              </Text>
            </View>
          )}

          {features.personaTopPlacement && (
            <View style={styles.featureItem}>
              <Icon name="trophy" size={16} color="#FFD700" />
              <Text style={[styles.featureText, { color: colors.TEXT.PRIMARY }]}>
                {t('features.personaTopPlacement')}
              </Text>
            </View>
          )}

          {features.unlimitedRewind && (
            <View style={styles.featureItem}>
              <Icon name="refresh" size={16} color="#FFD700" />
              <Text style={[styles.featureText, { color: colors.TEXT.PRIMARY }]}>
                {t('features.unlimitedRewind')}
              </Text>
            </View>
          )}
        </View>

        <TouchableOpacity
          style={[
            styles.selectButton,
            { backgroundColor: isCurrentPlan ? colors.DISABLED : colors.PRIMARY },
            tier === SubscriptionTier.BASIC && { backgroundColor: colors.BORDER }
          ]}
          onPress={() => handleSubscribe(tier)}
          disabled={isCurrentPlan && tier !== SubscriptionTier.BASIC}
        >
          <Text style={[
            styles.selectButtonText,
            tier === SubscriptionTier.BASIC && { color: colors.TEXT.SECONDARY }
          ]}>
            {isCurrentPlan ? t('buttons.currentPlan') : 
             tier === SubscriptionTier.BASIC ? t('buttons.freeTrial') : t('buttons.upgrade')}
          </Text>
        </TouchableOpacity>
      </View>
    );
  };

  /**
   * 기능 비교표 렌더링
   */
  const renderComparisonTable = () => (
    <View style={styles.comparisonSection}>
      <Text style={[styles.sectionTitle, { color: colors.TEXT.PRIMARY }]}>
        {t('screen.planComparison')}
      </Text>
      
      <View style={[styles.comparisonTable, { backgroundColor: colors.SURFACE }]}>
        {/* 헤더 */}
        <View style={styles.comparisonRow}>
          <View style={styles.comparisonFeature} />
          <Text style={[styles.comparisonHeader, { color: colors.TEXT.SECONDARY }]}>{t('plans.free')}</Text>
          <Text style={[styles.comparisonHeader, { color: colors.PRIMARY }]}>{t('plans.advanced')}</Text>
          <Text style={[styles.comparisonHeader, { color: '#FFD700' }]}>{t('plans.premium')}</Text>
        </View>

        {/* 비교 항목들 */}
        <View style={[styles.comparisonRow, { borderTopColor: colors.BORDER }]}>
          <Text style={[styles.comparisonFeature, { color: colors.TEXT.PRIMARY }]}>{t('comparison.features.interestSearch')}</Text>
          <Text style={[styles.comparisonValue, { color: colors.TEXT.SECONDARY }]}>{t('comparison.values.three')}</Text>
          <Text style={[styles.comparisonValue, { color: colors.TEXT.SECONDARY }]}>{t('comparison.values.ten')}</Text>
          <Text style={[styles.comparisonValue, { color: colors.TEXT.SECONDARY }]}>{t('comparison.values.unlimited')}</Text>
        </View>

        <View style={[styles.comparisonRow, { borderTopColor: colors.BORDER }]}>
          <Text style={[styles.comparisonFeature, { color: colors.TEXT.PRIMARY }]}>{t('comparison.features.searchDuration')}</Text>
          <Text style={[styles.comparisonValue, { color: colors.TEXT.SECONDARY }]}>{t('comparison.values.threeDays')}</Text>
          <Text style={[styles.comparisonValue, { color: colors.TEXT.SECONDARY }]}>{t('comparison.values.twoWeeks')}</Text>
          <Text style={[styles.comparisonValue, { color: colors.TEXT.SECONDARY }]}>{t('comparison.values.unlimited')}</Text>
        </View>

        <View style={[styles.comparisonRow, { borderTopColor: colors.BORDER }]}>
          <Text style={[styles.comparisonFeature, { color: colors.TEXT.PRIMARY }]}>{t('comparison.features.dailyLikes')}</Text>
          <Text style={[styles.comparisonValue, { color: colors.TEXT.SECONDARY }]}>{t('comparison.values.oneTime')}</Text>
          <Text style={[styles.comparisonValue, { color: colors.TEXT.SECONDARY }]}>{t('comparison.values.threeTimes')}</Text>
          <Text style={[styles.comparisonValue, { color: colors.TEXT.SECONDARY }]}>{t('comparison.values.unlimited')}</Text>
        </View>

        <View style={[styles.comparisonRow, { borderTopColor: colors.BORDER }]}>
          <Text style={[styles.comparisonFeature, { color: colors.TEXT.PRIMARY }]}>{t('comparison.features.noAds')}</Text>
          <Icon name="close" size={20} color={colors.ERROR} />
          <Icon name="checkmark" size={20} color={colors.SUCCESS} />
          <Icon name="checkmark" size={20} color={colors.SUCCESS} />
        </View>

        <View style={[styles.comparisonRow, { borderTopColor: colors.BORDER }]}>
          <Text style={[styles.comparisonFeature, { color: colors.TEXT.PRIMARY }]}>{t('comparison.features.priorityMatching')}</Text>
          <Icon name="close" size={20} color={colors.ERROR} />
          <Icon name="close" size={20} color={colors.ERROR} />
          <Icon name="checkmark" size={20} color={colors.SUCCESS} />
        </View>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.BACKGROUND }]}>
      {renderHeader()}
      
      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[colors.PRIMARY]}
            tintColor={colors.PRIMARY}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {renderCurrentStatus()}
        {renderBillingToggle()}
        
        <View style={styles.plansContainer}>
          {[SubscriptionTier.BASIC, SubscriptionTier.ADVANCED, SubscriptionTier.PREMIUM].map(tier => 
            renderPlanCard(tier)
          )}
        </View>

        {renderComparisonTable()}
      </ScrollView>

      {/* 결제 모달은 실제 구현시 추가 */}
    </SafeAreaView>
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
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
  },
  currentStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: 20,
    padding: 15,
    borderRadius: 12,
  },
  statusInfo: {
    marginLeft: 12,
    flex: 1,
  },
  statusTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  statusSubtitle: {
    fontSize: 14,
    marginTop: 4,
  },
  billingContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  billingToggle: {
    flexDirection: 'row',
    padding: 4,
    borderRadius: 12,
  },
  billingOption: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 10,
    position: 'relative',
  },
  billingText: {
    fontSize: 14,
    fontWeight: '600',
  },
  saveBadge: {
    position: 'absolute',
    top: -8,
    right: 20,
    backgroundColor: '#4CAF50',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  saveText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },
  plansContainer: {
    paddingHorizontal: 20,
  },
  planCard: {
    padding: 20,
    borderRadius: 16,
    marginBottom: 15,
    borderWidth: 1,
    position: 'relative',
  },
  popularCard: {
    transform: [{ scale: 1.02 }],
  },
  popularBadge: {
    position: 'absolute',
    top: -10,
    right: 20,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  popularText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  planHeader: {
    alignItems: 'center',
    marginBottom: 20,
  },
  planName: {
    fontSize: 20,
    fontWeight: '700',
    marginTop: 8,
  },
  planPrice: {
    fontSize: 32,
    fontWeight: '800',
    marginTop: 8,
  },
  planPeriod: {
    fontSize: 14,
    marginTop: 4,
  },
  featuresList: {
    marginBottom: 20,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  featureText: {
    fontSize: 14,
    marginLeft: 10,
    flex: 1,
  },
  selectButton: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  selectButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  comparisonSection: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 15,
  },
  comparisonTable: {
    borderRadius: 12,
    padding: 15,
  },
  comparisonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderTopWidth: 1,
  },
  comparisonFeature: {
    flex: 2,
    fontSize: 14,
    fontWeight: '500',
  },
  comparisonHeader: {
    flex: 1,
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '700',
  },
  comparisonValue: {
    flex: 1,
    textAlign: 'center',
    fontSize: 14,
  },
});