/**
 * 지도 화면 (NativeWind v4 버전)
 *
 * @screen
 * @description 주변 그룹, 사용자, 장소를 지도에 마커로 표시하는 화면
 */
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  SafeAreaView,
  TouchableOpacity,
  Alert,
  Dimensions,
  Modal,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Ionicons';
import * as Location from 'expo-location';
import { KakaoMapView } from '@/components/KakaoMapView';
import { useGroupStore } from '@/store/slices/groupSlice';
import { useAuthStore } from '@/store/slices/authSlice';
import { useAndroidSafeTranslation } from '@/hooks/useAndroidSafeTranslation';
import { Group, GroupType, User } from '@/types';
import { cn } from '@/lib/utils';
import { useTheme } from '@/hooks/useTheme';

/**
 * 위치 데이터 인터페이스
 *
 * @interface LocationData
 */
interface LocationData {
  latitude: number;
  longitude: number;
  address?: string;
}

/**
 * 지도 마커 인터페이스
 *
 * @interface MapMarker
 */
interface MapMarker {
  id: string;
  latitude: number;
  longitude: number;
  title: string;
  description?: string;
  type: 'user' | 'group' | 'place';
  data?: Group | User | any;
}

/**
 * 선택된 마커 데이터 인터페이스
 *
 * @interface SelectedMarkerData
 */
interface SelectedMarkerData {
  marker: MapMarker;
  position: { x: number; y: number };
}

/**
 * 지도 화면 컴포넌트
 *
 * @component
 * @returns {JSX.Element} 지도 화면 UI
 *
 * @description
 * Kakao Map API를 사용하여 주변의 그룹, 사용자, 장소를 지도에 표시합니다.
 * - 현재 위치 기반 지도 표시
 * - 그룹/사용자/장소 타입 전환
 * - 마커 클릭으로 상세 정보 표시
 * - 그룹 참여, 좋아요 보내기, 그룹 만들기 액션
 *
 * @navigation
 * - From: HomeScreen, NearbyGroupsScreen
 * - To: CreateGroup (장소 기반 그룹 생성)
 *
 * @example
 * ```tsx
 * navigation.navigate('Map');
 * ```
 *
 * @category Screen
 * @subcategory Nearby
 */
export const MapScreen = React.memo(() => {
  const navigation = useNavigation();
  const { t } = useAndroidSafeTranslation('map');
  const { user } = useAuthStore();
  const { groups } = useGroupStore();
  const { colors } = useTheme();
  
  const [currentLocation, setCurrentLocation] = useState<LocationData>({
    latitude: 37.5665, // 서울 기본 좌표
    longitude: 126.9780,
  });
  const [mapMarkers, setMapMarkers] = useState<MapMarker[]>([]);
  const [selectedMarker, setSelectedMarker] = useState<SelectedMarkerData | null>(null);
  const [mapType, setMapType] = useState<'groups' | 'users' | 'places'>('groups');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    initializeLocation();
  }, []);

  useEffect(() => {
    updateMapMarkers();
  }, [mapType, groups, currentLocation]);

  const initializeLocation = async () => {
    try {
      // 위치 권한 확인
      const { status } = await Location.getForegroundPermissionsAsync();
      
      if (status === 'granted') {
        const location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High,
        });

        setCurrentLocation({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        });
      }
    } catch (error) {
      console.error('Location initialization error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const updateMapMarkers = useCallback(() => {
    const markers: MapMarker[] = [];

    switch (mapType) {
      case 'groups':
        // 위치 정보가 있는 그룹들만 표시
        groups
          .filter(group => group.location && group.type === GroupType.LOCATION)
          .forEach(group => {
            if (group.location) {
              markers.push({
                id: `group-${group.id}`,
                latitude: group.location.latitude,
                longitude: group.location.longitude,
                title: group.name,
                description: `멤버 ${group.memberCount}명 • ${group.location.address}`,
                type: 'group',
                data: group,
              });
            }
          });
        break;

      case 'users':
        // 더미 근처 사용자 데이터
        const nearbyUsers = [
          {
            id: 'user1',
            nickname: '카페러버',
            latitude: currentLocation.latitude + 0.001,
            longitude: currentLocation.longitude + 0.001,
            distance: 150,
          },
          {
            id: 'user2',
            nickname: '헬스매니아',
            latitude: currentLocation.latitude - 0.002,
            longitude: currentLocation.longitude + 0.002,
            distance: 300,
          },
        ];

        nearbyUsers.forEach(userData => {
          markers.push({
            id: `user-${userData.id}`,
            latitude: userData.latitude,
            longitude: userData.longitude,
            title: userData.nickname,
            description: `${userData.distance}m 거리`,
            type: 'user',
            data: userData,
          });
        });
        break;

      case 'places':
        // 더미 장소 데이터
        const nearbyPlaces = [
          {
            id: 'place1',
            name: '스타벅스 강남점',
            category: '카페',
            latitude: currentLocation.latitude + 0.001,
            longitude: currentLocation.longitude - 0.001,
          },
          {
            id: 'place2',
            name: '연세대학교',
            category: '대학',
            latitude: currentLocation.latitude + 0.003,
            longitude: currentLocation.longitude + 0.002,
          },
        ];

        nearbyPlaces.forEach(place => {
          markers.push({
            id: `place-${place.id}`,
            latitude: place.latitude,
            longitude: place.longitude,
            title: place.name,
            description: place.category,
            type: 'place',
            data: place,
          });
        });
        break;
    }

    setMapMarkers(markers);
  }, [mapType, groups, currentLocation]);

  const handleMarkerPress = (marker: MapMarker) => {
    // 마커 상세 정보 모달 표시
    setSelectedMarker({
      marker,
      position: { x: 0, y: 0 }, // 실제로는 터치 위치 계산 필요
    });
  };

  const handleMapPress = (location: LocationData) => {
    // 지도 터치 시 선택 해제
    setSelectedMarker(null);
  };

  const handleMarkerAction = (marker: MapMarker) => {
    switch (marker.type) {
      case 'group':
        // 그룹 참여 또는 상세 보기
        Alert.alert(
          '그룹 참여',
          `${marker.title} 그룹에 참여하시겠습니까?`,
          [
            { text: '취소', style: 'cancel' },
            { text: '참여하기', onPress: () => joinGroup(marker.data as Group) },
          ]
        );
        break;

      case 'user':
        // 사용자에게 좋아요 보내기
        Alert.alert(
          '익명 좋아요',
          `${marker.title}님에게 익명으로 좋아요를 보내시겠습니까?`,
          [
            { text: '취소', style: 'cancel' },
            { text: '좋아요 보내기', onPress: () => sendLikeToUser(marker.data) },
          ]
        );
        break;

      case 'place':
        // 해당 장소에서 그룹 만들기
        Alert.alert(
          '그룹 만들기',
          `${marker.title}에서 새로운 모임을 만드시겠습니까?`,
          [
            { text: '취소', style: 'cancel' },
            { text: '그룹 만들기', onPress: () => createGroupAtPlace(marker.data) },
          ]
        );
        break;
    }
    
    setSelectedMarker(null);
  };

  const joinGroup = (group: Group) => {
    // 그룹 참여 로직
    console.log('Joining group:', group);
    Alert.alert(t('common:alerts.success.title'), t('map:alerts.groupJoined', { groupName: group.name }));
  };

  const sendLikeToUser = (userData: any) => {
    // 좋아요 전송 로직
    console.log('Sending like to user:', userData);
    Alert.alert(t('common:alerts.success.title'), t('map:alerts.likeSent', { nickname: userData.nickname }));
  };

  const createGroupAtPlace = (placeData: any) => {
    // 장소 기반 그룹 생성
    (navigation as any).navigate('CreateGroup', {
      type: GroupType.LOCATION,
      location: {
        latitude: placeData.latitude,
        longitude: placeData.longitude,
        address: placeData.name,
      },
      suggestedName: `${placeData.name} 모임`,
    });
  };

  const renderMapTypeSelector = () => (
    <View className={cn(
      "flex-row px-4 py-2 border-b",
      "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700"
    )}>
      {[
        { key: 'groups', label: '그룹', icon: 'people' },
        { key: 'users', label: '사용자', icon: 'person' },
        { key: 'places', label: '장소', icon: 'location' },
      ].map(({ key, label, icon }) => (
        <TouchableOpacity
          key={key}
          className={cn(
            "flex-row items-center px-4 py-2 mr-2 rounded-full",
            mapType === key
              ? "bg-blue-500"
              : "bg-gray-100 dark:bg-gray-700"
          )}
          onPress={() => setMapType(key as any)}
        >
          <Icon
            name={icon}
            size={16}
            color={mapType === key ? 'white' : colors.TEXT.SECONDARY}
          />
          <Text
            className={cn(
              "text-sm font-medium ml-1",
              mapType === key
                ? "text-white font-semibold"
                : "text-gray-600 dark:text-gray-300"
            )}
          >
            {label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderMarkerDetail = () => {
    if (!selectedMarker) return null;

    const { marker } = selectedMarker;

    return (
      <Modal
        visible={true}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedMarker(null)}
      >
        <TouchableOpacity
          className="flex-1 bg-black/50 justify-center items-center px-6"
          activeOpacity={1}
          onPress={() => setSelectedMarker(null)}
        >
          <View className={cn(
            "w-full max-w-80 rounded-2xl p-6",
            "bg-white dark:bg-gray-800"
          )}>
            <View className="flex-row items-start mb-4">
              <View 
                className={cn(
                  "w-10 h-10 rounded-full items-center justify-center mr-4",
                  marker.type === 'group' 
                    ? 'bg-blue-500'
                    : marker.type === 'user' 
                    ? 'bg-red-500'
                    : 'bg-green-500'
                )}
              >
                <Icon
                  name={
                    marker.type === 'group' ? 'people' :
                    marker.type === 'user' ? 'person' :
                    'location'
                  }
                  size={20}
                  color="white"
                />
              </View>
              <View className="flex-1">
                <Text className={cn(
                  "text-lg font-semibold mb-1",
                  "text-gray-900 dark:text-white"
                )}>
                  {marker.title}
                </Text>
                <Text className={cn(
                  "text-sm leading-5",
                  "text-gray-600 dark:text-gray-300"
                )}>
                  {marker.description}
                </Text>
              </View>
              <TouchableOpacity
                className="p-2"
                onPress={() => setSelectedMarker(null)}
              >
                <Icon name="close" size={20} color={"#6B7280"} />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              className="bg-blue-500 py-4 rounded-xl items-center"
              onPress={() => handleMarkerAction(marker)}
            >
              <Text className="text-white text-base font-semibold">
                {marker.type === 'group' ? '그룹 참여' :
                 marker.type === 'user' ? '좋아요 보내기' :
                 '그룹 만들기'}
              </Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    );
  };

  if (isLoading) {
    return (
      <SafeAreaView className={cn(
        "flex-1",
        "bg-white dark:bg-gray-900"
      )}>
        <View className={cn(
          "flex-row items-center justify-between px-4 py-2 border-b",
          "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700"
        )}>
          <TouchableOpacity
            className="p-2"
            onPress={() => navigation.goBack()}
          >
            <Icon name="arrow-back" size={24} color={colors.TEXT.PRIMARY} />
          </TouchableOpacity>
          <Text className={cn(
            "text-lg font-semibold",
            "text-gray-900 dark:text-white"
          )}>
            {t('title')}
          </Text>
          <View className="w-10" />
        </View>
        <View className="flex-1 items-center justify-center">
          <Text className={cn(
            "text-base",
            "text-gray-600 dark:text-gray-300"
          )}>
            {t('loading')}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className={cn(
      "flex-1",
      "bg-white dark:bg-gray-900"
    )}>
      <View className={cn(
        "flex-row items-center justify-between px-4 py-2 border-b",
        "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700"
      )}>
        <TouchableOpacity
          className="p-2"
          onPress={() => navigation.goBack()}
        >
          <Icon name="arrow-back" size={24} color={colors.TEXT.PRIMARY} />
        </TouchableOpacity>
        <Text className={cn(
          "text-lg font-semibold",
          "text-gray-900 dark:text-white"
        )}>
          지도
        </Text>
        <TouchableOpacity
          className="p-2"
          onPress={initializeLocation}
        >
          <Icon name="locate" size={20} color="#3B82F6" />
        </TouchableOpacity>
      </View>

      {renderMapTypeSelector()}

      <KakaoMapView
        center={currentLocation}
        markers={mapMarkers}
        onMarkerPress={handleMarkerPress}
        onMapPress={handleMapPress}
        style={{ flex: 1 }}
        zoom={3}
        showCurrentLocation={true}
      />

      {renderMarkerDetail()}
    </SafeAreaView>
  );
});