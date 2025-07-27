import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';
import { API_BASE_URL } from './api/config';
// import { authService } from './auth/auth-service'; // TODO: Implement token handling

const LOCATION_TASK_NAME = 'background-location-task';
const LOCATION_STORAGE_KEY = 'user_location';

interface LocationData {
  latitude: number;
  longitude: number;
  accuracy: number | null;
  timestamp: number;
}

interface LocationGroup {
  id: string;
  name: string;
  description?: string;
  type: string;
  distance: number;
  address: string;
  _count: {
    members: number;
  };
  creator: {
    id: string;
    nickname: string;
  };
}

class LocationService {
  private locationSubscription: Location.LocationSubscription | null = null;

  // 위치 권한 요청
  async requestLocationPermission(): Promise<boolean> {
    try {
      const { status: foregroundStatus } = await Location.requestForegroundPermissionsAsync();
      
      if (foregroundStatus !== 'granted') {
        Alert.alert(
          '위치 권한 필요',
          '주변 그룹을 찾고 위치 기반 기능을 사용하려면 위치 권한이 필요합니다.',
          [{ text: '확인' }]
        );
        return false;
      }

      // 백그라운드 권한도 요청 (선택적)
      const { status: backgroundStatus } = await Location.requestBackgroundPermissionsAsync();
      if (backgroundStatus === 'granted') {
        console.log('백그라운드 위치 권한 승인됨');
      }

      return true;
    } catch (error) {
      console.error('위치 권한 요청 오류:', error);
      return false;
    }
  }

  // 현재 위치 가져오기
  async getCurrentLocation(): Promise<LocationData | null> {
    try {
      const hasPermission = await this.requestLocationPermission();
      if (!hasPermission) return null;

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      const locationData: LocationData = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        accuracy: location.coords.accuracy,
        timestamp: location.timestamp,
      };

      // 위치 저장
      await this.saveLocation(locationData);

      return locationData;
    } catch (error) {
      console.error('현재 위치 가져오기 오류:', error);
      return null;
    }
  }

  // 위치 저장
  private async saveLocation(location: LocationData): Promise<void> {
    try {
      await AsyncStorage.setItem(LOCATION_STORAGE_KEY, JSON.stringify(location));
    } catch (error) {
      console.error('위치 저장 오류:', error);
    }
  }

  // 저장된 위치 가져오기
  async getSavedLocation(): Promise<LocationData | null> {
    try {
      const savedLocation = await AsyncStorage.getItem(LOCATION_STORAGE_KEY);
      return savedLocation ? JSON.parse(savedLocation) : null;
    } catch (error) {
      console.error('저장된 위치 가져오기 오류:', error);
      return null;
    }
  }

  // 실시간 위치 추적 시작
  async startLocationTracking(callback: (location: LocationData) => void): Promise<void> {
    try {
      const hasPermission = await this.requestLocationPermission();
      if (!hasPermission) return;

      this.locationSubscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: 10000, // 10초마다
          distanceInterval: 10, // 10미터마다
        },
        (location) => {
          const locationData: LocationData = {
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
            accuracy: location.coords.accuracy,
            timestamp: location.timestamp,
          };
          
          this.saveLocation(locationData);
          callback(locationData);
        }
      );
    } catch (error) {
      console.error('위치 추적 시작 오류:', error);
    }
  }

  // 위치 추적 중지
  stopLocationTracking(): void {
    if (this.locationSubscription) {
      this.locationSubscription.remove();
      this.locationSubscription = null;
    }
  }

  // 백그라운드 위치 추적 설정
  async setupBackgroundLocationTracking(): Promise<void> {
    try {
      const { status } = await Location.requestBackgroundPermissionsAsync();
      if (status !== 'granted') {
        console.log('백그라운드 위치 권한이 거부되었습니다.');
        return;
      }

      await Location.startLocationUpdatesAsync(LOCATION_TASK_NAME, {
        accuracy: Location.Accuracy.Balanced,
        timeInterval: 15 * 60 * 1000, // 15분마다
        distanceInterval: 100, // 100미터마다
        showsBackgroundLocationIndicator: true,
        foregroundService: {
          notificationTitle: 'Glimpse',
          notificationBody: '주변 그룹을 찾고 있습니다',
        },
      });
    } catch (error) {
      console.error('백그라운드 위치 추적 설정 오류:', error);
    }
  }

  // 백그라운드 위치 추적 중지
  async stopBackgroundLocationTracking(): Promise<void> {
    try {
      await Location.stopLocationUpdatesAsync(LOCATION_TASK_NAME);
    } catch (error) {
      console.error('백그라운드 위치 추적 중지 오류:', error);
    }
  }

  // 주변 그룹 검색
  async getNearbyGroups(radius: number = 5): Promise<LocationGroup[]> {
    try {
      const location = await this.getCurrentLocation();
      if (!location) {
        throw new Error('위치를 가져올 수 없습니다.');
      }

      // TODO: Get token from Clerk
      const token = '';
      if (!token) {
        throw new Error('인증 토큰이 없습니다.');
      }

      const response = await fetch(
        `${API_BASE_URL}/location/groups/nearby?latitude=${location.latitude}&longitude=${location.longitude}&radius=${radius}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error('주변 그룹 검색 실패');
      }

      const data = await response.json();
      return data.data;
    } catch (error) {
      console.error('주변 그룹 검색 오류:', error);
      throw error;
    }
  }

  // 위치 기반 그룹 생성
  async createLocationGroup(data: {
    name: string;
    description?: string;
    radius: number;
    maxMembers?: number;
  }): Promise<any> {
    try {
      const location = await this.getCurrentLocation();
      if (!location) {
        throw new Error('위치를 가져올 수 없습니다.');
      }

      // TODO: Get token from Clerk
      const token = '';
      if (!token) {
        throw new Error('인증 토큰이 없습니다.');
      }

      const response = await fetch(`${API_BASE_URL}/location/groups`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...data,
          latitude: location.latitude,
          longitude: location.longitude,
        }),
      });

      if (!response.ok) {
        throw new Error('그룹 생성 실패');
      }

      const result = await response.json();
      return result.data;
    } catch (error) {
      console.error('위치 기반 그룹 생성 오류:', error);
      throw error;
    }
  }

  // GPS로 그룹 참여
  async joinLocationGroup(groupId: string): Promise<any> {
    try {
      const location = await this.getCurrentLocation();
      if (!location) {
        throw new Error('위치를 가져올 수 없습니다.');
      }

      // TODO: Get token from Clerk
      const token = '';
      if (!token) {
        throw new Error('인증 토큰이 없습니다.');
      }

      const response = await fetch(`${API_BASE_URL}/location/groups/${groupId}/join`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          latitude: location.latitude,
          longitude: location.longitude,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || '그룹 참여 실패');
      }

      const result = await response.json();
      return result.data;
    } catch (error) {
      console.error('그룹 참여 오류:', error);
      throw error;
    }
  }

  // QR 코드로 그룹 참여
  async joinGroupByQRCode(qrData: string): Promise<any> {
    try {
      // TODO: Get token from Clerk
      const token = '';
      if (!token) {
        throw new Error('인증 토큰이 없습니다.');
      }

      const response = await fetch(`${API_BASE_URL}/location/groups/join-qr`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ qrData }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'QR 코드로 그룹 참여 실패');
      }

      const result = await response.json();
      return result.data;
    } catch (error) {
      console.error('QR 코드 그룹 참여 오류:', error);
      throw error;
    }
  }

  // 위치 히스토리 가져오기
  async getLocationHistory(): Promise<any[]> {
    try {
      // TODO: Get token from Clerk
      const token = '';
      if (!token) {
        throw new Error('인증 토큰이 없습니다.');
      }

      const response = await fetch(`${API_BASE_URL}/location/history`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('위치 히스토리 가져오기 실패');
      }

      const data = await response.json();
      return data.data;
    } catch (error) {
      console.error('위치 히스토리 가져오기 오류:', error);
      throw error;
    }
  }

  // 좌표를 주소로 변환
  async reverseGeocode(latitude: number, longitude: number): Promise<string> {
    try {
      const response = await fetch(
        `${API_BASE_URL}/location/geocode/reverse?latitude=${latitude}&longitude=${longitude}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error('주소 변환 실패');
      }

      const data = await response.json();
      return data.data.address;
    } catch (error) {
      console.error('주소 변환 오류:', error);
      // Expo의 역지오코딩 사용 (fallback)
      try {
        const [address] = await Location.reverseGeocodeAsync({ latitude, longitude });
        return `${address.district || ''} ${address.street || ''} ${address.name || ''}`.trim();
      } catch (fallbackError) {
        console.error('Expo 역지오코딩 오류:', fallbackError);
        return '주소를 가져올 수 없습니다';
      }
    }
  }
}

// 백그라운드 작업 정의
TaskManager.defineTask(LOCATION_TASK_NAME, async ({ data, error }) => {
  if (error) {
    console.error('백그라운드 위치 작업 오류:', error);
    return;
  }

  if (data) {
    const { locations } = data as any;
    const location = locations[0];
    
    if (location) {
      const locationData: LocationData = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        accuracy: location.coords.accuracy,
        timestamp: location.timestamp,
      };
      
      // 위치 저장
      await AsyncStorage.setItem(LOCATION_STORAGE_KEY, JSON.stringify(locationData));
      
      // 필요한 경우 서버에 위치 업데이트 전송
      // await sendLocationToServer(locationData);
    }
  }
});

export const locationService = new LocationService();