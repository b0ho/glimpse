/**
 * 프리미엄 구독 화면 컴포넌트 - NativeWind 버전
 * @component
 * @returns {JSX.Element} 프리미엄 화면 UI
 * @description Basic/Advanced/Premium 3단계 구독 모델과 결제를 처리하는 화면
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  SafeAreaView,
  Alert,
  RefreshControl,
  TouchableOpacity,
  Dimensions,
  Animated,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAndroidSafeTranslation } from '@/hooks/useAndroidSafeTranslation';
import { useAuthStore } from '@/store/slices/authSlice';
import { useTheme } from '@/hooks/useTheme';
import { IconWrapper as Icon } from '@/components/IconWrapper';
import { PaymentModal } from '@/components/premium/PaymentModal';
import { usePremiumStore } from '@/store/slices/premiumSlice';
import { PaymentProduct, premiumService } from '@/services/payment/premium-service';
import { SubscriptionTier, SUBSCRIPTION_FEATURES, SUBSCRIPTION_PRICING } from '@/types/subscription';
import { LinearGradient } from 'expo-linear-gradient';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

/**
 * 프리미엄 화면 컴포넌트 - NativeWind
 */
export const PremiumScreen = () => {
  const navigation = useNavigation();
  const { user, getSubscriptionTier, updateSubscriptionTier } = useAuthStore();
  const { colors, isDark } = useTheme();
  const { t } = useAndroidSafeTranslation('premium');
  
  const currentTier = getSubscriptionTier();
  const [selectedTier, setSelectedTier] = useState<SubscriptionTier>(
    currentTier === SubscriptionTier.BASIC ? SubscriptionTier.ADVANCED : currentTier
  );
  const [selectedBilling, setSelectedBilling] = useState<'monthly' | 'yearly'>('monthly');
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // 애니메이션 값들
  const fadeAnim = useState(new Animated.Value(0))[0];
  const slideAnim = useState(new Animated.Value(50))[0];
  const scaleAnim = useState(new Animated.Value(0.95))[0];
  const shimmerAnim = useState(new Animated.Value(0))[0];

  useEffect(() => {
    // 진입 애니메이션
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 50,
        friction: 8,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();

    // 반짝임 애니메이션
    Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(shimmerAnim, {
          toValue: 0,
          duration: 2000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  }, []);

  const handleSubscribe = (tier: SubscriptionTier) => {
    if (tier === SubscriptionTier.BASIC) {
      Alert.alert(t('alerts.freePlan.title'), t('alerts.freePlan.message'));
      return;
    }
    
    setSelectedTier(tier);
    setShowPaymentModal(true);
  };

  const handlePaymentSuccess = useCallback(() => {
    updateSubscriptionTier(selectedTier);
    Alert.alert(t('alerts.subscription.complete'), t('alerts.subscription.activated'));
    setShowPaymentModal(false);
  }, [selectedTier, updateSubscriptionTier]);

  const renderPlanCard = (tier: SubscriptionTier, index: number) => {
    const pricing = SUBSCRIPTION_PRICING.find(p => p.tier === tier)!;
    const features = SUBSCRIPTION_FEATURES[tier];
    const isCurrentPlan = currentTier === tier;
    const isPopular = tier === SubscriptionTier.ADVANCED;

    const cardColors = {
      [SubscriptionTier.BASIC]: ['#9CA3AF', '#6B7280'],
      [SubscriptionTier.ADVANCED]: ['#FF6B6B', '#FF8A8A'],
      [SubscriptionTier.PREMIUM]: ['#FFD700', '#FFA500'],
    };

    return (
      <Animated.View
        key={tier}
        style={{
          opacity: fadeAnim,
          transform: [
            { translateY: Animated.multiply(slideAnim, (index + 1) * 0.2) },
            { scale: scaleAnim },
          ],
        }}
        className="mb-4"
      >
        <TouchableOpacity
          onPress={() => handleSubscribe(tier)}
          activeOpacity={0.9}
        >
          <View className={`relative overflow-hidden rounded-3xl ${
            isCurrentPlan ? 'border-4 border-pink-500' : 'border border-gray-200 dark:border-gray-700'
          }`}>
            {isPopular && (
              <View className="absolute -top-1 -right-8 z-10 bg-red-500 px-12 py-1 rotate-45">
                <Text className="text-white text-xs font-bold">{t('plans.popular')}</Text>
              </View>
            )}

            <LinearGradient
              colors={cardColors[tier]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              className="p-6"
            >
              {/* 플랜 헤더 */}
              <View className="items-center mb-4">
                <Animated.View
                  style={{
                    opacity: shimmerAnim,
                  }}
                >
                  <Text className="text-5xl mb-2">
                    {tier === SubscriptionTier.PREMIUM ? '👑' : 
                     tier === SubscriptionTier.ADVANCED ? '💝' : '💕'}
                  </Text>
                </Animated.View>
                <Text className="text-white text-2xl font-bold mb-1">
                  {tier === SubscriptionTier.BASIC ? t('plans.free') : 
                   tier === SubscriptionTier.ADVANCED ? t('plans.advanced') : t('plans.premium')}
                </Text>
                <View className="flex-row items-baseline">
                  <Text className="text-white text-3xl font-bold">
                    {tier === SubscriptionTier.BASIC ? '₩0' : 
                     selectedBilling === 'monthly' ? `₩${pricing.monthly.toLocaleString()}` : 
                     `₩${pricing.yearlyMonthly.toLocaleString()}`}
                  </Text>
                  {tier !== SubscriptionTier.BASIC && (
                    <Text className="text-white/80 ml-1">
                      {selectedBilling === 'monthly' ? t('plans.perMonth') : t('plans.perMonthYearly')}
                    </Text>
                  )}
                </View>
              </View>

              {/* 기능 리스트 */}
              <View className="bg-white/20 rounded-2xl p-4">
                {/* 관심상대 찾기 */}
                <View className="flex-row items-center mb-3">
                  <View className="bg-white/30 rounded-full p-1.5 mr-3">
                    <Icon name="search" size={16} color="#FFFFFF" />
                  </View>
                  <Text className="text-white flex-1">
                    {features.interestSearchLimit === 'unlimited' ? t('features.interestSearchUnlimited') : 
                     features.interestSearchLimit === 3 ? t('features.interestSearchThree') : 
                     t('features.interestSearchAllTypes')}
                  </Text>
                </View>

                {/* 검색 유효기간 */}
                <View className="flex-row items-center mb-3">
                  <View className="bg-white/30 rounded-full p-1.5 mr-3">
                    <Icon name="time-outline" size={16} color="#FFFFFF" />
                  </View>
                  <Text className="text-white flex-1">
                    {features.interestSearchDuration === 365 ? t('features.searchDurationUnlimited') : 
                     t('features.searchDuration', { days: features.interestSearchDuration })}
                  </Text>
                </View>

                {/* 일일 좋아요 */}
                <View className="flex-row items-center mb-3">
                  <View className="bg-white/30 rounded-full p-1.5 mr-3">
                    <Icon name="heart" size={16} color="#FFFFFF" />
                  </View>
                  <Text className="text-white flex-1">
                    {features.dailyLikeLimit === 'unlimited' ? t('features.dailyLikesUnlimited') : 
                     t('features.dailyLikes', { count: features.dailyLikeLimit })}
                  </Text>
                </View>

                {/* 추가 기능들 */}
                {features.canSendInterestFirst && (
                  <View className="flex-row items-center mb-3">
                    <View className="bg-green-400/30 rounded-full p-1.5 mr-3">
                      <Icon name="send" size={16} color="#10B981" />
                    </View>
                    <Text className="text-white flex-1">
                      {t('features.sendInterestFirst')}
                    </Text>
                  </View>
                )}

                {features.seeWhoLikedYou && (
                  <View className="flex-row items-center mb-3">
                    <View className="bg-green-400/30 rounded-full p-1.5 mr-3">
                      <Icon name="eye" size={16} color="#10B981" />
                    </View>
                    <Text className="text-white flex-1">
                      {t('features.seeWhoLikedYou')}
                    </Text>
                  </View>
                )}

                {features.priorityMatching && (
                  <View className="flex-row items-center mb-3">
                    <View className="bg-yellow-400/30 rounded-full p-1.5 mr-3">
                      <Icon name="flash" size={16} color="#FCD34D" />
                    </View>
                    <Text className="text-white flex-1">
                      {t('features.priorityMatching')}
                    </Text>
                  </View>
                )}

                {features.personaTopPlacement && (
                  <View className="flex-row items-center">
                    <View className="bg-yellow-400/30 rounded-full p-1.5 mr-3">
                      <Icon name="trophy" size={16} color="#FCD34D" />
                    </View>
                    <Text className="text-white flex-1">
                      {t('features.personaTopPlacement')}
                    </Text>
                  </View>
                )}
              </View>

              {/* 구독 버튼 */}
              <TouchableOpacity
                className={`mt-4 py-4 rounded-2xl ${
                  isCurrentPlan ? 'bg-white/30' : 'bg-white'
                }`}
                onPress={() => handleSubscribe(tier)}
                disabled={isCurrentPlan}
              >
                <Text className={`text-center font-bold text-base ${
                  isCurrentPlan ? 'text-white' : 
                  tier === SubscriptionTier.PREMIUM ? 'text-yellow-600' :
                  tier === SubscriptionTier.ADVANCED ? 'text-pink-600' : 'text-gray-600'
                }`}>
                  {isCurrentPlan ? t('plans.currentPlan') : t('plans.selectPlan')}
                </Text>
              </TouchableOpacity>
            </LinearGradient>
          </View>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-gradient-to-b from-pink-50 to-purple-50 dark:from-gray-900 dark:to-gray-800">
      {/* 헤더 */}
      <View className="flex-row items-center justify-between px-5 py-4 border-b border-gray-200 dark:border-gray-700">
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          className="p-2"
        >
          <Icon name="arrow-back" size={24} color={isDark ? '#FFFFFF' : '#000000'} />
        </TouchableOpacity>
        
        <Text className="text-xl font-bold text-gray-900 dark:text-white">
          {t('screen.title')}
        </Text>
        
        <View className="w-10" />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* 현재 구독 상태 */}
        <Animated.View
          style={{
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          }}
          className="mx-5 mt-5 mb-6"
        >
          <LinearGradient
            colors={['#FF6B6B', '#FF8A8A']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            className="rounded-2xl p-4 flex-row items-center"
          >
            <View className="bg-white/20 rounded-full p-3 mr-4">
              <Icon 
                name={currentTier === SubscriptionTier.PREMIUM ? 'star' : 
                      currentTier === SubscriptionTier.ADVANCED ? 'star-outline' : 'person'} 
                size={24} 
                color="#FFFFFF" 
              />
            </View>
            <View className="flex-1">
              <Text className="text-white font-bold text-lg">
                {t('screen.currentPlan', { 
                  tier: currentTier === SubscriptionTier.BASIC ? t('plans.free') : 
                        currentTier === SubscriptionTier.ADVANCED ? t('plans.advanced') : t('plans.premium')
                })}
              </Text>
              {currentTier !== SubscriptionTier.BASIC && (
                <Text className="text-white/80 text-sm mt-1">
                  {t('screen.nextPayment', { date: '2025년 2월 19일' })}
                </Text>
              )}
            </View>
          </LinearGradient>
        </Animated.View>

        {/* 결제 주기 선택 */}
        <View className="mx-5 mb-6">
          <View className="bg-white dark:bg-gray-800 rounded-2xl p-1 flex-row">
            <TouchableOpacity
              className={`flex-1 py-3 rounded-xl ${
                selectedBilling === 'monthly' ? 'bg-pink-500' : ''
              }`}
              onPress={() => setSelectedBilling('monthly')}
            >
              <Text className={`text-center font-semibold ${
                selectedBilling === 'monthly' ? 'text-white' : 'text-gray-600 dark:text-gray-300'
              }`}>
                {t('billing.monthly')}
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              className={`flex-1 py-3 rounded-xl flex-row items-center justify-center ${
                selectedBilling === 'yearly' ? 'bg-pink-500' : ''
              }`}
              onPress={() => setSelectedBilling('yearly')}
            >
              <Text className={`font-semibold ${
                selectedBilling === 'yearly' ? 'text-white' : 'text-gray-600 dark:text-gray-300'
              }`}>
                {t('billing.yearly')}
              </Text>
              {selectedBilling === 'yearly' && (
                <View className="ml-2 bg-green-500 px-2 py-0.5 rounded-full">
                  <Text className="text-white text-xs font-bold">
                    {t('billing.discount')}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* 구독 플랜 카드들 */}
        <View className="px-5 pb-10">
          {[SubscriptionTier.BASIC, SubscriptionTier.ADVANCED, SubscriptionTier.PREMIUM].map((tier, index) => 
            renderPlanCard(tier, index)
          )}
        </View>

        {/* 추가 정보 */}
        <View className="mx-5 mb-10 bg-blue-50 dark:bg-blue-900/20 rounded-2xl p-4">
          <View className="flex-row items-center mb-2">
            <Icon name="information-circle" size={20} color="#3B82F6" />
            <Text className="ml-2 text-blue-600 dark:text-blue-400 font-semibold">
              {t('info.title')}
            </Text>
          </View>
          <Text className="text-gray-600 dark:text-gray-300 text-sm leading-5">
            {t('info.description')}
          </Text>
        </View>
      </ScrollView>

      {/* 결제 모달 */}
      {showPaymentModal && (
        <PaymentModal
          visible={showPaymentModal}
          onClose={() => setShowPaymentModal(false)}
          onSuccess={handlePaymentSuccess}
          selectedTier={selectedTier}
          billingCycle={selectedBilling}
        />
      )}
    </SafeAreaView>
  );
};