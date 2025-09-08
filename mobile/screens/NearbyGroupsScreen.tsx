import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
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
import { shadowStyles } from '@/utils/shadowStyles';
import { useAuthStore } from '@/store/slices/authSlice';
import { COLORS, SPACING, FONT_SIZES } from '@/utils/constants';
import { ServerConnectionError } from '@/components/ServerConnectionError';

// Types
import { LocationGroup } from '@/types/nearbyGroups';

// Hooks
import { useLocationPermission } from '@/hooks/nearbyGroups/useLocationPermission';
import { useNearbyGroupsData } from '@/hooks/nearbyGroups/useNearbyGroupsData';

// Components
import { NearbyGroupItem } from '@/components/nearbyGroups/NearbyGroupItem';

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
    <View style={styles.header}>
      {/* 위치 정보 */}
      {currentLocation && (
        <View style={[styles.locationCard, { backgroundColor: colors.SURFACE }]}>
          <Icon name="location" size={20} color={colors.PRIMARY} />
          <View style={styles.locationInfo}>
            <Text style={[styles.locationTitle, { color: colors.TEXT.PRIMARY }]}>
              {t('nearbygroups:currentLocation')}
            </Text>
            {currentLocation.address && (
              <Text style={[styles.locationAddress, { color: colors.TEXT.SECONDARY }]}>
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
      <View style={styles.radiusSelector}>
        <Text style={[styles.radiusSelectorTitle, { color: colors.TEXT.PRIMARY }]}>
          {t('nearbygroups:searchRadius')}
        </Text>
        <View style={styles.radiusButtons}>
          {radiusOptions.map(radius => (
            <TouchableOpacity
              key={radius}
              style={[
                styles.radiusButton,
                selectedRadius === radius && styles.radiusButtonActive,
                selectedRadius === radius && { backgroundColor: colors.PRIMARY }
              ]}
              onPress={() => handleRadiusChange(radius)}
            >
              <Text
                style={[
                  styles.radiusButtonText,
                  { color: selectedRadius === radius ? colors.WHITE : colors.TEXT.PRIMARY }
                ]}
              >
                {radius}km
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* 통계 */}
      <View style={[styles.statsCard, { backgroundColor: colors.SURFACE }]}>
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: colors.PRIMARY }]}>
            {nearbyGroups.length}
          </Text>
          <Text style={[styles.statLabel, { color: colors.TEXT.SECONDARY }]}>
            {t('nearbygroups:nearbyGroupsCount')}
          </Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: colors.SUCCESS }]}>
            {nearbyGroups.filter(g => g.isJoined).length}
          </Text>
          <Text style={[styles.statLabel, { color: colors.TEXT.SECONDARY }]}>
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
    <View style={styles.emptyContainer}>
      {!locationPermissionGranted ? (
        <>
          <Icon name="location-outline" size={80} color={colors.TEXT.SECONDARY} />
          <Text style={[styles.emptyTitle, { color: colors.TEXT.PRIMARY }]}>
            {t('nearbygroups:noPermission.title')}
          </Text>
          <Text style={[styles.emptyText, { color: colors.TEXT.SECONDARY }]}>
            {t('nearbygroups:noPermission.message')}
          </Text>
          <TouchableOpacity
            style={[styles.emptyButton, { backgroundColor: colors.PRIMARY }]}
            onPress={refreshLocation}
          >
            <Text style={[styles.emptyButtonText, { color: colors.WHITE }]}>
              {t('nearbygroups:noPermission.button')}
            </Text>
          </TouchableOpacity>
        </>
      ) : nearbyGroups.length === 0 && !isLoading ? (
        <>
          <Icon name="people-outline" size={80} color={colors.TEXT.SECONDARY} />
          <Text style={[styles.emptyTitle, { color: colors.TEXT.PRIMARY }]}>
            {t('nearbygroups:empty.title')}
          </Text>
          <Text style={[styles.emptyText, { color: colors.TEXT.SECONDARY }]}>
            {t('nearbygroups:empty.message')}
          </Text>
          <TouchableOpacity
            style={[styles.emptyButton, { backgroundColor: colors.PRIMARY }]}
            onPress={handleCreateGroup}
          >
            <Text style={[styles.emptyButtonText, { color: colors.WHITE }]}>
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
    <SafeAreaView style={[styles.container, { backgroundColor: colors.BACKGROUND }]}>
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
        contentContainerStyle={nearbyGroups.length === 0 ? styles.emptyListContent : undefined}
      />

      {/* 로딩 인디케이터 */}
      {(isLoading || isLocationLoading) && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={colors.PRIMARY} />
        </View>
      )}

      {/* 플로팅 액션 버튼 */}
      <TouchableOpacity
        style={[styles.fab, { backgroundColor: colors.PRIMARY }]}
        onPress={handleCreateGroup}
      >
        <Icon name="add" size={28} color={colors.WHITE} />
      </TouchableOpacity>
    </SafeAreaView>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: SPACING.MD,
  },
  locationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.MD,
    borderRadius: 12,
    marginBottom: SPACING.MD,
  },
  locationInfo: {
    flex: 1,
    marginLeft: SPACING.SM,
  },
  locationTitle: {
    fontSize: FONT_SIZES.SM,
    fontWeight: '600',
  },
  locationAddress: {
    fontSize: FONT_SIZES.XS,
    marginTop: 2,
  },
  radiusSelector: {
    marginBottom: SPACING.MD,
  },
  radiusSelectorTitle: {
    fontSize: FONT_SIZES.SM,
    fontWeight: '600',
    marginBottom: SPACING.SM,
  },
  radiusButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  radiusButton: {
    flex: 1,
    paddingVertical: SPACING.SM,
    marginHorizontal: 4,
    borderRadius: 8,
    backgroundColor: COLORS.GRAY_200,
    alignItems: 'center',
  },
  radiusButtonActive: {
    backgroundColor: COLORS.PRIMARY,
  },
  radiusButtonText: {
    fontSize: FONT_SIZES.SM,
    fontWeight: '500',
  },
  statsCard: {
    flexDirection: 'row',
    padding: SPACING.MD,
    borderRadius: 12,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: FONT_SIZES.XXL,
    fontWeight: 'bold',
  },
  statLabel: {
    fontSize: FONT_SIZES.XS,
    marginTop: 4,
  },
  statDivider: {
    width: 1,
    backgroundColor: COLORS.GRAY_300,
    marginHorizontal: SPACING.MD,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING.XL,
  },
  emptyListContent: {
    flex: 1,
  },
  emptyTitle: {
    fontSize: FONT_SIZES.LG,
    fontWeight: '600',
    marginTop: SPACING.MD,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: FONT_SIZES.SM,
    marginTop: SPACING.SM,
    textAlign: 'center',
    lineHeight: 20,
  },
  emptyButton: {
    paddingHorizontal: SPACING.LG,
    paddingVertical: SPACING.MD,
    borderRadius: 8,
    marginTop: SPACING.LG,
  },
  emptyButtonText: {
    fontSize: FONT_SIZES.MD,
    fontWeight: '600',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fab: {
    position: 'absolute',
    right: SPACING.MD,
    bottom: SPACING.XL,
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadowStyles.button,
  },
});