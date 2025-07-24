import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Ionicons';
import * as Location from 'expo-location';
import { useGroupStore } from '@/store/slices/groupSlice';
import { Group, GroupType } from '@/types';
import { COLORS, SPACING, FONT_SIZES } from '@/utils/constants';

interface LocationData {
  latitude: number;
  longitude: number;
  address?: string;
}

interface NearbyPlace {
  name: string;
  category: string;
  distance: number;
  latitude: number;
  longitude: number;
  address: string;
}

export const LocationGroupScreen: React.FC = React.memo(() => {
  const navigation = useNavigation();
  const [currentLocation, setCurrentLocation] = useState<LocationData | null>(null);
  const [nearbyGroups, setNearbyGroups] = useState<Group[]>([]);
  const [nearbyPlaces, setNearbyPlaces] = useState<NearbyPlace[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [locationPermissionGranted, setLocationPermissionGranted] = useState(false);

  const { groups } = useGroupStore();

  useEffect(() => {
    requestLocationPermission();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (currentLocation) {
      loadNearbyData();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentLocation]);

  const requestLocationPermission = useCallback(async () => {
    try {
      setIsLoading(true);
      
      // 위치 권한 요청
      let { status } = await Location.getForegroundPermissionsAsync();
      
      if (status !== 'granted') {
        const result = await Location.requestForegroundPermissionsAsync();
        status = result.status;
        
        if (status !== 'granted') {
          Alert.alert(
            '위치 권한 필요',
            '근처 그룹을 찾기 위해 위치 권한이 필요합니다.\n설정에서 위치 권한을 허용해주세요.',
            [
              { text: '나중에', style: 'cancel' },
            ]
          );
          setIsLoading(false);
          return;
        }
      }

      setLocationPermissionGranted(true);
      await getCurrentLocation();
    } catch (error) {
      console.error('Location permission error:', error);
      Alert.alert('오류', '위치 권한 요청에 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const getCurrentLocation = async () => {
    try {
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      const locationData: LocationData = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      };

      // 주소 정보 가져오기
      try {
        const addresses = await Location.reverseGeocodeAsync({
          latitude: locationData.latitude,
          longitude: locationData.longitude,
        });

        if (addresses.length > 0) {
          const address = addresses[0];
          locationData.address = [
            address.district,
            address.city,
          ].filter(Boolean).join(' ');
        }
      } catch (geocodeError) {
        console.warn('Geocoding failed:', geocodeError);
      }

      setCurrentLocation(locationData);
    } catch (error) {
      console.error('Get current location error:', error);
      Alert.alert('위치 오류', '현재 위치를 가져올 수 없습니다.');
    }
  };

  const loadNearbyData = useCallback(async () => {
    if (!currentLocation) return;

    try {
      // 근처 그룹 로드 (기존 groups 사용)
      const locationGroups = groups.filter(group => 
        group.type === GroupType.LOCATION && 
        group.location &&
        calculateDistance(
          currentLocation.latitude,
          currentLocation.longitude,
          group.location.latitude,
          group.location.longitude
        ) <= 2000 // 2km 반경
      );
      setNearbyGroups(locationGroups);

      // 근처 장소 로드 (더미 데이터)
      const dummyPlaces: NearbyPlace[] = [
        {
          name: '스타벅스 강남점',
          category: '카페',
          distance: 150,
          latitude: currentLocation.latitude + 0.001,
          longitude: currentLocation.longitude + 0.001,
          address: '서울시 강남구 테헤란로 123',
        },
        {
          name: '연세대학교',
          category: '대학',
          distance: 300,
          latitude: currentLocation.latitude + 0.002,
          longitude: currentLocation.longitude - 0.001,
          address: '서울시 서대문구 연세로 50',
        },
        {
          name: '판교 테크노밸리',
          category: '회사',
          distance: 800,
          latitude: currentLocation.latitude - 0.002,
          longitude: currentLocation.longitude + 0.002,
          address: '경기도 성남시 분당구 판교역로 235',
        },
      ];

      setNearbyPlaces(dummyPlaces);
    } catch (error) {
      console.error('Load nearby data error:', error);
    }
  }, [currentLocation, groups]);

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
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
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    if (locationPermissionGranted) {
      await getCurrentLocation();
    }
    setRefreshing(false);
  };

  const handleCreateLocationGroup = (place?: NearbyPlace) => {
    if (!currentLocation) {
      Alert.alert('오류', '현재 위치를 확인할 수 없습니다.');
      return;
    }

    // CreateGroupScreen으로 이동하면서 위치 정보 전달
    (navigation as { navigate: (screen: string, params: object) => void }).navigate('CreateGroup', {
      type: GroupType.LOCATION,
      location: place ? {
        latitude: place.latitude,
        longitude: place.longitude,
        address: place.address,
      } : {
        latitude: currentLocation.latitude,
        longitude: currentLocation.longitude,
        address: currentLocation.address || '현재 위치',
      },
      suggestedName: place ? `${place.name} 모임` : undefined,
    });
  };

  const renderLocationGroup = ({ item }: { item: Group }) => {
    const distance = item.location ? calculateDistance(
      currentLocation?.latitude || 0,
      currentLocation?.longitude || 0,
      item.location.latitude,
      item.location.longitude
    ) : 0;

    return (
      <TouchableOpacity style={styles.groupCard}>
        <View style={styles.groupHeader}>
          <View style={styles.groupInfo}>
            <Text style={styles.groupName}>{item.name}</Text>
            <View style={styles.locationInfo}>
              <Icon name="location-outline" size={14} color={COLORS.TEXT.SECONDARY} />
              <Text style={styles.locationText}>
                {Math.round(distance)}m • {item.location?.address}
              </Text>
            </View>
          </View>
          <View style={styles.memberCount}>
            <Icon name="people" size={16} color={COLORS.PRIMARY} />
            <Text style={styles.memberCountText}>{item.memberCount}</Text>
          </View>
        </View>
        
        {item.description && (
          <Text style={styles.groupDescription}>{item.description}</Text>
        )}
        
        <View style={styles.groupFooter}>
          <View style={styles.genderRatio}>
            <Text style={styles.genderText}>
              👨 {item.maleCount} • 👩 {item.femaleCount}
            </Text>
          </View>
          <TouchableOpacity style={styles.joinButton}>
            <Text style={styles.joinButtonText}>참여하기</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  const renderNearbyPlace = ({ item }: { item: NearbyPlace }) => (
    <TouchableOpacity 
      style={styles.placeCard}
      onPress={() => handleCreateLocationGroup(item)}
    >
      <View style={styles.placeInfo}>
        <Text style={styles.placeName}>{item.name}</Text>
        <Text style={styles.placeCategory}>{item.category}</Text>
        <View style={styles.placeDistance}>
          <Icon name="walk" size={14} color={COLORS.TEXT.SECONDARY} />
          <Text style={styles.distanceText}>{Math.round(item.distance)}m</Text>
        </View>
      </View>
      <View style={styles.createGroupButton}>
        <Icon name="add-circle" size={24} color={COLORS.PRIMARY} />
      </View>
    </TouchableOpacity>
  );

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
          <Text style={styles.headerTitle}>위치 기반 그룹</Text>
          <View style={styles.headerRight} />
        </View>
        
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.PRIMARY} />
          <Text style={styles.loadingText}>위치 정보를 가져오는 중...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!locationPermissionGranted) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Icon name="arrow-back" size={24} color={COLORS.TEXT.PRIMARY} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>위치 기반 그룹</Text>
          <View style={styles.headerRight} />
        </View>
        
        <View style={styles.permissionContainer}>
          <Icon name="location-outline" size={64} color={COLORS.TEXT.LIGHT} />
          <Text style={styles.permissionTitle}>위치 권한이 필요합니다</Text>
          <Text style={styles.permissionDescription}>
            근처 그룹을 찾고 위치 기반 모임을 만들기 위해{'\n'}
            위치 권한이 필요합니다
          </Text>
          <TouchableOpacity
            style={styles.permissionButton}
            onPress={requestLocationPermission}
          >
            <Text style={styles.permissionButtonText}>위치 권한 허용하기</Text>
          </TouchableOpacity>
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
        <Text style={styles.headerTitle}>위치 기반 그룹</Text>
        <TouchableOpacity
          style={styles.refreshButton}
          onPress={handleRefresh}
        >
          <Icon name="refresh" size={20} color={COLORS.TEXT.SECONDARY} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollContainer}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[COLORS.PRIMARY]}
            tintColor={COLORS.PRIMARY}
          />
        }
      >
        {/* 현재 위치 */}
        {currentLocation && (
          <View style={styles.currentLocationCard}>
            <Icon name="location" size={20} color={COLORS.PRIMARY} />
            <View style={styles.currentLocationInfo}>
              <Text style={styles.currentLocationTitle}>현재 위치</Text>
              <Text style={styles.currentLocationAddress}>
                {currentLocation.address || '위치 정보를 가져오는 중...'}
              </Text>
            </View>
            <TouchableOpacity
              style={styles.createHereButton}
              onPress={() => handleCreateLocationGroup()}
            >
              <Text style={styles.createHereButtonText}>여기서 모임</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* 인기 그룹 */}
        {nearbyGroups.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>🔥 인기 그룹</Text>
            {nearbyGroups
              .sort((a, b) => b.memberCount - a.memberCount)
              .slice(0, 3)
              .map((group, index) => (
                <View key={group.id} style={styles.popularGroupCard}>
                  <View style={styles.popularRank}>
                    <Text style={styles.rankText}>{index + 1}</Text>
                  </View>
                  {renderLocationGroup({ item: group })}
                </View>
              ))
            }
          </View>
        )}

        {/* 근처 그룹 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>근처 그룹 ({nearbyGroups.length})</Text>
          {nearbyGroups.length > 0 ? (
            nearbyGroups.map((group) => (
              <View key={group.id}>
                {renderLocationGroup({ item: group })}
              </View>
            ))
          ) : (
            <View style={styles.emptyState}>
              <Icon name="people-outline" size={48} color={COLORS.TEXT.LIGHT} />
              <Text style={styles.emptyTitle}>근처에 그룹이 없어요</Text>
              <Text style={styles.emptyDescription}>
                첫 번째 그룹을 만들어보세요!
              </Text>
            </View>
          )}
        </View>

        {/* 근처 장소 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>근처 장소에서 모임 만들기</Text>
          {nearbyPlaces.map((place, index) => (
            <View key={index}>
              {renderNearbyPlace({ item: place })}
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
});

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
  refreshButton: {
    padding: SPACING.SM,
  },
  scrollContainer: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontSize: FONT_SIZES.MD,
    color: COLORS.TEXT.SECONDARY,
    marginTop: SPACING.MD,
  },
  permissionContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING.LG,
  },
  permissionTitle: {
    fontSize: FONT_SIZES.XL,
    fontWeight: '600',
    color: COLORS.TEXT.PRIMARY,
    marginTop: SPACING.LG,
    marginBottom: SPACING.SM,
  },
  permissionDescription: {
    fontSize: FONT_SIZES.MD,
    color: COLORS.TEXT.SECONDARY,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: SPACING.XL,
  },
  permissionButton: {
    backgroundColor: COLORS.PRIMARY,
    paddingHorizontal: SPACING.XL,
    paddingVertical: SPACING.MD,
    borderRadius: 12,
  },
  permissionButtonText: {
    color: COLORS.TEXT.WHITE,
    fontSize: FONT_SIZES.MD,
    fontWeight: '600',
  },
  currentLocationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.SURFACE,
    margin: SPACING.MD,
    padding: SPACING.MD,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.PRIMARY + '20',
  },
  currentLocationInfo: {
    flex: 1,
    marginLeft: SPACING.SM,
  },
  currentLocationTitle: {
    fontSize: FONT_SIZES.MD,
    fontWeight: '600',
    color: COLORS.TEXT.PRIMARY,
  },
  currentLocationAddress: {
    fontSize: FONT_SIZES.SM,
    color: COLORS.TEXT.SECONDARY,
    marginTop: 2,
  },
  createHereButton: {
    backgroundColor: COLORS.PRIMARY,
    paddingHorizontal: SPACING.MD,
    paddingVertical: SPACING.SM,
    borderRadius: 8,
  },
  createHereButtonText: {
    color: COLORS.TEXT.WHITE,
    fontSize: FONT_SIZES.SM,
    fontWeight: '600',
  },
  section: {
    margin: SPACING.MD,
  },
  sectionTitle: {
    fontSize: FONT_SIZES.LG,
    fontWeight: 'bold',
    color: COLORS.TEXT.PRIMARY,
    marginBottom: SPACING.MD,
  },
  groupCard: {
    backgroundColor: COLORS.SURFACE,
    borderRadius: 12,
    padding: SPACING.MD,
    marginBottom: SPACING.MD,
    borderWidth: 1,
    borderColor: COLORS.BORDER,
  },
  groupHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.SM,
  },
  groupInfo: {
    flex: 1,
  },
  groupName: {
    fontSize: FONT_SIZES.MD,
    fontWeight: '600',
    color: COLORS.TEXT.PRIMARY,
    marginBottom: 4,
  },
  locationInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationText: {
    fontSize: FONT_SIZES.SM,
    color: COLORS.TEXT.SECONDARY,
    marginLeft: 4,
  },
  memberCount: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.PRIMARY + '10',
    paddingHorizontal: SPACING.SM,
    paddingVertical: 4,
    borderRadius: 12,
  },
  memberCountText: {
    fontSize: FONT_SIZES.SM,
    color: COLORS.PRIMARY,
    fontWeight: '600',
    marginLeft: 4,
  },
  groupDescription: {
    fontSize: FONT_SIZES.SM,
    color: COLORS.TEXT.SECONDARY,
    marginBottom: SPACING.SM,
    lineHeight: 18,
  },
  groupFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  genderRatio: {},
  genderText: {
    fontSize: FONT_SIZES.SM,
    color: COLORS.TEXT.SECONDARY,
  },
  joinButton: {
    backgroundColor: COLORS.PRIMARY,
    paddingHorizontal: SPACING.MD,
    paddingVertical: SPACING.SM,
    borderRadius: 8,
  },
  joinButtonText: {
    color: COLORS.TEXT.WHITE,
    fontSize: FONT_SIZES.SM,
    fontWeight: '600',
  },
  placeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.SURFACE,
    borderRadius: 12,
    padding: SPACING.MD,
    marginBottom: SPACING.SM,
    borderWidth: 1,
    borderColor: COLORS.BORDER,
  },
  placeInfo: {
    flex: 1,
  },
  placeName: {
    fontSize: FONT_SIZES.MD,
    fontWeight: '600',
    color: COLORS.TEXT.PRIMARY,
    marginBottom: 4,
  },
  placeCategory: {
    fontSize: FONT_SIZES.SM,
    color: COLORS.TEXT.SECONDARY,
    marginBottom: 4,
  },
  placeDistance: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  distanceText: {
    fontSize: FONT_SIZES.SM,
    color: COLORS.TEXT.SECONDARY,
    marginLeft: 4,
  },
  createGroupButton: {
    padding: SPACING.SM,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: SPACING.XL,
  },
  emptyTitle: {
    fontSize: FONT_SIZES.LG,
    fontWeight: '600',
    color: COLORS.TEXT.PRIMARY,
    marginTop: SPACING.MD,
    marginBottom: SPACING.SM,
  },
  emptyDescription: {
    fontSize: FONT_SIZES.SM,
    color: COLORS.TEXT.SECONDARY,
    textAlign: 'center',
  },
  popularGroupCard: {
    position: 'relative',
    marginBottom: SPACING.MD,
  },
  popularRank: {
    position: 'absolute',
    top: -5,
    left: -5,
    backgroundColor: COLORS.WARNING,
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
    elevation: 2,
  },
  rankText: {
    fontSize: FONT_SIZES.XS,
    color: COLORS.TEXT.WHITE,
    fontWeight: 'bold',
  },
});