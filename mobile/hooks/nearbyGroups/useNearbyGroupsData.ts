import { useState, useCallback, useEffect } from 'react';
import { LocationData, LocationGroup, NewGroupFormData } from '@/types/nearbyGroups';
import apiClient from '@/services/api/config';
import { WebCompatibleAlert } from '@/utils/webAlert';

/**
 * 위치 기반 그룹 데이터 관리 Hook
 */
export const useNearbyGroupsData = (
  currentLocation: LocationData | null,
  selectedRadius: number,
  t: (key: string) => string
) => {
  const [nearbyGroups, setNearbyGroups] = useState<LocationGroup[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [serverConnectionError, setServerConnectionError] = useState(false);

  /**
   * 근처 그룹 로드
   */
  const loadNearbyGroups = useCallback(async (isRefresh = false) => {
    if (!currentLocation) return;
    
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setIsLoading(true);
      }
      setServerConnectionError(false);

      // 개발 환경에서는 더미 데이터 사용
      if (__DEV__) {
        const dummyGroups: LocationGroup[] = [
          {
            id: 'loc-1',
            name: '강남역 모임',
            description: '강남역에서 만나는 친목 모임',
            latitude: currentLocation.latitude + 0.001,
            longitude: currentLocation.longitude + 0.001,
            radius: 0.5,
            distance: 150,
            memberCount: 12,
            activeMembers: 8,
            createdBy: 'user1',
            createdAt: new Date(),
            expiresAt: new Date(Date.now() + 3 * 60 * 60 * 1000),
            isJoined: false,
          },
          {
            id: 'loc-2',
            name: '한강 러닝 크루',
            description: '한강에서 함께 달려요',
            latitude: currentLocation.latitude + 0.003,
            longitude: currentLocation.longitude - 0.002,
            radius: 1,
            distance: 420,
            memberCount: 25,
            activeMembers: 15,
            createdBy: 'user2',
            createdAt: new Date(),
            expiresAt: new Date(Date.now() + 5 * 60 * 60 * 1000),
            isJoined: true,
          },
          {
            id: 'loc-3',
            name: '홍대 카페 스터디',
            description: '카페에서 함께 공부해요',
            latitude: currentLocation.latitude - 0.005,
            longitude: currentLocation.longitude + 0.004,
            radius: 0.8,
            distance: 780,
            memberCount: 8,
            activeMembers: 6,
            createdBy: 'user3',
            createdAt: new Date(),
            isJoined: false,
          },
        ];

        // 거리 필터링
        const filteredGroups = dummyGroups.filter(
          group => (group.distance || 0) <= selectedRadius * 1000
        );

        setTimeout(() => {
          setNearbyGroups(filteredGroups);
          setIsLoading(false);
          setRefreshing(false);
        }, 1000);
        return;
      }

      // 실제 API 호출
      const response = await apiClient.get('/location-groups/nearby', {
        params: {
          latitude: currentLocation.latitude,
          longitude: currentLocation.longitude,
          radius: selectedRadius,
        },
      });

      if (response.success && response.data) {
        setNearbyGroups(response.data);
      }
    } catch (error) {
      console.error('Failed to load nearby groups:', error);
      setServerConnectionError(true);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, [currentLocation, selectedRadius]);

  /**
   * 그룹 참여
   */
  const handleJoinGroup = useCallback(async (group: LocationGroup) => {
    try {
      WebCompatibleAlert.alert(
        t('nearbygroups:alerts.join.title'),
        t('nearbygroups:alerts.join.message', { name: group.name }),
        [
          {
            text: t('common:cancel'),
            style: 'cancel',
          },
          {
            text: t('nearbygroups:alerts.join.confirm'),
            onPress: async () => {
              try {
                // 위치 기반 그룹 전용 API 호출
                const response = await apiClient.post(`/location-groups/${group.id}/join`);
                
                if (response.success) {
                  // 상태 업데이트
                  setNearbyGroups(prev => 
                    prev.map(g => 
                      g.id === group.id 
                        ? { ...g, isJoined: true, memberCount: g.memberCount + 1 }
                        : g
                    )
                  );
                  
                  WebCompatibleAlert.alert(
                    t('nearbygroups:alerts.join.successTitle'),
                    t('nearbygroups:alerts.join.successMessage', { name: group.name })
                  );
                }
              } catch (error) {
                console.error('Join location group error:', error);
                WebCompatibleAlert.alert(
                  t('common:error'),
                  t('nearbygroups:alerts.join.error')
                );
              }
            },
          },
        ]
      );
    } catch (error) {
      console.error('Join group error:', error);
    }
  }, [t]);

  /**
   * 그룹 나가기
   */
  const handleLeaveGroup = useCallback(async (group: LocationGroup) => {
    try {
      WebCompatibleAlert.alert(
        t('nearbygroups:alerts.leave.title'),
        t('nearbygroups:alerts.leave.message', { name: group.name }),
        [
          {
            text: t('common:cancel'),
            style: 'cancel',
          },
          {
            text: t('nearbygroups:alerts.leave.confirm'),
            style: 'destructive',
            onPress: async () => {
              try {
                // API 호출
                await apiClient.delete(`/location-groups/${group.id}/leave`);
                
                // 상태 업데이트
                setNearbyGroups(prev => 
                  prev.map(g => 
                    g.id === group.id 
                      ? { ...g, isJoined: false, memberCount: Math.max(0, g.memberCount - 1) }
                      : g
                  )
                );
                
                WebCompatibleAlert.alert(
                  t('nearbygroups:alerts.leave.successTitle'),
                  t('nearbygroups:alerts.leave.successMessage')
                );
              } catch (error) {
                WebCompatibleAlert.alert(
                  t('common:error'),
                  t('nearbygroups:alerts.leave.error')
                );
              }
            },
          },
        ]
      );
    } catch (error) {
      console.error('Leave group error:', error);
    }
  }, [t]);

  /**
   * 그룹 생성
   */
  const createLocationGroup = useCallback(async (
    formData: NewGroupFormData,
    location: LocationData
  ): Promise<boolean> => {
    try {
      setIsLoading(true);
      
      const response = await apiClient.post('/location-groups', {
        name: formData.name,
        description: formData.description,
        latitude: location.latitude,
        longitude: location.longitude,
        radius: parseFloat(formData.radius),
        duration: parseInt(formData.duration, 10),
      });

      if (response.success && response.data) {
        const newGroup: LocationGroup = {
          ...response.data,
          distance: 0,
          isJoined: true,
        };
        
        setNearbyGroups(prev => [newGroup, ...prev]);
        
        WebCompatibleAlert.alert(
          t('nearbygroups:alerts.create.successTitle'),
          t('nearbygroups:alerts.create.successMessage')
        );
        
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Create group error:', error);
      WebCompatibleAlert.alert(
        t('common:error'),
        t('nearbygroups:alerts.create.error')
      );
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [t]);

  /**
   * 그룹 삭제
   */
  const deleteLocationGroup = useCallback(async (groupId: string): Promise<boolean> => {
    try {
      const response = await apiClient.delete(`/location-groups/${groupId}`);
      
      if (response.success) {
        setNearbyGroups(prev => prev.filter(g => g.id !== groupId));
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Delete group error:', error);
      return false;
    }
  }, []);

  /**
   * 새로고침
   */
  const handleRefresh = useCallback(() => {
    loadNearbyGroups(true);
  }, [loadNearbyGroups]);

  // 위치나 반경이 변경되면 그룹 로드
  useEffect(() => {
    if (currentLocation) {
      loadNearbyGroups();
    }
  }, [currentLocation, selectedRadius, loadNearbyGroups]);

  return {
    nearbyGroups,
    isLoading,
    refreshing,
    serverConnectionError,
    loadNearbyGroups,
    handleJoinGroup,
    handleLeaveGroup,
    createLocationGroup,
    deleteLocationGroup,
    handleRefresh,
  };
};