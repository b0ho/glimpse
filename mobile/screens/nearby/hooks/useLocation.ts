import { useState, useCallback } from 'react';
import * as Location from 'expo-location';
import { Alert } from 'react-native';

export interface LocationData {
  latitude: number;
  longitude: number;
  address?: string;
}

export const useLocation = () => {
  const [currentLocation, setCurrentLocation] = useState<LocationData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [locationPermissionGranted, setLocationPermissionGranted] = useState(false);

  const requestLocationPermission = useCallback(async () => {
    try {
      setIsLoading(true);
      
      let { status } = await Location.getForegroundPermissionsAsync();
      
      if (status !== 'granted') {
        const result = await Location.requestForegroundPermissionsAsync();
        status = result.status;
        
        if (status !== 'granted') {
          Alert.alert(
            '위치 권한 필요',
            '근처 사용자를 찾기 위해 위치 권한이 필요합니다.\n설정에서 위치 권한을 허용해주세요.',
            [{ text: '나중에', style: 'cancel' }]
          );
          setIsLoading(false);
          return false;
        }
      }

      setLocationPermissionGranted(true);
      await getCurrentLocation();
      return true;
    } catch (error) {
      console.error('Location permission error:', error);
      Alert.alert('오류', '위치 권한 요청에 실패했습니다.');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const getCurrentLocation = useCallback(async () => {
    try {
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      const locationData: LocationData = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      };

      try {
        const addresses = await Location.reverseGeocodeAsync({
          latitude: locationData.latitude,
          longitude: locationData.longitude,
        });

        if (addresses && addresses.length > 0) {
          const address = addresses[0];
          locationData.address = `${address.district || address.city || ''} ${address.street || ''}`
            .trim() || '위치 확인';
        }
      } catch (geocodeError) {
        console.warn('Reverse geocoding failed:', geocodeError);
        locationData.address = '위치 확인';
      }

      setCurrentLocation(locationData);
      return locationData;
    } catch (error) {
      console.error('Get location error:', error);
      Alert.alert('오류', '현재 위치를 가져올 수 없습니다.');
      return null;
    }
  }, []);

  const refreshLocation = useCallback(async () => {
    if (locationPermissionGranted) {
      setIsLoading(true);
      await getCurrentLocation();
      setIsLoading(false);
    } else {
      await requestLocationPermission();
    }
  }, [locationPermissionGranted, getCurrentLocation, requestLocationPermission]);

  return {
    currentLocation,
    isLoading,
    locationPermissionGranted,
    requestLocationPermission,
    refreshLocation,
  };
};