/**
 * 주변 사용자 관리 훅
 */
import { useState, useCallback, useEffect } from 'react';
import { Alert } from 'react-native';
import { NearbyUser } from '@/types';
import { apiClient } from '@/services/api/config';
import { LocationData } from './useLocationPermission';

export const useNearbyUsers = (currentLocation: LocationData | null) => {
  const [nearbyUsers, setNearbyUsers] = useState<NearbyUser[]>([]);
  const [selectedRadius, setSelectedRadius] = useState(2); // 기본 2km
  const [hiddenUsers, setHiddenUsers] = useState<Set<string>>(new Set());
  const [likedUsers, setLikedUsers] = useState<Set<string>>(new Set());
  const [refreshing, setRefreshing] = useState(false);
  const [serverConnectionError, setServerConnectionError] = useState(false);

  const radiusOptions = [1, 2, 5, 10]; // km 단위

  const loadNearbyUsers = useCallback(async () => {
    if (!currentLocation) return;

    try {
      setRefreshing(true);
      setServerConnectionError(false);
      
      // 개발 환경에서는 항상 더미 데이터 사용
      if (__DEV__) {
        const dummyUsers = getDummyNearbyUsers().filter(user => 
          !hiddenUsers.has(user.id)
        );
        setNearbyUsers(dummyUsers);
        setRefreshing(false);
        return;
      }
      
      // 먼저 사용자 위치 업데이트
      try {
        await apiClient.put('/location', {
          latitude: currentLocation.latitude,
          longitude: currentLocation.longitude,
        });
      } catch (locationError) {
        console.log('위치 업데이트 실패 (선택적):', locationError);
        // 위치 업데이트 실패해도 근처 사용자 검색은 계속 진행
      }
      
      const response = await apiClient.get('/location/nearby/users', {
        radius: selectedRadius, // km 단위로 전송
      });

      if (response.success && response.data) {
        const users = response.data.filter((user: NearbyUser) => 
          !hiddenUsers.has(user.id)
        );
        setNearbyUsers(users);
      }
    } catch (error) {
      console.error('주변 사용자 로드 실패:', error);
      setServerConnectionError(true);
      
      // 개발 환경에서 더미 데이터 제공
      if (__DEV__) {
        setNearbyUsers(getDummyNearbyUsers());
      }
    } finally {
      setRefreshing(false);
    }
  }, [currentLocation, selectedRadius, hiddenUsers]);

  const hideUser = useCallback((userId: string) => {
    setHiddenUsers(prev => new Set([...prev, userId]));
    setNearbyUsers(prev => prev.filter(user => user.id !== userId));
  }, []);

  const markUserAsLiked = useCallback((userId: string) => {
    setLikedUsers(prev => new Set([...prev, userId]));
  }, []);

  const isUserLiked = useCallback((userId: string) => {
    return likedUsers.has(userId);
  }, [likedUsers]);

  const changeRadius = useCallback((newRadius: number) => {
    setSelectedRadius(newRadius);
  }, []);

  useEffect(() => {
    if (currentLocation) {
      loadNearbyUsers();
    }
  }, [currentLocation, selectedRadius]);

  return {
    nearbyUsers,
    selectedRadius,
    radiusOptions,
    hiddenUsers,
    likedUsers,
    refreshing,
    serverConnectionError,
    loadNearbyUsers,
    hideUser,
    markUserAsLiked,
    isUserLiked,
    changeRadius,
  };
};

// 개발용 더미 데이터
function getDummyNearbyUsers(): NearbyUser[] {
  return [
    {
      id: 'nearby-1',
      nickname: '근처사용자1',
      profileImageUrl: null,
      distance: 0.5,
      persona: {
        bio: '안녕하세요! 운동 좋아하는 직장인입니다.',
        interests: ['운동', '영화', '카페'],
        ageRange: '20대 후반',
        occupation: '개발자'
      },
      lastLocation: {
        latitude: 37.5665,
        longitude: 126.9780,
        updatedAt: new Date().toISOString()
      },
      mutualGroups: []
    },
    {
      id: 'nearby-2',
      nickname: '근처사용자2',
      profileImageUrl: null,
      distance: 1.2,
      persona: {
        bio: '책 읽는 것을 좋아합니다',
        interests: ['독서', '카페', '산책'],
        ageRange: '30대 초반',
        occupation: '프리랜서'
      },
      lastLocation: {
        latitude: 37.5700,
        longitude: 126.9800,
        updatedAt: new Date().toISOString()
      },
      mutualGroups: []
    }
  ];
}