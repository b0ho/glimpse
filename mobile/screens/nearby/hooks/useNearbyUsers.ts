import { useState, useCallback } from 'react';
import { Alert } from 'react-native';
import { NearbyUser } from '@/types';
import { locationApi } from '@/services/api/locationApi';
import { LocationData } from './useLocation';

export const useNearbyUsers = () => {
  const [nearbyUsers, setNearbyUsers] = useState<NearbyUser[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const loadNearbyUsers = useCallback(async (
    location: LocationData,
    radius: number
  ) => {
    if (!location) return;

    try {
      setIsLoading(true);
      
      const response = await locationApi.getNearbyUsers({
        latitude: location.latitude,
        longitude: location.longitude,
        radius: radius * 1000, // Convert km to meters
      });
      
      // Convert User[] to NearbyUser[]
      const nearbyUsersData: NearbyUser[] = response.users.map(user => ({
        ...user,
        anonymousId: user.id, // Using ID as anonymous ID
        distance: 0, // Distance will be calculated by server
        lastSeen: new Date().toISOString(),
        isOnline: true,
        commonGroups: [],
        lastLocationUpdate: new Date(),
        isVisible: true
      }));

      setNearbyUsers(nearbyUsersData);
    } catch (error: any) {
      console.error('Load nearby users error:', error);
      Alert.alert(
        '오류',
        error.response?.data?.message || '주변 사용자를 불러올 수 없습니다.'
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  const updateLocationToServer = useCallback(async (
    location: LocationData
  ) => {
    try {
      await locationApi.updateLocation({
        latitude: location.latitude,
        longitude: location.longitude,
      });
    } catch (error) {
      console.error('Update location error:', error);
      // 위치 업데이트 실패는 조용히 처리 (사용자에게 알리지 않음)
    }
  }, []);

  return {
    nearbyUsers,
    isLoading,
    loadNearbyUsers,
    updateLocationToServer,
  };
};