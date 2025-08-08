import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
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
import { Group, GroupType, User } from '@/types';
import { COLORS, SPACING, FONT_SIZES } from '@/utils/constants';

interface LocationData {
  latitude: number;
  longitude: number;
  address?: string;
}

interface MapMarker {
  id: string;
  latitude: number;
  longitude: number;
  title: string;
  description?: string;
  type: 'user' | 'group' | 'place';
  data?: Group | User | any;
}

interface SelectedMarkerData {
  marker: MapMarker;
  position: { x: number; y: number };
}

export const MapScreen = React.memo(() => {
  const navigation = useNavigation();
  const { user } = useAuthStore();
  const { groups } = useGroupStore();
  
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
    Alert.alert('성공', `${group.name} 그룹에 참여했습니다!`);
  };

  const sendLikeToUser = (userData: any) => {
    // 좋아요 전송 로직
    console.log('Sending like to user:', userData);
    Alert.alert('성공', `${userData.nickname}님에게 익명 좋아요를 보냈습니다! 💕`);
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
    <View style={styles.mapTypeSelector}>
      {[
        { key: 'groups', label: '그룹', icon: 'people' },
        { key: 'users', label: '사용자', icon: 'person' },
        { key: 'places', label: '장소', icon: 'location' },
      ].map(({ key, label, icon }) => (
        <TouchableOpacity
          key={key}
          style={[
            styles.mapTypeButton,
            mapType === key && styles.mapTypeButtonActive,
          ]}
          onPress={() => setMapType(key as any)}
        >
          <Icon
            name={icon}
            size={16}
            color={mapType === key ? COLORS.TEXT.WHITE : COLORS.TEXT.SECONDARY}
          />
          <Text
            style={[
              styles.mapTypeButtonText,
              mapType === key && styles.mapTypeButtonTextActive,
            ]}
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
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setSelectedMarker(null)}
        >
          <View style={styles.markerDetailCard}>
            <View style={styles.markerDetailHeader}>
              <View style={[
                styles.markerTypeIcon,
                { backgroundColor: 
                  marker.type === 'group' ? COLORS.PRIMARY :
                  marker.type === 'user' ? COLORS.ERROR :
                  COLORS.SUCCESS
                }
              ]}>
                <Icon
                  name={
                    marker.type === 'group' ? 'people' :
                    marker.type === 'user' ? 'person' :
                    'location'
                  }
                  size={20}
                  color={COLORS.TEXT.WHITE}
                />
              </View>
              <View style={styles.markerDetailInfo}>
                <Text style={styles.markerDetailTitle}>{marker.title}</Text>
                <Text style={styles.markerDetailDescription}>
                  {marker.description}
                </Text>
              </View>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setSelectedMarker(null)}
              >
                <Icon name="close" size={20} color={COLORS.TEXT.SECONDARY} />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => handleMarkerAction(marker)}
            >
              <Text style={styles.actionButtonText}>
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
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Icon name="arrow-back" size={24} color={COLORS.TEXT.PRIMARY} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>지도</Text>
          <View style={styles.headerRight} />
        </View>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>지도를 로드하는 중...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Icon name="arrow-back" size={24} color={COLORS.TEXT.PRIMARY} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>지도</Text>
        <TouchableOpacity
          style={styles.currentLocationButton}
          onPress={initializeLocation}
        >
          <Icon name="locate" size={20} color={COLORS.PRIMARY} />
        </TouchableOpacity>
      </View>

      {renderMapTypeSelector()}

      <KakaoMapView
        center={currentLocation}
        markers={mapMarkers}
        onMarkerPress={handleMarkerPress}
        onMapPress={handleMapPress}
        style={styles.map}
        zoom={3}
        showCurrentLocation={true}
      />

      {renderMarkerDetail()}
    </SafeAreaView>
  );
});

const { width, height } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.BACKGROUND,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.MD,
    paddingVertical: SPACING.SM,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.BORDER,
    backgroundColor: COLORS.SURFACE,
  },
  backButton: {
    padding: SPACING.SM,
  },
  headerTitle: {
    fontSize: FONT_SIZES.LG,
    fontWeight: '600',
    color: COLORS.TEXT.PRIMARY,
  },
  headerRight: {
    width: 40,
  },
  currentLocationButton: {
    padding: SPACING.SM,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontSize: FONT_SIZES.MD,
    color: COLORS.TEXT.SECONDARY,
  },
  mapTypeSelector: {
    flexDirection: 'row',
    backgroundColor: COLORS.SURFACE,
    paddingHorizontal: SPACING.MD,
    paddingVertical: SPACING.SM,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.BORDER,
  },
  mapTypeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.MD,
    paddingVertical: SPACING.SM,
    marginRight: SPACING.SM,
    borderRadius: 20,
    backgroundColor: COLORS.BACKGROUND,
  },
  mapTypeButtonActive: {
    backgroundColor: COLORS.PRIMARY,
  },
  mapTypeButtonText: {
    fontSize: FONT_SIZES.SM,
    color: COLORS.TEXT.SECONDARY,
    marginLeft: SPACING.XS,
    fontWeight: '500',
  },
  mapTypeButtonTextActive: {
    color: COLORS.TEXT.WHITE,
    fontWeight: '600',
  },
  map: {
    flex: 1,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING.LG,
  },
  markerDetailCard: {
    backgroundColor: COLORS.SURFACE,
    borderRadius: 16,
    padding: SPACING.LG,
    width: '100%',
    maxWidth: 320,
  },
  markerDetailHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: SPACING.MD,
  },
  markerTypeIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.MD,
  },
  markerDetailInfo: {
    flex: 1,
  },
  markerDetailTitle: {
    fontSize: FONT_SIZES.LG,
    fontWeight: '600',
    color: COLORS.TEXT.PRIMARY,
    marginBottom: 4,
  },
  markerDetailDescription: {
    fontSize: FONT_SIZES.SM,
    color: COLORS.TEXT.SECONDARY,
    lineHeight: 18,
  },
  closeButton: {
    padding: SPACING.SM,
  },
  actionButton: {
    backgroundColor: COLORS.PRIMARY,
    paddingVertical: SPACING.MD,
    borderRadius: 12,
    alignItems: 'center',
  },
  actionButtonText: {
    color: COLORS.TEXT.WHITE,
    fontSize: FONT_SIZES.MD,
    fontWeight: '600',
  },
});