/**
 * 주변 사용자 화면 - 모듈화된 버전
 * 
 * 이 파일은 1,172줄에서 약 300줄로 리팩토링되었습니다.
 * 모든 로직과 컴포넌트가 분리되었습니다.
 */
import React, { useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  RefreshControl,
  FlatList,
  Text,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
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

export const NearbyUsersScreen = React.memo(() => {
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
    <SafeAreaView style={[styles.container, { backgroundColor: colors.BACKGROUND }]}>
      {/* 헤더 */}
      <View style={[styles.header, { backgroundColor: colors.BACKGROUND }]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="arrow-back" size={24} color={colors.TEXT.PRIMARY} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.TEXT.PRIMARY }]}>
          {t('location:nearbyUsers.title')}
        </Text>
        <TouchableOpacity 
          style={[styles.personaButton, { backgroundColor: colors.PRIMARY }]}
          onPress={() => setShowPersonaModal(true)}
        >
          <Text style={[styles.personaButtonText, { color: colors.TEXT.WHITE }]}>
            페르소나 설정
          </Text>
        </TouchableOpacity>
      </View>

      {/* 현재 위치 표시 */}
      {currentLocation && (
        <View style={[styles.locationInfo, { backgroundColor: colors.SURFACE }]}>
          <Icon name="location" size={16} color={colors.PRIMARY} />
          <Text style={[styles.locationText, { color: colors.TEXT.SECONDARY }]}>
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
          contentContainerStyle={styles.emptyContainer}
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
          contentContainerStyle={styles.listContent}
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  personaButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  personaButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  locationInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginHorizontal: 16,
    marginTop: 8,
    borderRadius: 8,
  },
  locationText: {
    fontSize: 14,
    marginLeft: 8,
  },
  emptyContainer: {
    flex: 1,
  },
  listContent: {
    paddingBottom: 100,
  },
});