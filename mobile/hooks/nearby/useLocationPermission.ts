/**
 * 위치 권한 관리 훅
 */
import { useState, useCallback, useEffect } from 'react';
import { Platform, Alert } from 'react-native';
import * as Location from 'expo-location';

export interface LocationData {
  latitude: number;
  longitude: number;
  address?: string;
}

export const useLocationPermission = () => {
  const [currentLocation, setCurrentLocation] = useState<LocationData | null>(null);
  const [locationPermissionGranted, setLocationPermissionGranted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const requestLocationPermission = useCallback(async () => {
    try {
      setIsLoading(true);
      
      // 웹 환경에서는 더미 데이터 사용
      if (Platform.OS === 'web') {
        console.log('[LocationPermission] 웹 환경 감지 - 더미 데이터 사용');
        setLocationPermissionGranted(true);
        setCurrentLocation({
          latitude: 37.5665,
          longitude: 126.9780,
          address: '서울시 중구'
        });
        return true;
      }
      
      let { status } = await Location.getForegroundPermissionsAsync();
      
      if (status !== 'granted') {
        const { status: newStatus } = await Location.requestForegroundPermissionsAsync();
        status = newStatus;
      }

      if (status !== 'granted') {
        Alert.alert(
          '위치 권한 필요',
          '주변 사용자를 찾기 위해 위치 권한이 필요합니다.',
          [{ text: '확인' }]
        );
        return false;
      }

      setLocationPermissionGranted(true);
      
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      
      const [addressResult] = await Location.reverseGeocodeAsync({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });

      const address = addressResult
        ? `${addressResult.city || ''} ${addressResult.district || ''}`
        : undefined;

      setCurrentLocation({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        address,
      });
      
      return true;
    } catch (error) {
      console.error('위치 권한 요청 실패:', error);
      Alert.alert('오류', '위치 정보를 가져올 수 없습니다.');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const updateLocation = useCallback(async () => {
    if (!locationPermissionGranted) {
      const granted = await requestLocationPermission();
      return granted;
    }
    
    try {
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      
      setCurrentLocation({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        address: currentLocation?.address,
      });
      
      return true;
    } catch (error) {
      console.error('위치 업데이트 실패:', error);
      return false;
    }
  }, [locationPermissionGranted, currentLocation?.address, requestLocationPermission]);

  useEffect(() => {
    requestLocationPermission();
  }, []);

  return {
    currentLocation,
    locationPermissionGranted,
    isLoading,
    requestLocationPermission,
    updateLocation,
  };
};