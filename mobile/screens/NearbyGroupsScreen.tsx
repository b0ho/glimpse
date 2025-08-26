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
  FlatList,
  Modal,
  TextInput,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAndroidSafeTranslation } from '@/hooks/useAndroidSafeTranslation';
import Icon from 'react-native-vector-icons/Ionicons';
import * as Location from 'expo-location';
// import MapView, { Marker, Circle } from 'react-native-maps';
import { useTheme } from '@/hooks/useTheme';
import { useAuthStore } from '@/store/slices/authSlice';
import { useGroupStore } from '@/store/slices/groupSlice';
import { COLORS, SPACING, FONT_SIZES } from '@/utils/constants';
import { API_BASE_URL } from '@/services/api/config';

interface LocationData {
  latitude: number;
  longitude: number;
  address?: string;
}

interface LocationGroup {
  id: string;
  name: string;
  description: string;
  latitude: number;
  longitude: number;
  radius: number; // km
  distance?: number; // meters from user
  memberCount: number;
  activeMembers: number;
  createdBy: string;
  createdAt: Date;
  expiresAt?: Date;
  isJoined: boolean;
  qrCode?: string;
}

export const NearbyGroupsScreen = React.memo(() => {
  const navigation = useNavigation();
  const { t } = useAndroidSafeTranslation(['nearbygroups', 'navigation', 'common']);
  const { colors } = useTheme();
  const { user } = useAuthStore();
  const { joinGroup } = useGroupStore();
  
  const [currentLocation, setCurrentLocation] = useState<LocationData | null>(null);
  const [nearbyGroups, setNearbyGroups] = useState<LocationGroup[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [locationPermissionGranted, setLocationPermissionGranted] = useState(false);
  const [selectedRadius, setSelectedRadius] = useState(2); // 기본 2km
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showMapView, setShowMapView] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<LocationGroup | null>(null);
  
  // 새 그룹 생성 상태
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupDescription, setNewGroupDescription] = useState('');
  const [newGroupRadius, setNewGroupRadius] = useState('1');
  const [newGroupDuration, setNewGroupDuration] = useState('4');

  const radiusOptions = [1, 2, 5, 10]; // km 단위

  useEffect(() => {
    requestLocationPermission();
  }, []);

  useEffect(() => {
    if (currentLocation) {
      loadNearbyGroups();
    }
  }, [currentLocation, selectedRadius]);

  const requestLocationPermission = useCallback(async () => {
    try {
      setIsLoading(true);
      
      let { status } = await Location.getForegroundPermissionsAsync();
      
      if (status !== 'granted') {
        const result = await Location.requestForegroundPermissionsAsync();
        status = result.status;
        
        if (status !== 'granted') {
          Alert.alert(
            t('nearbygroups:alerts.permission.title'),
            t('nearbygroups:alerts.permission.message'),
            [{ text: t('nearbygroups:alerts.permission.later'), style: 'cancel' }]
          );
          setIsLoading(false);
          return;
        }
      }

      setLocationPermissionGranted(true);
      await getCurrentLocation();
    } catch (error) {
      console.error('Location permission error:', error);
      Alert.alert(t('common:alerts.error.title'), t('nearbygroups:alerts.permission.requestError'));
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
      Alert.alert(t('common:alerts.error.title'), t('nearbygroups:alerts.location.error'));
    }
  };

  const loadNearbyGroups = useCallback(async () => {
    if (!currentLocation || !user) return;

    try {
      setIsLoading(true);

      // 실제 API 호출
      try {
        const response = await fetch(
          `${API_BASE_URL}/location/nearby/groups?radius=${selectedRadius}`,
          {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              'x-dev-auth': 'true',
            },
          }
        );

        if (response.ok) {
          const data = await response.json();
          if (data && data.length > 0) {
            setNearbyGroups(data);
            return;
          }
        }
      } catch (apiError) {
        console.log('API call failed, using dummy data:', apiError);
      }

      // 거리 계산 함수 (Haversine formula)
      const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
        const R = 6371; // 지구 반지름 (km)
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const a = 
          Math.sin(dLat/2) * Math.sin(dLat/2) +
          Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
          Math.sin(dLon/2) * Math.sin(dLon/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        return R * c * 1000; // km를 m로 변환
      };

      // API 실패 시 더미 데이터 사용 (다양한 거리의 그룹들)
      const allDummyGroups: LocationGroup[] = [
        {
          id: 'group1',
          name: '스타벅스 강남점',
          description: '스타벅스에서 만나요! 커피 한잔하며 대화해요 ☕️',
          latitude: currentLocation.latitude + 0.001,
          longitude: currentLocation.longitude + 0.001,
          radius: 0.5,
          distance: 0,
          memberCount: 12,
          activeMembers: 8,
          createdBy: 'user123',
          createdAt: new Date(),
          expiresAt: new Date(Date.now() + 3 * 60 * 60 * 1000),
          isJoined: false,
        },
        {
          id: 'group2',
          name: '코엑스 런치 모임',
          description: '점심 같이 먹을 사람 구해요! 맛집 추천 환영 🍚',
          latitude: currentLocation.latitude - 0.003,
          longitude: currentLocation.longitude + 0.003,
          radius: 1,
          distance: 0,
          memberCount: 25,
          activeMembers: 15,
          createdBy: 'user456',
          createdAt: new Date(Date.now() - 30 * 60 * 1000),
          expiresAt: new Date(Date.now() + 2 * 60 * 60 * 1000),
          isJoined: true,
        },
        {
          id: 'group3',
          name: '한강공원 러닝',
          description: '저녁 7시 한강에서 러닝해요! 초보자도 환영 🏃‍♂️',
          latitude: currentLocation.latitude + 0.008,
          longitude: currentLocation.longitude - 0.008,
          radius: 2,
          distance: 0,
          memberCount: 8,
          activeMembers: 5,
          createdBy: 'user789',
          createdAt: new Date(Date.now() - 60 * 60 * 1000),
          expiresAt: new Date(Date.now() + 5 * 60 * 60 * 1000),
          isJoined: false,
        },
        {
          id: 'group4',
          name: '강남역 스터디 카페',
          description: '개발 스터디 함께해요! 💻',
          latitude: currentLocation.latitude + 0.015,
          longitude: currentLocation.longitude + 0.015,
          radius: 1,
          distance: 0,
          memberCount: 6,
          activeMembers: 4,
          createdBy: 'user111',
          createdAt: new Date(),
          isJoined: false,
        },
        {
          id: 'group5',
          name: '판교 테크노밸리',
          description: 'IT 종사자 모임',
          latitude: currentLocation.latitude + 0.04,
          longitude: currentLocation.longitude + 0.04,
          radius: 3,
          distance: 0,
          memberCount: 30,
          activeMembers: 20,
          createdBy: 'user222',
          createdAt: new Date(),
          isJoined: false,
        },
        {
          id: 'group6',
          name: '서울숲 피크닉',
          description: '주말 피크닉 함께해요 🧺',
          latitude: currentLocation.latitude + 0.08,
          longitude: currentLocation.longitude - 0.08,
          radius: 2,
          distance: 0,
          memberCount: 15,
          activeMembers: 10,
          createdBy: 'user333',
          createdAt: new Date(),
          isJoined: false,
        },
      ];

      // 각 그룹의 실제 거리 계산
      const groupsWithDistance = allDummyGroups.map(group => ({
        ...group,
        distance: calculateDistance(
          currentLocation.latitude,
          currentLocation.longitude,
          group.latitude,
          group.longitude
        )
      }));

      // 선택된 반경 내의 그룹만 필터링
      const filteredGroups = groupsWithDistance.filter(group => 
        group.distance <= selectedRadius * 1000 // km to meters
      ).sort((a, b) => a.distance - b.distance); // 거리순 정렬

      setNearbyGroups(filteredGroups);
    } catch (error) {
      console.error('Load nearby groups error:', error);
    } finally {
      setIsLoading(false);
    }
  }, [currentLocation, selectedRadius, user]);

  const handleRefresh = async () => {
    setRefreshing(true);
    if (locationPermissionGranted) {
      await getCurrentLocation();
      await loadNearbyGroups();
    }
    setRefreshing(false);
  };

  const handleJoinGroup = async (group: LocationGroup) => {
    if (!user) return;

    Alert.alert(
      t('nearbygroups:alerts.group.joinTitle'),
      t('nearbygroups:alerts.group.joinMessage', { groupName: group.name }),
      [
        { text: t('common:buttons.cancel'), style: 'cancel' },
        {
          text: t('nearbygroups:alerts.group.join'),
          onPress: async () => {
            try {
              await joinGroup(group.id);
              Alert.alert(t('common:alerts.success.title'), t('nearbygroups:alerts.group.joinSuccess'));
              loadNearbyGroups(); // 리스트 새로고침
            } catch (error) {
              Alert.alert(t('common:alerts.error.title'), t('nearbygroups:alerts.group.joinError'));
            }
          },
        },
      ]
    );
  };

  const handleCreateGroup = async () => {
    if (!currentLocation) {
      Alert.alert(t('common:alerts.error.title'), t('nearbygroups:alerts.location.required'));
      return;
    }

    if (!newGroupName.trim() || !newGroupDescription.trim()) {
      Alert.alert(t('common:alerts.error.title'), t('nearbygroups:alerts.validation.allFields'));
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/location/groups`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-dev-auth': 'true',
        },
        body: JSON.stringify({
          name: newGroupName,
          description: newGroupDescription,
          latitude: currentLocation.latitude,
          longitude: currentLocation.longitude,
          radius: parseFloat(newGroupRadius),
          durationHours: parseInt(newGroupDuration),
        }),
      });

      if (response.ok) {
        Alert.alert(t('common:alerts.success.title'), t('nearbygroups:alerts.group.createSuccess'));
        setShowCreateModal(false);
        setNewGroupName('');
        setNewGroupDescription('');
        setNewGroupRadius('1');
        setNewGroupDuration('4');
        loadNearbyGroups();
      } else {
        throw new Error('Failed to create group');
      }
    } catch (error) {
      console.error('Create group error:', error);
      Alert.alert(t('common:alerts.error.title'), t('nearbygroups:alerts.group.createError'));
    }
  };

  const renderGroup = ({ item }: { item: LocationGroup }) => (
    <TouchableOpacity 
      style={[styles.groupCard, { backgroundColor: colors.SURFACE, borderColor: colors.BORDER }]}
      onPress={() => setSelectedGroup(item)}
    >
      <View style={styles.groupHeader}>
        <View style={[styles.groupIcon, { backgroundColor: colors.PRIMARY }]}>
          <Icon name="people" size={24} color={colors.TEXT.WHITE} />
        </View>
        
        <View style={styles.groupInfo}>
          <View style={styles.groupNameRow}>
            <Text style={[styles.groupName, { color: colors.TEXT.PRIMARY }]}>{item.name}</Text>
            {item.isJoined && (
              <View style={[styles.joinedBadge, { backgroundColor: colors.SUCCESS + '20' }]}>
                <Text style={[styles.joinedBadgeText, { color: colors.SUCCESS }]}>가입됨</Text>
              </View>
            )}
          </View>
          
          <View style={styles.groupStats}>
            <Icon name="location-outline" size={14} color={colors.TEXT.SECONDARY} />
            <Text style={[styles.distanceText, { color: colors.TEXT.SECONDARY }]}>
              {item.distance! < 1000 
                ? `${Math.round(item.distance!)}m` 
                : `${(item.distance! / 1000).toFixed(1)}km`
              }
            </Text>
            <Icon name="people-outline" size={14} color={colors.TEXT.SECONDARY} />
            <Text style={[styles.memberText, { color: colors.TEXT.SECONDARY }]}>
              {item.activeMembers}/{item.memberCount}
            </Text>
          </View>
        </View>

        {!item.isJoined && (
          <TouchableOpacity
            style={[styles.joinButton, { backgroundColor: colors.PRIMARY }]}
            onPress={() => handleJoinGroup(item)}
          >
            <Text style={[styles.joinButtonText, { color: colors.TEXT.WHITE }]}>가입</Text>
          </TouchableOpacity>
        )}
      </View>

      <Text style={[styles.groupDescription, { color: colors.TEXT.SECONDARY }]}>{item.description}</Text>

      {item.expiresAt && (
        <View style={styles.groupFooter}>
          <Icon name="time-outline" size={14} color={colors.TEXT.LIGHT} />
          <Text style={[styles.expiresText, { color: colors.TEXT.LIGHT }]}>
            {`${Math.round((new Date(item.expiresAt).getTime() - Date.now()) / (1000 * 60 * 60))}시간 후 만료`}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );

  const renderRadiusSelector = () => (
    <View style={[styles.radiusSelector, { backgroundColor: colors.SURFACE, borderColor: colors.BORDER }]}>
      <Text style={[styles.radiusSelectorTitle, { color: colors.TEXT.PRIMARY }]}>검색 반경</Text>
      <View style={styles.radiusOptions}>
        {radiusOptions.map(radius => (
          <TouchableOpacity
            key={radius}
            style={[
              styles.radiusOption,
              { borderColor: colors.BORDER },
              selectedRadius === radius && { backgroundColor: colors.PRIMARY, borderColor: colors.PRIMARY }
            ]}
            onPress={() => setSelectedRadius(radius)}
          >
            <Text style={[
              styles.radiusOptionText,
              { color: colors.TEXT.SECONDARY },
              selectedRadius === radius && { color: colors.TEXT.WHITE, fontWeight: '600' }
            ]}>
              {radius}km
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderCreateModal = () => (
    <Modal
      visible={showCreateModal}
      animationType="slide"
      transparent={true}
      onRequestClose={() => setShowCreateModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, { backgroundColor: colors.SURFACE }]}>
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { color: colors.TEXT.PRIMARY }]}>그룹 생성</Text>
            <TouchableOpacity onPress={() => setShowCreateModal(false)}>
              <Icon name="close" size={24} color={colors.TEXT.SECONDARY} />
            </TouchableOpacity>
          </View>

          <TextInput
            style={[styles.input, { backgroundColor: colors.BACKGROUND, color: colors.TEXT.PRIMARY }]}
            placeholder="그룹 이름"
            placeholderTextColor={colors.TEXT.LIGHT}
            value={newGroupName}
            onChangeText={setNewGroupName}
            maxLength={100}
          />

          <TextInput
            style={[styles.input, styles.textArea, { backgroundColor: colors.BACKGROUND, color: colors.TEXT.PRIMARY }]}
            placeholder="그룹 설명"
            placeholderTextColor={colors.TEXT.LIGHT}
            value={newGroupDescription}
            onChangeText={setNewGroupDescription}
            multiline
            numberOfLines={3}
            maxLength={500}
          />

          <View style={styles.inputRow}>
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.TEXT.SECONDARY }]}>반경 (km)</Text>
              <TextInput
                style={[styles.input, styles.smallInput, { backgroundColor: colors.BACKGROUND, color: colors.TEXT.PRIMARY }]}
                placeholder="1"
                placeholderTextColor={colors.TEXT.LIGHT}
                value={newGroupRadius}
                onChangeText={setNewGroupRadius}
                keyboardType="numeric"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.TEXT.SECONDARY }]}>유효 시간 (시간)</Text>
              <TextInput
                style={[styles.input, styles.smallInput, { backgroundColor: colors.BACKGROUND, color: colors.TEXT.PRIMARY }]}
                placeholder="4"
                placeholderTextColor={colors.TEXT.LIGHT}
                value={newGroupDuration}
                onChangeText={setNewGroupDuration}
                keyboardType="numeric"
              />
            </View>
          </View>

          <TouchableOpacity
            style={[styles.createButton, { backgroundColor: colors.PRIMARY }]}
            onPress={handleCreateGroup}
          >
            <Text style={[styles.createButtonText, { color: colors.TEXT.WHITE }]}>생성</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  if (isLoading && !nearbyGroups.length) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.BACKGROUND }]}>
        <View style={[styles.header, { backgroundColor: colors.SURFACE, borderBottomColor: colors.BORDER }]}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Icon name="arrow-back" size={24} color={colors.TEXT.PRIMARY} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.TEXT.PRIMARY }]}>근처 그룹</Text>
          <View style={styles.headerRight} />
        </View>
        
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.PRIMARY} />
          <Text style={[styles.loadingText, { color: colors.TEXT.SECONDARY }]}>위치 정보 불러오는 중...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!locationPermissionGranted) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.BACKGROUND }]}>
        <View style={[styles.header, { backgroundColor: colors.SURFACE, borderBottomColor: colors.BORDER }]}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Icon name="arrow-back" size={24} color={colors.TEXT.PRIMARY} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.TEXT.PRIMARY }]}>근처 그룹</Text>
          <View style={styles.headerRight} />
        </View>
        
        <View style={styles.permissionContainer}>
          <Icon name="location-outline" size={64} color={colors.TEXT.LIGHT} />
          <Text style={[styles.permissionTitle, { color: colors.TEXT.PRIMARY }]}>위치 권한 필요</Text>
          <Text style={[styles.permissionDescription, { color: colors.TEXT.SECONDARY }]}>
            근처 그룹을 찾으려면 위치 권한이 필요합니다.
          </Text>
          <TouchableOpacity
            style={[styles.permissionButton, { backgroundColor: colors.PRIMARY }]}
            onPress={requestLocationPermission}
          >
            <Text style={[styles.permissionButtonText, { color: colors.TEXT.WHITE }]}>위치 권한 요청</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.BACKGROUND }]}>
      <View style={[styles.header, { backgroundColor: colors.SURFACE, borderBottomColor: colors.BORDER }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Icon name="arrow-back" size={24} color={colors.TEXT.PRIMARY} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.TEXT.PRIMARY }]}>{t('navigation:screens.nearbyGroups')}</Text>
        <View style={styles.headerButtons}>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => setShowMapView(!showMapView)}
          >
            <Icon name={showMapView ? "list" : "map"} size={20} color={colors.TEXT.SECONDARY} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={handleRefresh}
          >
            <Icon name="refresh" size={20} color={colors.TEXT.SECONDARY} />
          </TouchableOpacity>
        </View>
      </View>

      {showMapView && currentLocation ? (
        <View style={styles.mapContainer}>
          <View style={[styles.mapPlaceholder, { backgroundColor: colors.SURFACE }]}>
            <Icon name="map-outline" size={64} color={colors.TEXT.LIGHT} />
            <Text style={[styles.mapPlaceholderText, { color: colors.TEXT.SECONDARY }]}>
              지도 기능은 준비 중입니다
            </Text>
          </View>
        </View>
      ) : (
        <FlatList
          data={nearbyGroups}
          renderItem={renderGroup}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          ListHeaderComponent={
            <View>
              {renderRadiusSelector()}
              
              {currentLocation && (
                <View style={[styles.currentLocationCard, { backgroundColor: colors.SURFACE, borderColor: colors.PRIMARY + '20' }]}>
                  <Icon name="location" size={20} color={colors.PRIMARY} />
                  <View style={styles.currentLocationInfo}>
                    <Text style={[styles.currentLocationTitle, { color: colors.TEXT.PRIMARY }]}>현재 위치</Text>
                    <Text style={[styles.currentLocationAddress, { color: colors.TEXT.SECONDARY }]}>
                      {currentLocation.address || '위치 확인 중...'}
                    </Text>
                  </View>
                </View>
              )}

              <View style={styles.sectionHeader}>
                <Text style={[styles.sectionTitle, { color: colors.TEXT.PRIMARY }]}>
                  {`${nearbyGroups.length}개의 그룹`}
                </Text>
                <Text style={[styles.sectionSubtitle, { color: colors.TEXT.SECONDARY }]}>
                  {`${selectedRadius}km 반경 내`}
                </Text>
              </View>
            </View>
          }
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Icon name="location-outline" size={64} color={colors.TEXT.LIGHT} />
              <Text style={[styles.emptyTitle, { color: colors.TEXT.PRIMARY }]}>근처에 그룹이 없습니다</Text>
              <Text style={[styles.emptyDescription, { color: colors.TEXT.SECONDARY }]}>
                검색 반경을 늘리거나 새 그룹을 만들어보세요.
              </Text>
              <TouchableOpacity
                style={[styles.createGroupButton, { backgroundColor: colors.PRIMARY }]}
                onPress={() => setShowCreateModal(true)}
              >
                <Icon name="add-circle-outline" size={20} color={colors.TEXT.WHITE} />
                <Text style={[styles.createGroupButtonText, { color: colors.TEXT.WHITE }]}>첫 그룹 만들기</Text>
              </TouchableOpacity>
            </View>
          }
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={[colors.PRIMARY]}
              tintColor={colors.PRIMARY}
            />
          }
          showsVerticalScrollIndicator={false}
        />
      )}

      {!showMapView && nearbyGroups.length > 0 && (
        <TouchableOpacity
          style={[styles.floatingButton, { backgroundColor: colors.PRIMARY }]}
          onPress={() => setShowCreateModal(true)}
        >
          <Icon name="add" size={28} color={colors.TEXT.WHITE} />
        </TouchableOpacity>
      )}

      {renderCreateModal()}
    </SafeAreaView>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.MD,
    paddingVertical: SPACING.SM,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: SPACING.SM,
  },
  headerTitle: {
    fontSize: FONT_SIZES.LG,
    fontWeight: '600',
  },
  headerRight: {
    width: 40,
  },
  headerButtons: {
    flexDirection: 'row',
  },
  headerButton: {
    padding: SPACING.SM,
    marginLeft: SPACING.XS,
  },
  listContainer: {
    paddingBottom: SPACING.XL * 2,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontSize: FONT_SIZES.MD,
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
    marginTop: SPACING.LG,
    marginBottom: SPACING.SM,
  },
  permissionDescription: {
    fontSize: FONT_SIZES.MD,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: SPACING.XL,
  },
  permissionButton: {
    paddingHorizontal: SPACING.XL,
    paddingVertical: SPACING.MD,
    borderRadius: 12,
  },
  permissionButtonText: {
    fontSize: FONT_SIZES.MD,
    fontWeight: '600',
  },
  radiusSelector: {
    margin: SPACING.MD,
    padding: SPACING.MD,
    borderRadius: 12,
    borderWidth: 1,
  },
  radiusSelectorTitle: {
    fontSize: FONT_SIZES.MD,
    fontWeight: '600',
    marginBottom: SPACING.SM,
  },
  radiusOptions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  radiusOption: {
    flex: 1,
    paddingVertical: SPACING.SM,
    marginHorizontal: 4,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
  },
  radiusOptionText: {
    fontSize: FONT_SIZES.SM,
    fontWeight: '500',
  },
  currentLocationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: SPACING.MD,
    marginTop: 0,
    padding: SPACING.MD,
    borderRadius: 12,
    borderWidth: 1,
  },
  currentLocationInfo: {
    flex: 1,
    marginLeft: SPACING.SM,
  },
  currentLocationTitle: {
    fontSize: FONT_SIZES.MD,
    fontWeight: '600',
  },
  currentLocationAddress: {
    fontSize: FONT_SIZES.SM,
    marginTop: 2,
  },
  sectionHeader: {
    paddingHorizontal: SPACING.MD,
    paddingVertical: SPACING.SM,
  },
  sectionTitle: {
    fontSize: FONT_SIZES.LG,
    fontWeight: 'bold',
  },
  sectionSubtitle: {
    fontSize: FONT_SIZES.SM,
    marginTop: 2,
  },
  groupCard: {
    marginHorizontal: SPACING.MD,
    marginBottom: SPACING.MD,
    borderRadius: 12,
    padding: SPACING.MD,
    borderWidth: 1,
  },
  groupHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  groupIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  groupInfo: {
    flex: 1,
    marginLeft: SPACING.SM,
  },
  groupNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  groupName: {
    fontSize: FONT_SIZES.MD,
    fontWeight: '600',
    marginRight: SPACING.SM,
  },
  joinedBadge: {
    paddingHorizontal: SPACING.SM,
    paddingVertical: 2,
    borderRadius: 8,
  },
  joinedBadgeText: {
    fontSize: FONT_SIZES.XS,
    fontWeight: '600',
  },
  groupStats: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  distanceText: {
    fontSize: FONT_SIZES.SM,
    marginLeft: 4,
    marginRight: SPACING.SM,
  },
  memberText: {
    fontSize: FONT_SIZES.SM,
    marginLeft: 4,
  },
  joinButton: {
    paddingHorizontal: SPACING.MD,
    paddingVertical: SPACING.SM,
    borderRadius: 8,
  },
  joinButtonText: {
    fontSize: FONT_SIZES.SM,
    fontWeight: '600',
  },
  groupDescription: {
    fontSize: FONT_SIZES.SM,
    marginTop: SPACING.SM,
    lineHeight: 18,
  },
  groupFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: SPACING.SM,
  },
  expiresText: {
    fontSize: FONT_SIZES.XS,
    marginLeft: 4,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: SPACING.XL * 2,
    paddingHorizontal: SPACING.LG,
  },
  emptyTitle: {
    fontSize: FONT_SIZES.LG,
    fontWeight: '600',
    marginTop: SPACING.MD,
    marginBottom: SPACING.SM,
  },
  emptyDescription: {
    fontSize: FONT_SIZES.SM,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: SPACING.LG,
  },
  createGroupButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.LG,
    paddingVertical: SPACING.MD,
    borderRadius: 12,
  },
  createGroupButtonText: {
    fontSize: FONT_SIZES.MD,
    fontWeight: '600',
    marginLeft: SPACING.SM,
  },
  floatingButton: {
    position: 'absolute',
    bottom: SPACING.XL,
    right: SPACING.MD,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  mapContainer: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  mapPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mapPlaceholderText: {
    fontSize: FONT_SIZES.MD,
    marginTop: SPACING.MD,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: SPACING.LG,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.LG,
  },
  modalTitle: {
    fontSize: FONT_SIZES.XL,
    fontWeight: '600',
  },
  input: {
    borderRadius: 8,
    padding: SPACING.MD,
    marginBottom: SPACING.MD,
    fontSize: FONT_SIZES.MD,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  inputRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.MD,
  },
  inputGroup: {
    flex: 1,
    marginHorizontal: SPACING.XS,
  },
  inputLabel: {
    fontSize: FONT_SIZES.SM,
    marginBottom: SPACING.XS,
  },
  smallInput: {
    marginBottom: 0,
  },
  createButton: {
    paddingVertical: SPACING.MD,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: SPACING.MD,
  },
  createButtonText: {
    fontSize: FONT_SIZES.MD,
    fontWeight: '600',
  },
});