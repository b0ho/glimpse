/**
 * 주변 그룹 화면 (NativeWind v4 버전)
 *
 * @screen
 * @description 현재 위치 기반 주변 그룹을 표시하고 관리하는 화면
 */
import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  SafeAreaView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  RefreshControl,
  FlatList,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAndroidSafeTranslation } from '@/hooks/useAndroidSafeTranslation';
import Icon from 'react-native-vector-icons/Ionicons';
import { useTheme } from '@/hooks/useTheme';
import { useAuthStore } from '@/store/slices/authSlice';
import { ServerConnectionError } from '@/components/ServerConnectionError';

// Types
import { LocationGroup } from '@/types/nearbyGroups';

// Hooks
import { useLocationPermission } from '@/hooks/nearbyGroups/useLocationPermission';
import { useNearbyGroupsData } from '@/hooks/nearbyGroups/useNearbyGroupsData';

// Components
import { NearbyGroupItem } from '@/components/nearbyGroups/NearbyGroupItem';

/**
 * 주변 그룹 화면 컴포넌트
 *
 * @component
 * @returns {JSX.Element} 주변 그룹 목록 화면 UI
 *
 * @description
 * 사용자의 현재 위치를 기반으로 주변 그룹을 검색하고 표시합니다.
 * - 위치 권한 요청 및 관리
 * - 검색 반경 설정 (1km, 2km, 5km, 10km)
 * - 그룹 참여/탈퇴 기능
 * - 새로운 위치 기반 그룹 생성
 * - 실시간 거리 계산 및 표시
 *
 * @navigation
 * - From: HomeScreen, TabNavigator
 * - To: CreateLocationGroup, GroupDetail
 *
 * @example
 * ```tsx
 * navigation.navigate('NearbyGroups');
 * ```
 *
 * @category Screen
 * @subcategory Nearby
 */
export const NearbyGroupsScreen = React.memo(() => {
  const navigation = useNavigation();
  const { t } = useAndroidSafeTranslation(['nearbygroups', 'navigation', 'common']);
  const { colors } = useTheme();
  const { user } = useAuthStore();
  
  // State
  const [selectedRadius, setSelectedRadius] = useState(2); // 기본 2km
  const [showMapView, setShowMapView] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<LocationGroup | null>(null);

  // Hooks
  const {
    currentLocation,
    locationPermissionGranted,
    isLocationLoading,
    locationError,
    refreshLocation,
    formatDistance,
  } = useLocationPermission(t);

  const {
    nearbyGroups,
    isLoading,
    refreshing,
    serverConnectionError,
    handleJoinGroup,
    handleLeaveGroup,
    handleRefresh,
  } = useNearbyGroupsData(currentLocation, selectedRadius, t);

  const radiusOptions = [1, 2, 5, 10]; // km 단위

  /**
   * 그룹 상세 보기
   */
  const handleGroupPress = useCallback((group: LocationGroup) => {
    setSelectedGroup(group);
    // TODO: Navigate to group detail screen or show modal
    Alert.alert(
      group.name,
      `${group.description}\n\n${t('nearbygroups:memberCount', { 
        count: group.activeMembers,
        total: group.memberCount 
      })}\n${t('nearbygroups:distance')}: ${formatDistance(group.distance || 0)}`,
      [
        { text: t('common:close'), style: 'cancel' }
      ]
    );
  }, [t, formatDistance]);

  /**
   * 반경 변경
   */
  const handleRadiusChange = useCallback((radius: number) => {
    setSelectedRadius(radius);
  }, []);

  /**
   * 그룹 생성 화면으로 이동
   */
  const handleCreateGroup = useCallback(() => {
    if (!locationPermissionGranted) {
      Alert.alert(
        t('nearbygroups:alerts.permission.title'),
        t('nearbygroups:alerts.permission.required')
      );
      return;
    }
    
    // @ts-ignore
    navigation.navigate('CreateLocationGroup', {
      currentLocation,
    });
  }, [navigation, currentLocation, locationPermissionGranted, t]);

  /**
   * 리스트 헤더 렌더링
   */
  const renderHeader = () => (
    <View className="p-4">
      {/* 위치 정보 */}
      {currentLocation && (
        <View className="flex-row items-center p-4 bg-white dark:bg-gray-800 rounded-xl mb-4">
          <Icon name="location" size={20} color={colors.PRIMARY} />
          <View className="flex-1 ml-3">
            <Text className="text-sm font-semibold text-gray-900 dark:text-gray-100">
              {t('nearbygroups:currentLocation')}
            </Text>
            {currentLocation.address && (
              <Text className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                {currentLocation.address}
              </Text>
            )}
          </View>
          <TouchableOpacity onPress={refreshLocation}>
            <Icon name="refresh" size={20} color={colors.PRIMARY} />
          </TouchableOpacity>
        </View>
      )}

      {/* 반경 선택 */}
      <View className="mb-4">
        <Text className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">
          {t('nearbygroups:searchRadius')}
        </Text>
        <View className="flex-row justify-between">
          {radiusOptions.map(radius => (
            <TouchableOpacity
              key={radius}
              className={`flex-1 py-2 mx-1 rounded-lg items-center ${
                selectedRadius === radius 
                  ? 'bg-red-500' 
                  : 'bg-gray-200 dark:bg-gray-700'
              }`}
              onPress={() => handleRadiusChange(radius)}
            >
              <Text
                className={`text-sm font-medium ${
                  selectedRadius === radius 
                    ? 'text-white' 
                    : 'text-gray-900 dark:text-gray-100'
                }`}
              >
                {radius}km
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* 통계 */}
      <View className="flex-row p-4 bg-white dark:bg-gray-800 rounded-xl">
        <View className="flex-1 items-center">
          <Text className="text-2xl font-bold text-red-500">
            {nearbyGroups.length}
          </Text>
          <Text className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {t('nearbygroups:nearbyGroupsCount')}
          </Text>
        </View>
        <View className="w-px bg-gray-300 dark:bg-gray-600 mx-4" />
        <View className="flex-1 items-center">
          <Text className="text-2xl font-bold text-green-500">
            {nearbyGroups.filter(g => g.isJoined).length}
          </Text>
          <Text className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {t('nearbygroups:joinedGroupsCount')}
          </Text>
        </View>
      </View>
    </View>
  );

  /**
   * 빈 상태 렌더링
   */
  const renderEmpty = () => (
    <View className="flex-1 justify-center items-center px-8">
      {!locationPermissionGranted ? (
        <>
          <Icon name="location-outline" size={80} color={colors.TEXT.SECONDARY} />
          <Text className="text-lg font-semibold text-gray-900 dark:text-gray-100 mt-4 text-center">
            {t('nearbygroups:noPermission.title')}
          </Text>
          <Text className="text-sm text-gray-500 dark:text-gray-400 mt-2 text-center leading-5">
            {t('nearbygroups:noPermission.message')}
          </Text>
          <TouchableOpacity
            className="bg-red-500 px-6 py-3 rounded-lg mt-6"
            onPress={refreshLocation}
          >
            <Text className="text-white font-semibold">
              {t('nearbygroups:noPermission.button')}
            </Text>
          </TouchableOpacity>
        </>
      ) : nearbyGroups.length === 0 && !isLoading ? (
        <>
          <Icon name="people-outline" size={80} color={colors.TEXT.SECONDARY} />
          <Text className="text-lg font-semibold text-gray-900 dark:text-gray-100 mt-4 text-center">
            {t('nearbygroups:empty.title')}
          </Text>
          <Text className="text-sm text-gray-500 dark:text-gray-400 mt-2 text-center leading-5">
            {t('nearbygroups:empty.message')}
          </Text>
          <TouchableOpacity
            className="bg-red-500 px-6 py-3 rounded-lg mt-6"
            onPress={handleCreateGroup}
          >
            <Text className="text-white font-semibold">
              {t('nearbygroups:empty.button')}
            </Text>
          </TouchableOpacity>
        </>
      ) : null}
    </View>
  );

  if (serverConnectionError) {
    return (
      <ServerConnectionError
        onRetry={handleRefresh}
        message={t('nearbygroups:errors.serverConnection')}
      />
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50 dark:bg-gray-900">
      <FlatList
        data={nearbyGroups}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <NearbyGroupItem
            group={item}
            onPress={handleGroupPress}
            onJoin={handleJoinGroup}
            onLeave={handleLeaveGroup}
            formatDistance={formatDistance}
            t={t}
          />
        )}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmpty}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={colors.PRIMARY}
            colors={[colors.PRIMARY]}
          />
        }
        contentContainerStyle={nearbyGroups.length === 0 ? { flex: 1 } : undefined}
      />

      {/* 로딩 인디케이터 */}
      {(isLoading || isLocationLoading) && (
        <View className="absolute inset-0 bg-black/30 justify-center items-center">
          <ActivityIndicator size="large" color={colors.PRIMARY} />
        </View>
      )}

      {/* 플로팅 액션 버튼 */}
      <TouchableOpacity
        className="absolute right-4 bottom-8 w-14 h-14 bg-red-500 rounded-full justify-center items-center shadow-lg"
        onPress={handleCreateGroup}
        style={{
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.25,
          shadowRadius: 3.84,
          elevation: 5,
        }}
      >
        <Icon name="add" size={28} color="#FFFFFF" />
      </TouchableOpacity>
    </SafeAreaView>
  );
});