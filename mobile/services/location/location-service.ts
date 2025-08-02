import * as Location from 'expo-location';
import { Alert } from 'react-native';

/**
 * 위치 데이터 인터페이스
 * @interface LocationData
 * @description 사용자의 현재 위치 정보
 */
export interface LocationData {
  /** 위도 */
  latitude: number;
  /** 경도 */
  longitude: number;
  /** 정확도 (미터) */
  accuracy?: number;
  /** 주소 */
  address?: string;
  /** 타임스탬프 */
  timestamp: number;
}

/**
 * 근처 장소 인터페이스
 * @interface NearbyPlace
 * @description 사용자 주변의 장소 정보
 */
export interface NearbyPlace {
  /** 장소 ID */
  id: string;
  /** 장소명 */
  name: string;
  /** 장소 카테고리 */
  category: 'cafe' | 'restaurant' | 'university' | 'company' | 'gym' | 'bar' | 'other';
  /** 거리 (미터) */
  distance: number;
  /** 위도 */
  latitude: number;
  /** 경도 */
  longitude: number;
  /** 주소 */
  address: string;
}

/**
 * 위치 서비스 클래스
 * @class LocationService
 * @description GPS 기반 위치 추적, 근처 장소 검색, 거리 계산 기능 제공
 */
class LocationService {
  /** 현재 위치 캐시 */
  private currentLocation: LocationData | null = null;
  /** 위치 감시 구독 ID */
  private watcherId: Location.LocationSubscription | null = null;

  /**
   * 위치 권한 요청
   * @async
   * @returns {Promise<boolean>} 권한 허용 여부
   * @description 앱에서 위치 서비스를 사용하기 위한 권한 요청
   */
  async requestLocationPermissions(): Promise<boolean> {
    try {
      // 포그라운드 위치 권한 확인
      let { status } = await Location.getForegroundPermissionsAsync();
      
      if (status !== 'granted') {
        // 권한 요청
        const result = await Location.requestForegroundPermissionsAsync();
        status = result.status;
        
        if (status !== 'granted') {
          Alert.alert(
            '위치 권한 필요',
            '근처 그룹과 사용자를 찾기 위해 위치 권한이 필요합니다.\n설정에서 위치 권한을 허용해주세요.',
            [
              { text: '나중에', style: 'cancel' },
              { 
                text: '설정으로 이동', 
                onPress: () => Location.enableNetworkProviderAsync() 
              },
            ]
          );
          return false;
        }
      }

      // 위치 서비스 활성화 확인
      const enabled = await Location.hasServicesEnabledAsync();
      if (!enabled) {
        Alert.alert(
          '위치 서비스 비활성화',
          '기기의 위치 서비스가 비활성화되어 있습니다.\n설정에서 위치 서비스를 활성화해주세요.',
          [
            { text: '확인' }
          ]
        );
        return false;
      }

      return true;
    } catch (error) {
      console.error('Location permission error:', error);
      return false;
    }
  }

  /**
   * 현재 위치 가져오기
   * @async
   * @returns {Promise<LocationData | null>} 현재 위치 정보 또는 null
   * @description GPS를 사용하여 현재 위치를 가져오고 주소 역지오코딩 수행
   */
  async getCurrentLocation(): Promise<LocationData | null> {
    try {
      const hasPermission = await this.requestLocationPermissions();
      if (!hasPermission) {
        return null;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      const locationData: LocationData = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        accuracy: location.coords.accuracy || undefined,
        timestamp: location.timestamp,
      };

      // 주소 정보 가져오기 (선택적)
      try {
        const addresses = await Location.reverseGeocodeAsync({
          latitude: locationData.latitude,
          longitude: locationData.longitude,
        });

        if (addresses.length > 0) {
          const address = addresses[0];
          locationData.address = [
            address.streetNumber,
            address.street,
            address.district,
            address.city,
          ].filter(Boolean).join(' ');
        }
      } catch (geocodeError) {
        console.warn('Geocoding failed:', geocodeError);
      }

      this.currentLocation = locationData;
      return locationData;
    } catch (error) {
      console.error('Get current location error:', error);
      Alert.alert('위치 오류', '현재 위치를 가져올 수 없습니다.');
      return null;
    }
  }

  /**
   * 위치 변화 감지 시작
   * @async
   * @param {Function} callback - 위치 변경 시 호출될 콜백
   * @param {Object} [options] - 감시 옵션
   * @param {Location.Accuracy} [options.accuracy] - 위치 정확도
   * @param {number} [options.distanceInterval] - 업데이트 거리 간격 (미터)
   * @param {number} [options.timeInterval] - 업데이트 시간 간격 (밀리초)
   * @returns {Promise<boolean>} 감시 시작 성공 여부
   * @description 위치 변화를 실시간으로 감지하고 콜백 호출
   */
  async startLocationWatching(
    callback: (location: LocationData) => void,
    options?: {
      accuracy?: Location.Accuracy;
      distanceInterval?: number;
      timeInterval?: number;
    }
  ): Promise<boolean> {
    try {
      const hasPermission = await this.requestLocationPermissions();
      if (!hasPermission) {
        return false;
      }

      // 기존 감시 중지
      if (this.watcherId) {
        this.stopLocationWatching();
      }

      this.watcherId = await Location.watchPositionAsync(
        {
          accuracy: options?.accuracy || Location.Accuracy.Balanced,
          distanceInterval: options?.distanceInterval || 100, // 100m마다
          timeInterval: options?.timeInterval || 30000, // 30초마다
        },
        (location: Location.LocationObject) => {
          const locationData: LocationData = {
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
            accuracy: location.coords.accuracy || undefined,
            timestamp: location.timestamp,
          };

          this.currentLocation = locationData;
          callback(locationData);
        }
      );

      return true;
    } catch (error) {
      console.error('Start location watching error:', error);
      return false;
    }
  }

  /**
   * 위치 변화 감지 중지
   * @description 현재 진행 중인 위치 감시를 중지
   */
  stopLocationWatching(): void {
    if (this.watcherId) {
      this.watcherId.remove();
      this.watcherId = null;
    }
  }

  /**
   * 두 위치 간 거리 계산 (미터)
   * @param {number} lat1 - 첫 번째 지점의 위도
   * @param {number} lon1 - 첫 번째 지점의 경도
   * @param {number} lat2 - 두 번째 지점의 위도
   * @param {number} lon2 - 두 번째 지점의 경도
   * @returns {number} 두 지점 간 거리 (미터)
   * @description Haversine 공식을 사용하여 두 GPS 좌표 간 거리 계산
   */
  calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number {
    const R = 6371e3; // 지구 반지름 (미터)
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  }

  /**
   * 근처 장소 찾기
   * @async
   * @param {number} latitude - 검색 중심 위도
   * @param {number} longitude - 검색 중심 경도
   * @param {number} [radius=1000] - 검색 반경 (미터, 기본 1km)
   * @returns {Promise<NearbyPlace[]>} 근처 장소 목록
   * @description 주어진 좌표 주변의 장소를 검색 (현재는 더미 데이터)
   * @todo 실제 구현에서는 Google Places API나 다른 장소 API 사용
   */
  async findNearbyPlaces(
    latitude: number,
    longitude: number,
    radius: number = 1000 // 1km 반경
  ): Promise<NearbyPlace[]> {
    // TODO: 실제 구현에서는 Google Places API나 다른 장소 API 사용
    // 현재는 더미 데이터 반환
    const dummyPlaces: NearbyPlace[] = [
      {
        id: 'place_1',
        name: '스타벅스 강남점',
        category: 'cafe',
        distance: 150,
        latitude: latitude + 0.001,
        longitude: longitude + 0.001,
        address: '서울시 강남구 테헤란로 123',
      },
      {
        id: 'place_2',
        name: '연세대학교',
        category: 'university',
        distance: 300,
        latitude: latitude + 0.002,
        longitude: longitude - 0.001,
        address: '서울시 서대문구 연세로 50',
      },
      {
        id: 'place_3',
        name: '네이버 그린팩토리',
        category: 'company',
        distance: 500,
        latitude: latitude - 0.002,
        longitude: longitude + 0.002,
        address: '경기도 성남시 분당구 불정로 6',
      },
      {
        id: 'place_4',
        name: '헬스클럽 피트니스',
        category: 'gym',
        distance: 200,
        latitude: latitude + 0.0015,
        longitude: longitude - 0.0015,
        address: '서울시 강남구 역삼로 456',
      },
      {
        id: 'place_5',
        name: '이태원 클럽',
        category: 'bar',
        distance: 800,
        latitude: latitude - 0.003,
        longitude: longitude - 0.002,
        address: '서울시 용산구 이태원로 789',
      },
    ];

    // 반경 내 장소만 필터링하고 거리순 정렬
    return dummyPlaces
      .filter(place => place.distance <= radius)
      .sort((a, b) => a.distance - b.distance);
  }

  /**
   * 현재 저장된 위치 반환
   * @returns {LocationData | null} 캐시된 위치 정보
   * @description 마지막으로 업데이트된 위치 정보를 반환
   */
  getCachedLocation(): LocationData | null {
    return this.currentLocation;
  }

  /**
   * 위치가 특정 반경 내에 있는지 확인
   * @param {number} userLat - 사용자 위도
   * @param {number} userLon - 사용자 경도
   * @param {number} targetLat - 대상 위도
   * @param {number} targetLon - 대상 경도
   * @param {number} radiusMeters - 반경 (미터)
   * @returns {boolean} 반경 내 위치 여부
   * @description 사용자 위치가 대상 지점으로부터 지정된 반경 내에 있는지 확인
   */
  isWithinRadius(
    userLat: number,
    userLon: number,
    targetLat: number,
    targetLon: number,
    radiusMeters: number
  ): boolean {
    const distance = this.calculateDistance(userLat, userLon, targetLat, targetLon);
    return distance <= radiusMeters;
  }

  /**
   * 위치 기반 그룹 추천
   * @async
   * @param {LocationData} userLocation - 사용자 위치
   * @param {number} [maxDistance=2000] - 최대 거리 (미터, 기본 2km)
   * @returns {Promise<{ place: NearbyPlace; suggestedName: string }[]>} 추천 그룹 목록
   * @description 사용자 위치 기반으로 근처 장소와 그룹명을 추천
   */
  async getLocationBasedGroupSuggestions(
    userLocation: LocationData,
    maxDistance: number = 2000 // 2km
  ): Promise<{ place: NearbyPlace; suggestedName: string }[]> {
    const nearbyPlaces = await this.findNearbyPlaces(
      userLocation.latitude,
      userLocation.longitude,
      maxDistance
    );

    return nearbyPlaces.map(place => ({
      place,
      suggestedName: this.generateGroupName(place),
    }));
  }

  /**
   * 장소 기반 그룹명 생성
   * @private
   * @param {NearbyPlace} place - 장소 정보
   * @returns {string} 생성된 그룹명
   * @description 장소 카테고리와 이름을 기반으로 그룹명 생성
   */
  private generateGroupName(place: NearbyPlace): string {
    const categoryNames = {
      cafe: '카페',
      restaurant: '맛집',
      university: '대학',
      company: '회사',
      gym: '운동',
      bar: '나이트',
      other: '모임',
    };

    const categoryName = categoryNames[place.category] || '모임';
    return `${place.name} ${categoryName} 친구들`;
  }

  /**
   * 서비스 정리
   * @description 모든 위치 감시를 중지하고 리소스 정리
   */
  cleanup(): void {
    this.stopLocationWatching();
    this.currentLocation = null;
  }
}

/**
 * 위치 서비스 싱글톤 인스턴스
 * @constant {LocationService}
 * @description 앱 전체에서 사용할 위치 서비스 인스턴스
 */
export const locationService = new LocationService();