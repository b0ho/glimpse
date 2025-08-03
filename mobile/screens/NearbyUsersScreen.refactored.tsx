import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  SafeAreaView,
  FlatList,
  RefreshControl,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuthStore } from '@/store/slices/authSlice';
import { useLikeStore } from '@/store/slices/likeSlice';
import { NearbyUser } from '@/types';
import { COLORS } from '@/utils/constants';

// Import modularized components
import { LocationPermissionView } from './nearby/components/LocationPermissionView';
import { LocationHeader } from './nearby/components/LocationHeader';
import { RadiusSelector } from './nearby/components/RadiusSelector';
import { UserCard } from './nearby/components/UserCard';

// Import custom hooks
import { useLocation } from './nearby/hooks/useLocation';
import { useNearbyUsers } from './nearby/hooks/useNearbyUsers';

export const NearbyUsersScreen: React.FC = React.memo(() => {
  const navigation = useNavigation();
  const { user } = useAuthStore();
  const { sendLike, sentLikes } = useLikeStore();
  
  const [selectedRadius, setSelectedRadius] = useState(2); // 기본 2km
  const [refreshing, setRefreshing] = useState(false);
  
  const radiusOptions = [1, 2, 5, 10]; // km 단위

  // Use custom hooks for location management
  const {
    currentLocation,
    isLoading: isLocationLoading,
    locationPermissionGranted,
    requestLocationPermission,
    refreshLocation,
  } = useLocation();

  // Use custom hook for nearby users
  const {
    nearbyUsers,
    isLoading: isUsersLoading,
    loadNearbyUsers,
    updateLocationToServer,
  } = useNearbyUsers();

  // Update location on server when location changes
  useEffect(() => {
    if (currentLocation) {
      updateLocationToServer(currentLocation);
    }
  }, [currentLocation, updateLocationToServer]);

  // Load nearby users when location or radius changes
  useEffect(() => {
    if (currentLocation) {
      loadNearbyUsers(currentLocation, selectedRadius);
    }
  }, [currentLocation, selectedRadius, loadNearbyUsers]);

  // Handle pull to refresh
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refreshLocation();
    if (currentLocation) {
      await loadNearbyUsers(currentLocation, selectedRadius);
    }
    setRefreshing(false);
  }, [refreshLocation, currentLocation, selectedRadius, loadNearbyUsers]);

  // Handle like action
  const handleLike = useCallback(async (targetUser: NearbyUser) => {
    if (!user) return;

    try {
      await sendLike(targetUser.id, 'nearby');
      Alert.alert(
        '좋아요 전송',
        `${targetUser.nickname}님에게 좋아요를 보냈습니다!`,
        [{ text: '확인' }]
      );
    } catch (error: any) {
      Alert.alert(
        '오류',
        error.response?.data?.message || '좋아요 전송에 실패했습니다.'
      );
    }
  }, [user, sendLike]);

  // Handle message action
  const handleMessage = useCallback((targetUser: NearbyUser) => {
    // TODO: Check if user is matched
    navigation.navigate('Chat', {
      roomId: '', // TODO: Get actual room ID from match
      matchId: targetUser.id,
      otherUserNickname: targetUser.nickname,
    });
  }, [navigation]);

  // Render user item
  const renderUserItem = useCallback(({ item }: { item: NearbyUser }) => {
    const hasLiked = sentLikes.some(like => like.toUserId === item.id);
    
    return (
      <UserCard
        user={item}
        currentUserId={user?.id || ''}
        hasLiked={hasLiked}
        onLike={() => handleLike(item)}
        onMessage={() => handleMessage(item)}
      />
    );
  }, [user, sentLikes, handleLike, handleMessage]);

  // Show location permission view if not granted
  if (!locationPermissionGranted) {
    return (
      <SafeAreaView style={styles.container}>
        <LocationPermissionView
          isLoading={isLocationLoading}
          onRequestPermission={requestLocationPermission}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <LocationHeader
        address={currentLocation?.address}
        nearbyCount={nearbyUsers.length}
        onRefresh={onRefresh}
      />
      
      <RadiusSelector
        radiusOptions={radiusOptions}
        selectedRadius={selectedRadius}
        onRadiusChange={setSelectedRadius}
      />
      
      <FlatList
        data={nearbyUsers}
        keyExtractor={(item) => item.id}
        renderItem={renderUserItem}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl
            refreshing={refreshing || isUsersLoading}
            onRefresh={onRefresh}
            colors={[COLORS.primary]}
          />
        }
        ListEmptyComponent={() => (
          <View style={styles.emptyContainer}>
            {React.createElement(Text as any, { style: styles.emptyText },
              isUsersLoading 
                ? '주변 사용자를 찾는 중...' 
                : '주변에 사용자가 없습니다'
            )}
          </View>
        )}
      />
    </SafeAreaView>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.BACKGROUND,
  },
  listContainer: {
    paddingVertical: 8,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  emptyText: {
    fontSize: 16,
    color: COLORS.TEXT.SECONDARY,
  },
});