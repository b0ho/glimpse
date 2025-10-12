/**
 * 주변 사용자 화면 (NativeWind v4 버전)
 *
 * @screen
 * @description 현재 위치 기반 주변 사용자를 표시하고 익명 매칭 기능을 제공하는 화면
 */
import React, { useState, useCallback } from 'react';
import {
  View,
  SafeAreaView,
  ScrollView,
  RefreshControl,
  FlatList,
  Text,
  TouchableOpacity,
  Alert,
  Platform,
} from 'react-native';
import { useNavigation, useIsFocused } from '@react-navigation/native';
import { useAndroidSafeTranslation } from '@/hooks/useAndroidSafeTranslation';
import { useTheme } from '@/hooks/useTheme';
import { useAuthStore } from '@/store/slices/authSlice';
import { useLikeStore } from '@/store/slices/likeSlice';
import { usePersonaStore } from '@/store/slices/personaSlice';
import { useChatStore } from '@/store/slices/chatSlice';
import { PersonaSettingsModal } from '@/components/persona/PersonaSettingsModal';
import { locationTracker } from '@/services/locationTracker';
import { ServerConnectionError } from '@/components/ServerConnectionError';
import { IconWrapper as Icon } from '@/components/IconWrapper';

// 커스텀 훅
import { useLocationPermission } from '@/hooks/nearby/useLocationPermission';
import { useNearbyUsers } from '@/hooks/nearby/useNearbyUsers';

// 컴포넌트
import { LocationPermissionPrompt } from '@/components/nearby/LocationPermissionPrompt';
import { RadiusSelector } from '@/components/nearby/RadiusSelector';
import { NearbyUserCard } from '@/components/nearby/NearbyUserCard';
import { LoadingScreen } from '@/components/common';
import { EmptyState } from '@/components/common';

// 타입
import { NearbyUser } from '@/types';

/**
 * 주변 사용자 화면 컴포넌트
 *
 * @component
 * @returns {JSX.Element} 주변 사용자 목록 화면 UI
 *
 * @description
 * 사용자의 현재 위치를 기반으로 주변 사용자를 검색하고 익명 매칭을 제공합니다.
 * - 위치 권한 요청 및 관리
 * - 검색 반경 설정
 * - 익명 좋아요 보내기 (구독 티어에 따른 제한)
 * - 매칭 시 채팅 시작
 * - 페르소나 기반 위치 추적
 * - 실시간 거리 계산 및 표시
 *
 * @navigation
 * - From: HomeScreen, TabNavigator
 * - To: Chat, Premium, PersonaSettings
 *
 * @example
 * ```tsx
 * navigation.navigate('NearbyUsers');
 * ```
 *
 * @category Screen
 * @subcategory Nearby
 */
export const NearbyUsersScreen = React.memo(() => {
  const isFocused = useIsFocused();
  const navigation = useNavigation<any>();
  const { t } = useAndroidSafeTranslation('location');
  const { colors } = useTheme();
  const { user, getSubscriptionTier, getSubscriptionFeatures } = useAuthStore();
  const { sendLike, getRemainingFreeLikes } = useLikeStore();
  const personaStore = usePersonaStore();
  const chatStore = useChatStore();
  
  const subscriptionTier = getSubscriptionTier();
  const features = getSubscriptionFeatures();
  
  const [showPersonaModal, setShowPersonaModal] = useState(false);

  // 위치 권한 관리
  const {
    currentLocation,
    locationPermissionGranted,
    isLoading,
    requestLocationPermission,
    updateLocation,
  } = useLocationPermission();

  // 주변 사용자 관리
  const {
    nearbyUsers,
    selectedRadius,
    radiusOptions,
    refreshing,
    serverConnectionError,
    loadNearbyUsers,
    hideUser,
    markUserAsLiked,
    isUserLiked,
    changeRadius,
  } = useNearbyUsers(currentLocation);

  // 페르소나 위치 추적 시작
  React.useEffect(() => {
    if (personaStore.myPersona && personaStore.locationSharingEnabled) {
      locationTracker.startTracking();
    }
    return () => {
      locationTracker.stopTracking();
    };
  }, [personaStore.myPersona, personaStore.locationSharingEnabled]);

  const handleLikeUser = useCallback(async (targetUser: NearbyUser) => {
    try {
      const remainingLikes = getRemainingFreeLikes();
      const isUnlimited = subscriptionTier === 'PREMIUM' || subscriptionTier === 'ADVANCED';
      
      if (!isUnlimited && remainingLikes <= 0) {
        Alert.alert(
          t('location:noLikesLeft'),
          t('location:upgradeToPremium'),
          [
            { text: t('common:cancel'), style: 'cancel' },
            { 
              text: t('common:upgrade'), 
              onPress: () => navigation.navigate('Premium')
            }
          ]
        );
        return;
      }

      const result = await sendLike({
        targetUserId: targetUser.id,
        targetGroupId: null,
        metadata: {
          sentFrom: 'nearby',
          distance: targetUser.distance,
          location: currentLocation ? {
            latitude: currentLocation.latitude,
            longitude: currentLocation.longitude,
          } : undefined,
        }
      });

      if (result.success) {
        markUserAsLiked(targetUser.id);
        
        if (result.isMatch) {
          Alert.alert(
            t('location:matchFound'),
            t('location:matchFoundMessage', { name: targetUser.nickname }),
            [
              { text: t('common:later'), style: 'cancel' },
              { 
                text: t('common:chat'), 
                onPress: () => navigation.navigate('Chat', { userId: targetUser.id })
              }
            ]
          );
        } else {
          Alert.alert(t('common:success'), t('location:likeSent'));
        }
      }
    } catch (error) {
      console.error('좋아요 전송 실패:', error);
      Alert.alert(t('common:error'), t('location:likeFailed'));
    }
  }, [
    currentLocation,
    getRemainingFreeLikes,
    markUserAsLiked,
    navigation,
    sendLike,
    subscriptionTier,
    t
  ]);

  const handleStartChat = useCallback((targetUser: NearbyUser) => {
    navigation.navigate('Chat', { 
      userId: targetUser.id,
      userName: targetUser.nickname 
    });
  }, [navigation]);

  const handleRefresh = useCallback(async () => {
    await updateLocation();
    await loadNearbyUsers();
  }, [updateLocation, loadNearbyUsers]);

  // 웹에서 포커스되지 않은 경우 빈 View 반환
  if (Platform.OS === 'web' && !isFocused) {
    return <View className="flex-1" />;
  }

  if (isLoading) {
    return <LoadingScreen message={t('location:loadingLocation')} colors={colors} />;
  }

  if (!locationPermissionGranted) {
    return (
      <LocationPermissionPrompt
        onRequestPermission={requestLocationPermission}
        isLoading={isLoading}
        colors={colors}
        t={t}
      />
    );
  }

  if (serverConnectionError) {
    return <ServerConnectionError onRetry={loadNearbyUsers} />;
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50 dark:bg-gray-900">
      {/* 헤더 */}
      <View className="flex-row justify-between items-center px-4 py-3 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="arrow-back" size={24} color={colors.TEXT.PRIMARY} />
        </TouchableOpacity>
        <Text className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          {t('location:nearbyUsers.title')}
        </Text>
        <TouchableOpacity 
          className="bg-red-500 px-3 py-1.5 rounded-2xl"
          onPress={() => setShowPersonaModal(true)}
        >
          <Text className="text-sm font-semibold text-white">
            페르소나 설정
          </Text>
        </TouchableOpacity>
      </View>

      {/* 현재 위치 표시 */}
      {currentLocation && (
        <View className="flex-row items-center px-4 py-2 mx-4 mt-2 bg-white dark:bg-gray-800 rounded-lg">
          <Icon name="location" size={16} color={colors.PRIMARY} />
          <Text className="text-sm text-gray-500 dark:text-gray-400 ml-2">
            {currentLocation.address || t('location:currentLocation')}
          </Text>
        </View>
      )}

      {/* 반경 선택 */}
      <RadiusSelector
        selectedRadius={selectedRadius}
        radiusOptions={radiusOptions}
        onRadiusChange={changeRadius}
        colors={colors}
        t={t}
      />

      {/* 주변 사용자 목록 */}
      {nearbyUsers.length === 0 ? (
        <ScrollView
          contentContainerStyle={{ flex: 1 }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={colors.PRIMARY}
            />
          }
        >
          <EmptyState
            icon="people-outline"
            title={t('location:noNearbyUsers')}
            description={t('location:tryIncreasingRadius')}
            colors={colors}
          />
        </ScrollView>
      ) : (
        <FlatList
          data={nearbyUsers}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <NearbyUserCard
              user={item}
              onLike={() => handleLikeUser(item)}
              onHide={() => hideUser(item.id)}
              onChat={() => handleStartChat(item)}
              isLiked={isUserLiked(item.id)}
              canLike={!isUserLiked(item.id) && (
                subscriptionTier === 'PREMIUM' || 
                subscriptionTier === 'ADVANCED' || 
                getRemainingFreeLikes() > 0
              )}
              colors={colors}
              t={t}
            />
          )}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={colors.PRIMARY}
            />
          }
          contentContainerStyle={{ paddingBottom: 100 }}
        />
      )}

      {/* 페르소나 설정 모달 */}
      {showPersonaModal && (
        <PersonaSettingsModal
          visible={showPersonaModal}
          onClose={() => setShowPersonaModal(false)}
          onSave={(persona) => {
            personaStore.updateMyPersona(persona);
            setShowPersonaModal(false);
          }}
          persona={personaStore.myPersona}
        />
      )}
    </SafeAreaView>
  );
});