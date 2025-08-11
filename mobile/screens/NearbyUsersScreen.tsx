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
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import Icon from 'react-native-vector-icons/Ionicons';
import * as Location from 'expo-location';
import { useAuthStore } from '@/store/slices/authSlice';
import { useLikeStore } from '@/store/slices/likeSlice';
import { User, NearbyUser } from '@/types';
import { COLORS, SPACING, FONT_SIZES } from '@/utils/constants';

interface LocationData {
  latitude: number;
  longitude: number;
  address?: string;
}

// NearbyUser interface is now imported from shared/types

export const NearbyUsersScreen = React.memo(() => {
  const navigation = useNavigation();
  const { t } = useTranslation('location');
  const { user } = useAuthStore();
  const { sendLike, sentLikes } = useLikeStore();
  
  const [currentLocation, setCurrentLocation] = useState<LocationData | null>(null);
  const [nearbyUsers, setNearbyUsers] = useState<NearbyUser[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [locationPermissionGranted, setLocationPermissionGranted] = useState(false);
  const [selectedRadius, setSelectedRadius] = useState(2); // 기본 2km

  const radiusOptions = [1, 2, 5, 10]; // km 단위

  useEffect(() => {
    requestLocationPermission();
  }, []);

  useEffect(() => {
    if (currentLocation) {
      loadNearbyUsers();
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
            t('permissions.requestTitle'),
            t('permissions.requestMessage'),
            [{ text: t('permissions.later'), style: 'cancel' }]
          );
          setIsLoading(false);
          return;
        }
      }

      setLocationPermissionGranted(true);
      await getCurrentLocation();
    } catch (error) {
      console.error('Location permission error:', error);
      Alert.alert(t('errors.title'), t('permissions.locationRequestError'));
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
      Alert.alert(t('errors.title'), t('permissions.locationError'));
    }
  };

  const loadNearbyUsers = useCallback(async () => {
    if (!currentLocation || !user) return;

    try {
      setIsLoading(true);

      // 실제 구현에서는 백엔드 API 호출
      // 여기서는 더미 데이터 사용
      const dummyUsers: NearbyUser[] = [
        {
          id: 'user1',
          nickname: '카페러버',
          age: 25,
          gender: 'FEMALE' as const,
          profileImage: undefined,
          isVerified: true,
          isPremium: false,
          distance: 150,
          lastSeen: '방금 전',
          isOnline: true,
          commonGroups: ['스타벅스 강남점 모임'],
          bio: '커피와 독서를 좋아하는 25살입니다 ☕️📚',
          phoneNumber: '',
          credits: 5,
          lastActive: new Date(),
          createdAt: new Date(),
          updatedAt: new Date(),
          anonymousId: 'anon_user1',
        },
        {
          id: 'user2',
          nickname: '헬스매니아',
          age: 28,
          gender: 'MALE' as const,
          profileImage: undefined,
          isVerified: false,
          isPremium: true,
          distance: 300,
          lastSeen: '5분 전',
          isOnline: false,
          commonGroups: ['피트니스 센터', '판교 테크노밸리'],
          bio: '건강한 삶을 추구하는 개발자입니다 💪',
          phoneNumber: '',
          credits: 10,
          lastActive: new Date(Date.now() - 5 * 60 * 1000),
          createdAt: new Date(),
          updatedAt: new Date(),
          anonymousId: 'anon_user2',
        },
        {
          id: 'user3',
          nickname: '음악감상가',
          age: 23,
          gender: 'FEMALE' as const,
          profileImage: undefined,
          isVerified: true,
          isPremium: false,
          distance: 800,
          lastSeen: '1시간 전',
          isOnline: false,
          commonGroups: ['연세대학교'],
          bio: '클래식과 재즈를 사랑하는 대학생 🎵',
          phoneNumber: '',
          credits: 3,
          lastActive: new Date(Date.now() - 60 * 60 * 1000),
          createdAt: new Date(),
          updatedAt: new Date(),
          anonymousId: 'anon_user3',
        },
      ].filter(dummyUser => 
        dummyUser.distance <= selectedRadius * 1000 && // km to meters
        dummyUser.id !== user.id
      );

      setNearbyUsers(dummyUsers);
    } catch (error) {
      console.error('Load nearby users error:', error);
    } finally {
      setIsLoading(false);
    }
  }, [currentLocation, selectedRadius, user]);

  const handleRefresh = async () => {
    setRefreshing(true);
    if (locationPermissionGranted) {
      await getCurrentLocation();
    }
    setRefreshing(false);
  };

  const handleSendLike = async (targetUser: NearbyUser) => {
    if (!user) return;

    try {
      // 이미 좋아요를 보낸 사용자인지 확인
      const existingLike = sentLikes.find((like: any) => 
        like.senderId === user.id && like.receiverId === targetUser.id
      );

      if (existingLike) {
        Alert.alert(t('common:notification'), t('matching.alreadySent'));
        return;
      }

      // 크레딧 확인
      if (!user.isPremium && (user.credits || 0) <= 0) {
        Alert.alert(
          t('matching.creditError.title'),
          t('matching.creditError.message'),
          [
            { text: t('matching.creditError.later'), style: 'cancel' },
            { text: t('matching.creditError.buyCredits'), onPress: () => navigation.navigate('Premium' as never) },
          ]
        );
        return;
      }

      Alert.alert(
        t('matching.sendLike'),
        t('matching.sendLikeMessage', {
          nickname: targetUser.nickname,
          premium: user.isPremium ? t('matching.premiumUnlimited') : t('matching.creditCost')
        }),
        [
          { text: t('matching.cancel'), style: 'cancel' },
          {
            text: t('matching.send'),
            onPress: async () => {
              try {
                await sendLike(
                  targetUser.id,
                  targetUser.commonGroups[0] || 'location_group'
                );
                Alert.alert(t('common:success'), t('matching.success'));
              } catch (error) {
                Alert.alert(t('errors.title'), t('matching.error'));
              }
            },
          },
        ]
      );
    } catch (error) {
      console.error('Send like error:', error);
      Alert.alert(t('errors.title'), t('matching.error'));
    }
  };

  const renderNearbyUser = ({ item }: { item: NearbyUser }) => (
    <TouchableOpacity style={styles.userCard}>
      <View style={styles.userHeader}>
        <View style={styles.userAvatar}>
          <Icon 
            name="person" 
            size={24} 
            color={COLORS.TEXT.WHITE} 
          />
        </View>
        
        <View style={styles.userInfo}>
          <View style={styles.userNameRow}>
            <Text style={styles.userName}>{item.nickname}</Text>
            <Text style={styles.userAge}>{item.age || 25}{t('nearbyUsers.ageUnit')}</Text>
            {item.isVerified && (
              <Icon name="checkmark-circle" size={16} color={COLORS.SUCCESS} />
            )}
            {item.isPremium && (
              <Icon name="diamond" size={14} color={COLORS.WARNING} />
            )}
          </View>
          
          <View style={styles.locationRow}>
            <Icon name="location-outline" size={14} color={COLORS.TEXT.SECONDARY} />
            <Text style={styles.distanceText}>
              {item.distance < 1000 
                ? `${Math.round(item.distance)}m` 
                : `${(item.distance / 1000).toFixed(1)}km`
              }
            </Text>
            <View style={[
              styles.onlineStatus, 
              { backgroundColor: item.isOnline ? COLORS.SUCCESS : COLORS.TEXT.LIGHT }
            ]} />
            <Text style={styles.lastSeenText}>{item.lastSeen}</Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.likeButton}
          onPress={() => handleSendLike(item)}
        >
          <Icon name="heart-outline" size={20} color={COLORS.ERROR} />
        </TouchableOpacity>
      </View>

      {item.bio && (
        <Text style={styles.userBio}>{item.bio}</Text>
      )}

      {item.commonGroups.length > 0 && (
        <View style={styles.commonGroups}>
          <Text style={styles.commonGroupsTitle}>{t('nearbyUsers.commonGroups')}</Text>
          <View style={styles.groupTags}>
            {item.commonGroups.slice(0, 2).map((group, index) => (
              <View key={index} style={styles.groupTag}>
                <Text style={styles.groupTagText}>{group}</Text>
              </View>
            ))}
            {item.commonGroups.length > 2 && (
              <Text style={styles.moreGroups}>{t('nearbyUsers.moreGroups', { count: item.commonGroups.length - 2 })}</Text>
            )}
          </View>
        </View>
      )}
    </TouchableOpacity>
  );

  const renderRadiusSelector = () => (
    <View style={styles.radiusSelector}>
      <Text style={styles.radiusSelectorTitle}>{t('nearbyUsers.searchRadius')}</Text>
      <View style={styles.radiusOptions}>
        {radiusOptions.map(radius => (
          <TouchableOpacity
            key={radius}
            style={[
              styles.radiusOption,
              selectedRadius === radius && styles.radiusOptionSelected
            ]}
            onPress={() => setSelectedRadius(radius)}
          >
            <Text style={[
              styles.radiusOptionText,
              selectedRadius === radius && styles.radiusOptionTextSelected
            ]}>
              {radius}km
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  if (isLoading && !nearbyUsers.length) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Icon name="arrow-back" size={24} color={COLORS.TEXT.PRIMARY} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t('nearbyUsers.title')}</Text>
          <View style={styles.headerRight} />
        </View>
        
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.PRIMARY} />
          <Text style={styles.loadingText}>{t('nearbyUsers.loading')}</Text>
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
          <Text style={styles.headerTitle}>{t('nearbyUsers.title')}</Text>
          <View style={styles.headerRight} />
        </View>
        
        <View style={styles.permissionContainer}>
          <Icon name="people-outline" size={64} color={COLORS.TEXT.LIGHT} />
          <Text style={styles.permissionTitle}>{t('permissions.required')}</Text>
          <Text style={styles.permissionDescription}>
            {t('permissions.description')}
          </Text>
          <TouchableOpacity
            style={styles.permissionButton}
            onPress={requestLocationPermission}
          >
            <Text style={styles.permissionButtonText}>{t('permissions.requestButton')}</Text>
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
        <Text style={styles.headerTitle}>{t('nearbyUsers.title')}</Text>
        <TouchableOpacity
          style={styles.refreshButton}
          onPress={handleRefresh}
        >
          <Icon name="refresh" size={20} color={COLORS.TEXT.SECONDARY} />
        </TouchableOpacity>
      </View>

      <FlatList
        data={nearbyUsers}
        renderItem={renderNearbyUser}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        ListHeaderComponent={
          <View>
            {renderRadiusSelector()}
            
            {currentLocation && (
              <View style={styles.currentLocationCard}>
                <Icon name="location" size={20} color={COLORS.PRIMARY} />
                <View style={styles.currentLocationInfo}>
                  <Text style={styles.currentLocationTitle}>{t('nearbyUsers.currentLocation')}</Text>
                  <Text style={styles.currentLocationAddress}>
                    {currentLocation.address || t('nearbyUsers.loadingLocation')}
                  </Text>
                </View>
              </View>
            )}

            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>
                {t('nearbyUsers.userCount', { count: nearbyUsers.length })}
              </Text>
              <Text style={styles.sectionSubtitle}>
                {t('nearbyUsers.radiusDistance', { radius: selectedRadius })}
              </Text>
            </View>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Icon name="people-outline" size={64} color={COLORS.TEXT.LIGHT} />
            <Text style={styles.emptyTitle}>{t('nearbyUsers.emptyState.title')}</Text>
            <Text style={styles.emptyDescription}>
              {t('nearbyUsers.emptyState.subtitle')}
            </Text>
          </View>
        }
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[COLORS.PRIMARY]}
            tintColor={COLORS.PRIMARY}
          />
        }
        showsVerticalScrollIndicator={false}
      />
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
  listContainer: {
    paddingBottom: SPACING.XL,
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
  radiusSelector: {
    backgroundColor: COLORS.SURFACE,
    margin: SPACING.MD,
    padding: SPACING.MD,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.BORDER,
  },
  radiusSelectorTitle: {
    fontSize: FONT_SIZES.MD,
    fontWeight: '600',
    color: COLORS.TEXT.PRIMARY,
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
    borderColor: COLORS.BORDER,
    alignItems: 'center',
  },
  radiusOptionSelected: {
    backgroundColor: COLORS.PRIMARY,
    borderColor: COLORS.PRIMARY,
  },
  radiusOptionText: {
    fontSize: FONT_SIZES.SM,
    color: COLORS.TEXT.SECONDARY,
    fontWeight: '500',
  },
  radiusOptionTextSelected: {
    color: COLORS.TEXT.WHITE,
    fontWeight: '600',
  },
  currentLocationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.SURFACE,
    margin: SPACING.MD,
    marginTop: 0,
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
  sectionHeader: {
    paddingHorizontal: SPACING.MD,
    paddingVertical: SPACING.SM,
  },
  sectionTitle: {
    fontSize: FONT_SIZES.LG,
    fontWeight: 'bold',
    color: COLORS.TEXT.PRIMARY,
  },
  sectionSubtitle: {
    fontSize: FONT_SIZES.SM,
    color: COLORS.TEXT.SECONDARY,
    marginTop: 2,
  },
  userCard: {
    backgroundColor: COLORS.SURFACE,
    marginHorizontal: SPACING.MD,
    marginBottom: SPACING.MD,
    borderRadius: 12,
    padding: SPACING.MD,
    borderWidth: 1,
    borderColor: COLORS.BORDER,
  },
  userHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  userAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.PRIMARY,
    alignItems: 'center',
    justifyContent: 'center',
  },
  userInfo: {
    flex: 1,
    marginLeft: SPACING.SM,
  },
  userNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  userName: {
    fontSize: FONT_SIZES.MD,
    fontWeight: '600',
    color: COLORS.TEXT.PRIMARY,
    marginRight: SPACING.SM,
  },
  userAge: {
    fontSize: FONT_SIZES.SM,
    color: COLORS.TEXT.SECONDARY,
    marginRight: SPACING.XS,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  distanceText: {
    fontSize: FONT_SIZES.SM,
    color: COLORS.TEXT.SECONDARY,
    marginLeft: 4,
    marginRight: SPACING.SM,
  },
  onlineStatus: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: SPACING.XS,
  },
  lastSeenText: {
    fontSize: FONT_SIZES.XS,
    color: COLORS.TEXT.LIGHT,
  },
  likeButton: {
    padding: SPACING.SM,
    borderRadius: 20,
    backgroundColor: COLORS.ERROR + '10',
  },
  userBio: {
    fontSize: FONT_SIZES.SM,
    color: COLORS.TEXT.SECONDARY,
    marginTop: SPACING.SM,
    lineHeight: 18,
  },
  commonGroups: {
    marginTop: SPACING.SM,
  },
  commonGroupsTitle: {
    fontSize: FONT_SIZES.XS,
    color: COLORS.TEXT.LIGHT,
    marginBottom: SPACING.XS,
  },
  groupTags: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  groupTag: {
    backgroundColor: COLORS.PRIMARY + '10',
    paddingHorizontal: SPACING.SM,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: SPACING.XS,
    marginBottom: 4,
  },
  groupTagText: {
    fontSize: FONT_SIZES.XS,
    color: COLORS.PRIMARY,
    fontWeight: '500',
  },
  moreGroups: {
    fontSize: FONT_SIZES.XS,
    color: COLORS.TEXT.LIGHT,
    fontWeight: '500',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: SPACING.XL * 2,
    paddingHorizontal: SPACING.LG,
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
    lineHeight: 20,
  },
});