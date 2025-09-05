import { useState, useEffect, useCallback } from 'react';
import { Alert, Platform } from 'react-native';
import * as Location from 'expo-location';
import { LocationData } from '@/types/nearbyGroups';

/**
 * 위치 권한 및 현재 위치 관리 Hook
 */
export const useLocationPermission = (t: (key: string) => string) => {
  // 웹 환경에서는 초기값을 바로 설정
  const isWeb = Platform.OS === 'web';
  const [currentLocation, setCurrentLocation] = useState<LocationData | null>(
    isWeb && __DEV__ ? {
      latitude: 37.5665,
      longitude: 126.9780,
      address: '서울시 중구',
    } : null
  );
  const [locationPermissionGranted, setLocationPermissionGranted] = useState(isWeb && __DEV__);
  const [isLocationLoading, setIsLocationLoading] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);

  /**
   * 위치 권한 요청
   */
  const requestLocationPermission = useCallback(async () => {
    try {
      setIsLocationLoading(true);
      setLocationError(null);
      
      // 웹 환경에서는 더미 데이터 사용
      if (Platform.OS === 'web' && __DEV__) {
        console.log('[LocationPermission] 웹 환경 감지 - 더미 데이터 사용');
        setLocationPermissionGranted(true);
        const dummyLocation: LocationData = {
          latitude: 37.5665,
          longitude: 126.9780,
          address: '서울시 중구',
        };
        setCurrentLocation(dummyLocation);
        setIsLocationLoading(false);
        return true;
      }
      
      let { status } = await Location.getForegroundPermissionsAsync();
      
      if (status !== 'granted') {
        const result = await Location.requestForegroundPermissionsAsync();
        status = result.status;
        
        if (status !== 'granted') {
          Alert.alert(
            t('nearbygroups:alerts.permission.title'),
            t('nearbygroups:alerts.permission.message'),
            [
              {
                text: t('common:cancel'),
                style: 'cancel',
              },
              {
                text: t('nearbygroups:alerts.permission.openSettings'),
                onPress: () => {
                  // Open settings
                  if (Location.hasServicesEnabledAsync) {
                    Location.requestForegroundPermissionsAsync();
                  }
                },
              },
            ]
          );
          setLocationPermissionGranted(false);
          setLocationError(t('nearbygroups:errors.permissionDenied'));
          return false;
        }
      }
      
      setLocationPermissionGranted(true);
      await getCurrentLocation();
      return true;
    } catch (error) {
      console.error('Location permission error:', error);
      setLocationError(t('nearbygroups:errors.permissionError'));
      Alert.alert(
        t('common:error'),
        t('nearbygroups:alerts.permission.error')
      );
      return false;
    } finally {
      setIsLocationLoading(false);
    }
  }, [t]);

  /**
   * 현재 위치 가져오기
   */
  const getCurrentLocation = useCallback(async () => {
    try {
      setIsLocationLoading(true);
      setLocationError(null);
      
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      
      const locationData: LocationData = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      };
      
      // 주소 정보 가져오기 (옵션)
      try {
        const addresses = await Location.reverseGeocodeAsync({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        });
        
        if (addresses.length > 0) {
          const addr = addresses[0];
          locationData.address = `${addr.city || ''} ${addr.district || ''} ${addr.street || ''}`.trim();
        }
      } catch (err) {
        console.warn('Failed to get address:', err);
      }
      
      setCurrentLocation(locationData);
      return locationData;
    } catch (error) {
      console.error('Get location error:', error);
      setLocationError(t('nearbygroups:errors.locationFailed'));
      Alert.alert(
        t('common:error'),
        t('nearbygroups:alerts.location.error')
      );
      return null;
    } finally {
      setIsLocationLoading(false);
    }
  }, [t]);

  /**
   * 위치 새로고침
   */
  const refreshLocation = useCallback(async () => {
    if (locationPermissionGranted) {
      return await getCurrentLocation();
    } else {
      const granted = await requestLocationPermission();
      if (granted) {
        return await getCurrentLocation();
      }
    }
    return null;
  }, [locationPermissionGranted, getCurrentLocation, requestLocationPermission]);

  /**
   * 두 좌표 간 거리 계산 (meters)
   */
  const calculateDistance = useCallback((lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371e3; // Earth radius in meters
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  }, []);

  /**
   * 거리 포맷팅
   */
  const formatDistance = useCallback((meters: number): string => {
    if (meters < 1000) {
      return `${Math.round(meters)}m`;
    }
    return `${(meters / 1000).toFixed(1)}km`;
  }, []);

  // 초기 권한 요청 (한 번만 실행)
  useEffect(() => {
    // 웹 환경에서는 이미 권한이 설정되었으므로 재요청하지 않음
    if (Platform.OS === 'web' && locationPermissionGranted) {
      return;
    }
    
    // 권한이 없을 때만 요청
    if (!locationPermissionGranted) {
      requestLocationPermission();
    }
  }, []); // 의존성 배열 비움 - 초기 한 번만 실행

  return {
    currentLocation,
    locationPermissionGranted,
    isLocationLoading,
    locationError,
    requestLocationPermission,
    getCurrentLocation,
    refreshLocation,
    calculateDistance,
    formatDistance,
  };
};