import React, { useState, useEffect, useCallback, useRef } from 'react';
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
  Animated,
  PanResponder,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAndroidSafeTranslation } from '@/hooks/useAndroidSafeTranslation';
import Icon from 'react-native-vector-icons/Ionicons';
import * as Location from 'expo-location';
import { useTheme } from '@/hooks/useTheme';
import { useAuthStore } from '@/store/slices/authSlice';
import { useLikeStore } from '@/store/slices/likeSlice';
import { usePersonaStore } from '@/store/slices/personaSlice';
import { SubscriptionTier, SUBSCRIPTION_FEATURES } from '@/types/subscription';
import { PersonaSettingsModal } from '@/components/persona/PersonaSettingsModal';
import { locationTracker } from '@/services/locationTracker';
import { useChatStore } from '@/store/slices/chatSlice';
import { User, NearbyUser } from '@/types';
import { COLORS, SPACING, FONT_SIZES } from '@/utils/constants';
import { API_BASE_URL } from '@/services/api/config';

interface LocationData {
  latitude: number;
  longitude: number;
  address?: string;
}

// NearbyUser interface is now imported from shared/types

export const NearbyUsersScreen = React.memo(() => {
  const navigation = useNavigation();
  const { t } = useAndroidSafeTranslation('location');
  const { colors } = useTheme();
  const { user, getSubscriptionTier, getSubscriptionFeatures } = useAuthStore();
  const { sendLike, sentLikes, getRemainingFreeLikes } = useLikeStore();
  
  const subscriptionTier = getSubscriptionTier();
  const features = getSubscriptionFeatures();
  
  const [currentLocation, setCurrentLocation] = useState<LocationData | null>(null);
  const [nearbyUsers, setNearbyUsers] = useState<NearbyUser[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [locationPermissionGranted, setLocationPermissionGranted] = useState(false);
  const [selectedRadius, setSelectedRadius] = useState(2); // 기본 2km
  const [hiddenUsers, setHiddenUsers] = useState<Set<string>>(new Set());
  const [showPersonaModal, setShowPersonaModal] = useState(false);
  const [likedUsers, setLikedUsers] = useState<Set<string>>(new Set());

  const radiusOptions = [1, 2, 5, 10]; // km 단위
  
  const personaStore = usePersonaStore();
  const chatStore = useChatStore();

  useEffect(() => {
    requestLocationPermission();
    // 페르소나가 있으면 위치 추적 시작
    if (personaStore.myPersona && personaStore.locationSharingEnabled) {
      locationTracker.startTracking();
    }
  }, []);

  useEffect(() => {
    if (currentLocation) {
      loadNearbyUsers();
    }
  }, [currentLocation, selectedRadius]);

  const requestLocationPermission = useCallback(async () => {
    try {
      setIsLoading(true);
      
      // 웹 환경에서는 더미 데이터 사용
      if (Platform.OS === 'web') {
        console.log('[NearbyUsers] 웹 환경 감지 - 더미 데이터 사용');
        setLocationPermissionGranted(true);
        // 더미 위치 설정
        setCurrentLocation({
          latitude: 37.5665,
          longitude: 126.9780,
          address: '서울시 중구'
        });
        return;
      }
      
      let { status } = await Location.getForegroundPermissionsAsync();
      
      if (status !== 'granted') {
        const result = await Location.requestForegroundPermissionsAsync();
        status = result.status;
        
        if (status !== 'granted') {
          Alert.alert(
            t('common:permissions.requestTitle'),
            t('location:permissions.requestMessage'),
            [{ text: t('common:permissions.later'), style: 'cancel' }]
          );
          setIsLoading(false);
          return;
        }
      }

      setLocationPermissionGranted(true);
      await getCurrentLocation();
    } catch (error) {
      console.error('Location permission error:', error);
      // 에러 발생 시에도 더미 데이터 사용
      setLocationPermissionGranted(true);
      setCurrentLocation({
        latitude: 37.5665,
        longitude: 126.9780,
        address: '서울시 중구'
      });
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
      Alert.alert(t('common:errors.title'), t('location:permissions.locationError'));
    }
  };

  const loadNearbyUsers = useCallback(async () => {
    if (!currentLocation || !user) return;

    try {
      setIsLoading(true);

      // 페르소나 API 호출 시도
      try {
        await personaStore.fetchNearbyPersonas(
          currentLocation.latitude, 
          currentLocation.longitude, 
          selectedRadius
        );
        
        // 페르소나를 NearbyUser 형식으로 변환
        if (personaStore.nearbyPersonas.length > 0) {
          const nearbyUsersFromPersonas = personaStore.nearbyPersonas.map(np => ({
            id: np.userId,
            nickname: np.persona.nickname,
            age: np.persona.age,
            gender: 'UNKNOWN' as const,
            profileImage: undefined,
            isVerified: false,
            isPremium: false,
            latitude: currentLocation.latitude, // 실제 위치는 서버에서 제공해야 함
            longitude: currentLocation.longitude,
            lastSeen: new Date(np.lastActive).toLocaleTimeString('ko-KR'),
            isOnline: new Date(np.lastActive).getTime() > Date.now() - 5 * 60 * 1000,
            commonGroups: [],
            bio: np.persona.bio,
            phoneNumber: '',
            credits: 0,
            lastActive: new Date(np.lastActive),
            createdAt: new Date(np.persona.createdAt),
            updatedAt: new Date(np.persona.updatedAt),
            anonymousId: np.anonymousId,
            distance: np.distance,
          }));
          
          setNearbyUsers(nearbyUsersFromPersonas as NearbyUser[]);
          return;
        }
      } catch (apiError) {
        console.log('Persona API call failed, trying location API:', apiError);
        
        // 기존 location API 호출 시도
        try {
          const response = await fetch(
            `${API_BASE_URL}/location/nearby/users?latitude=${currentLocation.latitude}&longitude=${currentLocation.longitude}&radius=${selectedRadius}`,
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
              setNearbyUsers(data);
              return;
            }
          }
        } catch (locationApiError) {
          console.log('Location API call also failed:', locationApiError);
        }
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

      // API 실패 시 더미 데이터 사용 (다양한 거리의 사용자들)
      const allDummyUsers = [
        {
          id: 'user1',
          nickname: '카페러버',
          age: 25,
          gender: 'FEMALE' as const,
          profileImage: undefined,
          isVerified: true,
          isPremium: false,
          latitude: currentLocation.latitude + 0.001,
          longitude: currentLocation.longitude + 0.001,
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
          latitude: currentLocation.latitude - 0.003,
          longitude: currentLocation.longitude + 0.003,
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
          latitude: currentLocation.latitude + 0.008,
          longitude: currentLocation.longitude - 0.008,
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
        {
          id: 'user4',
          nickname: '요리왕',
          age: 30,
          gender: 'MALE' as const,
          profileImage: undefined,
          isVerified: true,
          isPremium: true,
          latitude: currentLocation.latitude + 0.015,
          longitude: currentLocation.longitude + 0.015,
          lastSeen: '30분 전',
          isOnline: false,
          commonGroups: ['요리 동호회'],
          bio: '맛있는 요리를 함께 나눠요 🍳',
          phoneNumber: '',
          credits: 20,
          lastActive: new Date(Date.now() - 30 * 60 * 1000),
          createdAt: new Date(),
          updatedAt: new Date(),
          anonymousId: 'anon_user4',
        },
        {
          id: 'user5',
          nickname: '영화광',
          age: 27,
          gender: 'FEMALE' as const,
          profileImage: undefined,
          isVerified: false,
          isPremium: false,
          latitude: currentLocation.latitude + 0.04,
          longitude: currentLocation.longitude - 0.04,
          lastSeen: '2시간 전',
          isOnline: false,
          commonGroups: ['영화 감상 모임'],
          bio: '함께 영화 보실 분 찾아요 🎬',
          phoneNumber: '',
          credits: 1,
          lastActive: new Date(Date.now() - 2 * 60 * 60 * 1000),
          createdAt: new Date(),
          updatedAt: new Date(),
          anonymousId: 'anon_user5',
        },
        {
          id: 'user6',
          nickname: '등산러',
          age: 35,
          gender: 'MALE' as const,
          profileImage: undefined,
          isVerified: true,
          isPremium: false,
          latitude: currentLocation.latitude - 0.08,
          longitude: currentLocation.longitude + 0.08,
          lastSeen: '3시간 전',
          isOnline: false,
          commonGroups: ['주말 등산 모임'],
          bio: '주말마다 산에 가요 ⛰️',
          phoneNumber: '',
          credits: 5,
          lastActive: new Date(Date.now() - 3 * 60 * 60 * 1000),
          createdAt: new Date(),
          updatedAt: new Date(),
          anonymousId: 'anon_user6',
        },
      ];

      // 각 사용자의 실제 거리 계산 및 필터링
      const usersWithDistance = allDummyUsers
        .filter(dummyUser => dummyUser.id !== user.id)
        .map(dummyUser => {
          const distance = calculateDistance(
            currentLocation.latitude,
            currentLocation.longitude,
            dummyUser.latitude!,
            dummyUser.longitude!
          );
          return {
            ...dummyUser,
            distance,
          };
        })
        .filter(dummyUser => dummyUser.distance <= selectedRadius * 1000) // km to meters
        .sort((a, b) => a.distance - b.distance); // 거리순 정렬

      setNearbyUsers(usersWithDistance as NearbyUser[]);
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
      await loadNearbyUsers();
    }
    setRefreshing(false);
  };

  const handleDeleteUser = (userId: string) => {
    Alert.alert(
      '사용자 숨기기',
      '이 사용자를 목록에서 숨기시겠습니까?',
      [
        { text: t('common:cancel'), style: 'cancel' },
        {
          text: '숨기기',
          style: 'destructive',
          onPress: () => {
            setHiddenUsers(prev => new Set(prev).add(userId));
            Alert.alert(t('common:success'), '사용자가 목록에서 숨겨졌습니다.');
          },
        },
      ]
    );
  };

  const handleToggleLike = async (targetUser: NearbyUser) => {
    if (!user) return;

    try {
      // 이미 좋아요를 보낸 사용자인지 확인
      const isLiked = likedUsers.has(targetUser.id);

      if (isLiked) {
        // 좋아요 취소
        Alert.alert(
          '좋아요 취소',
          `${targetUser.nickname}님에게 보낸 좋아요를 취소하시겠습니까?`,
          [
            { text: t('common:cancel'), style: 'cancel' },
            {
              text: '취소하기',
              style: 'destructive',
              onPress: async () => {
                try {
                  // TODO: API 호출로 좋아요 취소
                  setLikedUsers(prev => {
                    const newSet = new Set(prev);
                    newSet.delete(targetUser.id);
                    return newSet;
                  });
                  Alert.alert(t('common:success'), '좋아요가 취소되었습니다.');
                } catch (error) {
                  Alert.alert(t('common:errors.title'), '좋아요 취소에 실패했습니다.');
                }
              },
            },
          ]
        );
        return;
      }

      // 구독 티어별 좋아요 제한 확인
      const remainingLikes = getRemainingFreeLikes();
      
      if (remainingLikes <= 0) {
        let message = '';
        let upgradeText = '';
        
        if (subscriptionTier === SubscriptionTier.BASIC) {
          message = '오늘의 무료 좋아요(1개)를 모두 사용했습니다.\n고급 구독으로 하루 3개까지 좋아요를 보낼 수 있습니다!';
          upgradeText = '고급 구독하기';
        } else if (subscriptionTier === SubscriptionTier.ADVANCED) {
          message = '오늘의 좋아요(3개)를 모두 사용했습니다.\n프리미엄으로 업그레이드하여 무제한 좋아요를 즐기세요!';
          upgradeText = '프리미엄 업그레이드';
        }
        
        Alert.alert(
          '좋아요 제한',
          message,
          [
            { text: '확인', style: 'cancel' },
            { 
              text: upgradeText, 
              onPress: () => navigation.navigate('Premium' as never),
              style: 'default'
            },
          ]
        );
        return;
      }

      Alert.alert(
        t('nearbyusers:matching.sendLike'),
        t('matching:matching.sendLikeMessage', {
          nickname: targetUser.nickname,
          premium: user.isPremium ? t('nearbyusers:matching.premiumUnlimited') : t('nearbyusers:matching.creditCost')
        }),
        [
          { text: t('nearbyusers:matching.cancel'), style: 'cancel' },
          {
            text: t('nearbyusers:matching.send'),
            onPress: async () => {
              try {
                await sendLike(
                  targetUser.id,
                  targetUser.commonGroups[0] || 'location_group'
                );
                setLikedUsers(prev => new Set(prev).add(targetUser.id));
                Alert.alert(t('common:success'), t('nearbyusers:matching.success'));
              } catch (error) {
                Alert.alert(t('common:errors.title'), t('matching:errors.error'));
              }
            },
          },
        ]
      );
    } catch (error) {
      console.error('Send like error:', error);
      Alert.alert(t('common:errors.title'), t('matching:errors.error'));
    }
  };

  const handleStartChat = (targetUser: NearbyUser) => {
    Alert.alert(
      '채팅 시작',
      `${targetUser.nickname}님과 채팅을 시작하시겠습니까?`,
      [
        { text: t('common:cancel'), style: 'cancel' },
        {
          text: '채팅하기',
          onPress: async () => {
            try {
              // 채팅방 생성 또는 기존 채팅방으로 이동
              await chatStore.createOrGetChat(targetUser.id, targetUser.nickname);
              navigation.navigate('Chat' as never, { userId: targetUser.id, userName: targetUser.nickname } as never);
            } catch (error) {
              Alert.alert(t('common:errors.title'), '채팅을 시작할 수 없습니다.');
            }
          },
        },
      ]
    );
  };

  const SwipeableUserCard = ({ item }: { item: NearbyUser }) => {
    const translateX = useRef(new Animated.Value(0)).current;
    const opacity = useRef(new Animated.Value(1)).current;

    const panResponder = useRef(
      PanResponder.create({
        onMoveShouldSetPanResponder: (_, gestureState) => Math.abs(gestureState.dx) > 20,
        onPanResponderMove: (_, gestureState) => {
          translateX.setValue(gestureState.dx);
          opacity.setValue(1 - Math.abs(gestureState.dx) / 300);
        },
        onPanResponderRelease: (_, gestureState) => {
          if (Math.abs(gestureState.dx) > 120) {
            // 스와이프로 삭제
            Animated.parallel([
              Animated.timing(translateX, {
                toValue: gestureState.dx > 0 ? 500 : -500,
                duration: 200,
                useNativeDriver: true,
              }),
              Animated.timing(opacity, {
                toValue: 0,
                duration: 200,
                useNativeDriver: true,
              }),
            ]).start(() => {
              handleDeleteUser(item.id);
            });
          } else {
            // 원위치로 복귀
            Animated.parallel([
              Animated.spring(translateX, {
                toValue: 0,
                useNativeDriver: true,
              }),
              Animated.spring(opacity, {
                toValue: 1,
                useNativeDriver: true,
              }),
            ]).start();
          }
        },
      })
    ).current;

    if (hiddenUsers.has(item.id)) {
      return null;
    }

    return (
      <Animated.View
        style={[{
          transform: [{ translateX }],
          opacity,
        }]}
        {...panResponder.panHandlers}
      >
        <TouchableOpacity style={[styles.userCard, { backgroundColor: colors.SURFACE, borderColor: colors.BORDER }]}>
          <View style={styles.userHeader}>
            <View style={[styles.userAvatar, { backgroundColor: colors.PRIMARY }]}>
              <Icon 
                name="person" 
                size={24} 
                color={colors.TEXT.WHITE} 
              />
            </View>
            
            <View style={styles.userInfo}>
              <View style={styles.userNameRow}>
                <Text style={[styles.userName, { color: colors.TEXT.PRIMARY }]}>{item.nickname}</Text>
                <Text style={[styles.userAge, { color: colors.TEXT.SECONDARY }]}>{item.age || 25}{t('nearbyusers:nearbyUsers.ageUnit')}</Text>
                {item.isVerified && (
                  <Icon name="checkmark-circle" size={16} color={colors.SUCCESS} />
                )}
                {item.isPremium && (
                  <Icon name="diamond" size={14} color={colors.WARNING} />
                )}
              </View>
              
              <View style={styles.locationRow}>
                <Icon name="location-outline" size={14} color={colors.TEXT.SECONDARY} />
                <Text style={[styles.distanceText, { color: colors.TEXT.SECONDARY }]}>
                  {item.distance < 1000 
                    ? `${Math.round(item.distance)}m` 
                    : `${(item.distance / 1000).toFixed(1)}km`
                  }
                </Text>
                <View style={[
                  styles.onlineStatus, 
                  { backgroundColor: item.isOnline ? colors.SUCCESS : colors.TEXT.LIGHT }
                ]} />
                <Text style={[styles.lastSeenText, { color: colors.TEXT.LIGHT }]}>{item.lastSeen}</Text>
              </View>
            </View>

            <View style={styles.cardActions}>
              <TouchableOpacity
                style={[styles.deleteButton, { backgroundColor: colors.TEXT.LIGHT + '20' }]}
                onPress={() => handleDeleteUser(item.id)}
              >
                <Icon name="close" size={18} color={colors.TEXT.SECONDARY} />
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.likeButton,
                  { backgroundColor: likedUsers.has(item.id) ? colors.ERROR : colors.ERROR + '10' }
                ]}
                onPress={() => handleToggleLike(item)}
              >
                <Icon
                  name={likedUsers.has(item.id) ? "heart" : "heart-outline"}
                  size={20}
                  color={colors.ERROR}
                />
              </TouchableOpacity>
            </View>
          </View>

          {item.bio && (
            <Text style={[styles.userBio, { color: colors.TEXT.SECONDARY }]}>{item.bio}</Text>
          )}

          {item.commonGroups.length > 0 && (
            <View style={styles.commonGroups}>
              <Text style={[styles.commonGroupsTitle, { color: colors.TEXT.LIGHT }]}>{t('nearbyusers:nearbyUsers.commonGroups')}</Text>
              <View style={styles.groupTags}>
                {item.commonGroups.slice(0, 2).map((group, index) => (
                  <View key={index} style={[styles.groupTag, { backgroundColor: colors.PRIMARY + '10' }]}>
                    <Text style={[styles.groupTagText, { color: colors.PRIMARY }]}>{group}</Text>
                  </View>
                ))}
                {item.commonGroups.length > 2 && (
                  <Text style={[styles.moreGroups, { color: colors.TEXT.LIGHT }]}>{t('nearbyUsers:nearbyUsers.moreGroups', { count: item.commonGroups.length - 2 })}</Text>
                )}
              </View>
            </View>
          )}
          
          {/* 채팅하기 버튼 - 카드 하단에 배치 */}
          <TouchableOpacity
            style={[styles.chatActionButton, { backgroundColor: colors.PRIMARY }]}
            onPress={() => handleStartChat(item)}
          >
            <Icon name="chatbubble-outline" size={16} color="white" />
            <Text style={styles.chatActionButtonText}>채팅하기</Text>
          </TouchableOpacity>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  const renderNearbyUser = ({ item }: { item: NearbyUser }) => (
    <SwipeableUserCard item={item} />
  );

  const filteredUsers = nearbyUsers.filter(user => !hiddenUsers.has(user.id));

  const renderSwipeHint = () => (
    <View style={[styles.swipeHint, { backgroundColor: colors.INFO + '10' }]}>
      <Icon name="swap-horizontal" size={16} color={colors.INFO} />
      <Text style={[styles.swipeHintText, { color: colors.INFO }]}>
        좌우로 스와이프하여 카드를 숨길 수 있습니다
      </Text>
    </View>
  );

  const renderRadiusSelector = () => (
    <View style={[styles.radiusSelector, { backgroundColor: colors.SURFACE, borderColor: colors.BORDER }]}>
      <Text style={[styles.radiusSelectorTitle, { color: colors.TEXT.PRIMARY }]}>{t('nearbyusers:nearbyUsers.searchRadius')}</Text>
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

  if (isLoading && !nearbyUsers.length) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.BACKGROUND }]}>
        <View style={[styles.header, { backgroundColor: colors.SURFACE, borderBottomColor: colors.BORDER }]}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Icon name="arrow-back" size={24} color={colors.TEXT.PRIMARY} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.TEXT.PRIMARY }]}>{t('nearbyusers:nearbyUsers.title')}</Text>
          <View style={styles.headerRight} />
        </View>
        
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.PRIMARY} />
          <Text style={[styles.loadingText, { color: colors.TEXT.SECONDARY }]}>{t('nearbyusers:nearbyUsers.loading')}</Text>
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
          <Text style={[styles.headerTitle, { color: colors.TEXT.PRIMARY }]}>{t('nearbyusers:nearbyUsers.title')}</Text>
          <View style={styles.headerRight} />
        </View>
        
        <View style={styles.permissionContainer}>
          <Icon name="people-outline" size={64} color={colors.TEXT.LIGHT} />
          <Text style={[styles.permissionTitle, { color: colors.TEXT.PRIMARY }]}>{t('common:permissions.required')}</Text>
          <Text style={[styles.permissionDescription, { color: colors.TEXT.SECONDARY }]}>
            {t('common:permissions.description')}
          </Text>
          <TouchableOpacity
            style={[styles.permissionButton, { backgroundColor: colors.PRIMARY }]}
            onPress={requestLocationPermission}
          >
            <Text style={[styles.permissionButtonText, { color: colors.TEXT.WHITE }]}>{t('common:permissions.requestButton')}</Text>
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
        <Text style={[styles.headerTitle, { color: colors.TEXT.PRIMARY }]}>{t('nearbyusers:nearbyUsers.title')}</Text>
        <TouchableOpacity
          style={styles.refreshButton}
          onPress={handleRefresh}
        >
          <Icon name="refresh" size={20} color={colors.TEXT.SECONDARY} />
        </TouchableOpacity>
      </View>

      {/* 좋아요 제한 표시 */}
      <View style={[styles.likeStatusBar, { backgroundColor: colors.SURFACE }]}>
        <View style={styles.likeStatusContent}>
          <Icon 
            name={
              subscriptionTier === SubscriptionTier.PREMIUM ? "heart" :
              subscriptionTier === SubscriptionTier.ADVANCED ? "heart-outline" :
              "heart-dislike-outline"
            } 
            size={20} 
            color={
              subscriptionTier === SubscriptionTier.PREMIUM ? colors.SUCCESS :
              subscriptionTier === SubscriptionTier.ADVANCED ? colors.PRIMARY :
              colors.TEXT.SECONDARY
            } 
          />
          <Text style={[styles.likeStatusText, { color: colors.TEXT.PRIMARY }]}>
            {subscriptionTier === SubscriptionTier.PREMIUM 
              ? '무제한 좋아요' 
              : `오늘 남은 좋아요: ${getRemainingFreeLikes()}개`}
          </Text>
          {subscriptionTier !== SubscriptionTier.PREMIUM && (
            <TouchableOpacity
              onPress={() => navigation.navigate('Premium' as never)}
              style={[styles.upgradeChip, { backgroundColor: colors.PRIMARY + '20' }]}
            >
              <Text style={[styles.upgradeChipText, { color: colors.PRIMARY }]}>
                {subscriptionTier === SubscriptionTier.BASIC ? '업그레이드' : '프리미엄'}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* 페르소나 설정 버튼 */}
      <TouchableOpacity
        style={[styles.personaButton, { backgroundColor: colors.PRIMARY + '10', borderColor: colors.PRIMARY }]}
        onPress={() => setShowPersonaModal(true)}
      >
        <Icon name="person-add-outline" size={20} color={colors.PRIMARY} />
        <Text style={[styles.personaButtonText, { color: colors.PRIMARY }]}>
          {personaStore.myPersona ? '내 페르소나 수정하기' : '내 페르소나 설정하기'}
        </Text>
        <Icon name="chevron-forward" size={16} color={colors.PRIMARY} />
      </TouchableOpacity>

      <FlatList
        data={filteredUsers}
        renderItem={renderNearbyUser}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        ListHeaderComponent={
          <View>
            {renderRadiusSelector()}
            
            {currentLocation && (
              <View style={[styles.currentLocationCard, { backgroundColor: colors.SURFACE, borderColor: colors.PRIMARY + '20' }]}>
                <Icon name="location" size={20} color={colors.PRIMARY} />
                <View style={styles.currentLocationInfo}>
                  <Text style={[styles.currentLocationTitle, { color: colors.TEXT.PRIMARY }]}>{t('nearbyusers:nearbyUsers.currentLocation')}</Text>
                  <Text style={[styles.currentLocationAddress, { color: colors.TEXT.SECONDARY }]}>
                    {currentLocation.address || t('nearbyusers:nearbyUsers.loadingLocation')}
                  </Text>
                </View>
              </View>
            )}

            {/* 내 페르소나 카드 표시 */}
            {personaStore.myPersona && (
              <View style={[styles.myPersonaCard, { backgroundColor: colors.PRIMARY + '10', borderColor: colors.PRIMARY }]}>
                <View style={styles.myPersonaHeader}>
                  <Icon name="person-circle" size={24} color={colors.PRIMARY} />
                  <Text style={[styles.myPersonaTitle, { color: colors.PRIMARY }]}>내 페르소나</Text>
                  <TouchableOpacity onPress={() => setShowPersonaModal(true)}>
                    <Icon name="create-outline" size={20} color={colors.PRIMARY} />
                  </TouchableOpacity>
                </View>
                <View style={styles.myPersonaContent}>
                  <Text style={[styles.myPersonaNickname, { color: colors.TEXT.PRIMARY }]}>
                    {personaStore.myPersona.nickname}
                  </Text>
                  {personaStore.myPersona.age && (
                    <Text style={[styles.myPersonaInfo, { color: colors.TEXT.SECONDARY }]}>
                      {personaStore.myPersona.age}세
                    </Text>
                  )}
                  {personaStore.myPersona.bio && (
                    <Text style={[styles.myPersonaBio, { color: colors.TEXT.SECONDARY }]}>
                      {personaStore.myPersona.bio}
                    </Text>
                  )}
                  <View style={styles.myPersonaTags}>
                    {personaStore.myPersona.interests?.map((interest, index) => (
                      <View key={index} style={[styles.interestTag, { backgroundColor: colors.SURFACE }]}>
                        <Text style={[styles.interestTagText, { color: colors.PRIMARY }]}>{interest}</Text>
                      </View>
                    ))}
                  </View>
                  <View style={styles.locationSharingStatus}>
                    <Icon 
                      name={personaStore.locationSharingEnabled ? "location" : "location-outline"} 
                      size={16} 
                      color={personaStore.locationSharingEnabled ? colors.SUCCESS : colors.TEXT.LIGHT} 
                    />
                    <Text style={[styles.locationSharingText, { 
                      color: personaStore.locationSharingEnabled ? colors.SUCCESS : colors.TEXT.LIGHT 
                    }]}>
                      {personaStore.locationSharingEnabled ? '위치 공유 중' : '위치 공유 안함'}
                    </Text>
                  </View>
                </View>
              </View>
            )}

            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: colors.TEXT.PRIMARY }]}>
                {t('nearbyusers:nearbyUsers.userCount', { count: filteredUsers.length })}
              </Text>
              <Text style={[styles.sectionSubtitle, { color: colors.TEXT.SECONDARY }]}>
                {t('nearbyusers:nearbyUsers.radiusDistance', { radius: selectedRadius })}
              </Text>
            </View>
            {filteredUsers.length > 0 && renderSwipeHint()}
          </View>
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Icon name="people-outline" size={64} color={colors.TEXT.LIGHT} />
            <Text style={[styles.emptyTitle, { color: colors.TEXT.PRIMARY }]}>{t('nearbyusers:nearbyUsers.emptyState.title')}</Text>
            <Text style={[styles.emptyDescription, { color: colors.TEXT.SECONDARY }]}>
              {t('nearbyusers:nearbyUsers.emptyState.subtitle')}
            </Text>
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
      
      {/* 페르소나 설정 모달 */}
      <PersonaSettingsModal
        visible={showPersonaModal}
        onClose={() => setShowPersonaModal(false)}
      />
    </SafeAreaView>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  personaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: SPACING.MD,
    marginVertical: SPACING.SM,
    paddingHorizontal: SPACING.MD,
    paddingVertical: SPACING.SM,
    borderRadius: 12,
    borderWidth: 1,
  },
  personaButtonText: {
    flex: 1,
    marginLeft: SPACING.SM,
    fontSize: FONT_SIZES.MD,
    fontWeight: '500',
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
  radiusOptionSelected: {
  },
  radiusOptionText: {
    fontSize: FONT_SIZES.SM,
    fontWeight: '500',
  },
  radiusOptionTextSelected: {
    fontWeight: '600',
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
  userCard: {
    marginHorizontal: SPACING.MD,
    marginBottom: SPACING.MD,
    borderRadius: 12,
    padding: SPACING.MD,
    borderWidth: 1,
  },
  userHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  userAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
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
    marginRight: SPACING.SM,
  },
  userAge: {
    fontSize: FONT_SIZES.SM,
    marginRight: SPACING.XS,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  distanceText: {
    fontSize: FONT_SIZES.SM,
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
  },
  cardActions: {
    flexDirection: 'column',
    gap: SPACING.XS,
  },
  deleteButton: {
    padding: SPACING.XS,
    borderRadius: 16,
  },
  likeButton: {
    padding: SPACING.SM,
    borderRadius: 20,
  },
  chatActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.SM,
    paddingHorizontal: SPACING.MD,
    borderRadius: 8,
    marginTop: SPACING.SM,
    gap: SPACING.XS,
  },
  chatActionButtonText: {
    color: 'white',
    fontSize: FONT_SIZES.SM,
    fontWeight: '600',
  },
  swipeHint: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: SPACING.MD,
    marginBottom: SPACING.SM,
    paddingHorizontal: SPACING.SM,
    paddingVertical: SPACING.XS,
    borderRadius: 8,
  },
  swipeHintText: {
    fontSize: FONT_SIZES.XS,
    marginLeft: SPACING.XS,
  },
  userBio: {
    fontSize: FONT_SIZES.SM,
    marginTop: SPACING.SM,
    lineHeight: 18,
  },
  commonGroups: {
    marginTop: SPACING.SM,
  },
  commonGroupsTitle: {
    fontSize: FONT_SIZES.XS,
    marginBottom: SPACING.XS,
  },
  groupTags: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  groupTag: {
    paddingHorizontal: SPACING.SM,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: SPACING.XS,
    marginBottom: 4,
  },
  groupTagText: {
    fontSize: FONT_SIZES.XS,
    fontWeight: '500',
  },
  moreGroups: {
    fontSize: FONT_SIZES.XS,
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
    marginTop: SPACING.MD,
    marginBottom: SPACING.SM,
  },
  emptyDescription: {
    fontSize: FONT_SIZES.SM,
    textAlign: 'center',
    lineHeight: 20,
  },
  myPersonaCard: {
    margin: SPACING.MD,
    padding: SPACING.MD,
    borderRadius: 16,
    borderWidth: 1,
  },
  myPersonaHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.MD,
  },
  myPersonaTitle: {
    flex: 1,
    fontSize: FONT_SIZES.MD,
    fontWeight: '600',
    marginLeft: SPACING.SM,
  },
  myPersonaContent: {
    gap: SPACING.SM,
  },
  myPersonaNickname: {
    fontSize: FONT_SIZES.LG,
    fontWeight: 'bold',
  },
  myPersonaInfo: {
    fontSize: FONT_SIZES.MD,
  },
  myPersonaBio: {
    fontSize: FONT_SIZES.SM,
    lineHeight: 20,
  },
  myPersonaTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.XS,
    marginTop: SPACING.XS,
  },
  interestTag: {
    paddingHorizontal: SPACING.SM,
    paddingVertical: SPACING.XS,
    borderRadius: 12,
  },
  interestTagText: {
    fontSize: FONT_SIZES.XS,
    fontWeight: '500',
  },
  locationSharingStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.XS,
    marginTop: SPACING.SM,
  },
  locationSharingText: {
    fontSize: FONT_SIZES.SM,
  },
});