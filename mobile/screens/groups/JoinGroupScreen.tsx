/**
 * 그룹 참여 화면
 *
 * @screen
 * @description 초대 코드 입력 또는 그룹 검색을 통해 그룹에 참여하는 화면
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  SafeAreaView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  TextInput,
  FlatList,
  ScrollView,
  Animated,
  Platform,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useAndroidSafeTranslation } from '@/hooks/useAndroidSafeTranslation';
import { IconWrapper as Icon } from '@/components/IconWrapper';
import { useTheme } from '@/hooks/useTheme';
import { groupApi } from '@/services/api/groupApi';
import { useGroupStore } from '@/store/slices/groupSlice';
import { Group, GroupType } from '@/types';
import { LinearGradient } from 'expo-linear-gradient';

interface GroupInfo {
  id: string;
  name: string;
  type: string;
  description?: string;
  memberCount?: number;
}

const CATEGORIES = [
  { id: 'all', name: '전체', icon: 'apps-outline', gradient: ['#667eea', '#764ba2'] },
  { id: GroupType.OFFICIAL, name: '공식', icon: 'business-outline', gradient: ['#f093fb', '#f5576c'] },
  { id: GroupType.CREATED, name: '일반', icon: 'people-outline', gradient: ['#4facfe', '#00f2fe'] },
  { id: GroupType.LOCATION, name: '장소', icon: 'location-outline', gradient: ['#43e97b', '#38f9d7'] },
  { id: 'hobby', name: '취미', icon: 'heart-outline', gradient: ['#fa709a', '#fee140'] },
  { id: 'study', name: '스터디', icon: 'school-outline', gradient: ['#30cfd0', '#330867'] },
  { id: 'sports', name: '운동', icon: 'fitness-outline', gradient: ['#a8edea', '#fed6e3'] },
];

/**
 * 그룹 참여 화면 컴포넌트
 *
 * @component
 * @returns {JSX.Element}
 *
 * @description
 * 초대 코드 또는 검색을 통해 그룹에 참여하는 화면
 * - 초대 코드 입력 및 즉시 참여
 * - 카테고리별 그룹 검색 (전체, 공식, 일반, 장소, 취미, 스터디, 운동)
 * - 그룹 이름/설명 검색
 * - 인기 그룹 목록 표시
 * - 검색 결과 목록
 * - 부드러운 애니메이션 효과
 * - 그룹 상세로 이동
 *
 * @navigation
 * - From: 그룹 목록 화면의 참여 버튼, 초대 링크
 * - To: 그룹 상세 화면
 *
 * @example
 * ```tsx
 * // 초대 코드와 함께 호출
 * navigation.navigate('JoinGroup', {
 *   inviteCode: 'ABC123'
 * });
 *
 * // 검색 모드로 호출
 * navigation.navigate('JoinGroup');
 * ```
 */
export const JoinGroupScreen = () => {
  const { t } = useAndroidSafeTranslation('group');
  const navigation = useNavigation<any>();
  const route = useRoute();
  const { inviteCode: initialCode } = route.params as { inviteCode: string };
  
  const groupStore = useGroupStore();
  const { colors, isDark } = useTheme();
  const [isLoading, setIsLoading] = useState(false);
  const [groupInfo, setGroupInfo] = useState<GroupInfo | null>(null);
  const [isJoining, setIsJoining] = useState(false);
  const [inviteCode, setInviteCode] = useState(initialCode || '');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [popularGroups, setPopularGroups] = useState<Group[]>([]);
  const [searchResults, setSearchResults] = useState<Group[]>([]);
  const [hasSearched, setHasSearched] = useState(false);

  // 애니메이션 값들
  const fadeAnim = useState(new Animated.Value(0))[0];
  const slideAnim = useState(new Animated.Value(30))[0];
  const pulseAnim = useState(new Animated.Value(1))[0];

  useEffect(() => {
    loadPopularGroups();
    // 진입 애니메이션
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 50,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();

    // 하트 펄스 애니메이션
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const loadPopularGroups = async () => {
    try {
      const sampleGroups = groupStore.groups.slice(0, 5);
      setPopularGroups(sampleGroups);
    } catch (error) {
      console.error('Failed to load popular groups:', error);
    }
  };

  const handleSearch = () => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      setHasSearched(false);
      return;
    }
    
    const filtered = groupStore.groups.filter(group => {
      const matchesQuery = group.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          group.description?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === 'all' || group.type === selectedCategory;
      return matchesQuery && matchesCategory;
    });
    
    setSearchResults(filtered);
    setHasSearched(true);
  };

  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
    if (searchQuery) {
      handleSearch();
    }
  };

  const handleJoinGroupByCode = async () => {
    if (!inviteCode.trim()) {
      Alert.alert('오류', '초대 코드를 입력해주세요');
      return;
    }
    
    setIsJoining(true);
    try {
      const result = await groupApi.joinGroupByInvite(inviteCode);

      const group = await groupApi.getGroupById(result.group.id);
      groupStore.joinGroup(group.id);

      Alert.alert(
        '성공',
        `${result.group.name} 그룹에 참여했습니다!`,
        [
          {
            text: '확인',
            onPress: () => navigation.navigate('GroupDetail' as never, { groupId: result.group.id } as never),
          },
        ]
      );
    } catch (error: any) {
      console.error('Join group error:', error);
      Alert.alert('오류', '유효하지 않은 초대 코드입니다');
    } finally {
      setIsJoining(false);
    }
  };

  const handleGroupPress = (group: Group) => {
    navigation.navigate('GroupDetail' as never, { groupId: group.id } as never);
  };

  const renderGroupItem = ({ item, index }: { item: Group; index: number }) => (
    <Animated.View
      style={{
        opacity: fadeAnim,
        transform: [
          { translateY: Animated.multiply(slideAnim, (index + 1) * 0.1) },
        ],
      }}
    >
      <TouchableOpacity 
        className="mb-3"
        onPress={() => handleGroupPress(item)}
      >
        <LinearGradient
          colors={isDark ? ['#1F2937', '#111827'] : ['#FFFFFF', '#F9FAFB']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          className="rounded-2xl p-4 border border-gray-200 dark:border-gray-700"
        >
          <View className="flex-row items-center">
            <View className="w-12 h-12 rounded-full bg-gradient-to-br from-pink-500 to-purple-500 items-center justify-center mr-3">
              <Text className="text-2xl">
                {item.type === GroupType.OFFICIAL ? '🏢' : 
                 item.type === GroupType.LOCATION ? '📍' : '💕'}
              </Text>
            </View>
            <View className="flex-1">
              <Text className="font-bold text-gray-900 dark:text-white text-base">
                {item.name}
              </Text>
              <View className="flex-row items-center mt-1">
                <Icon name="people" size={14} color={colors.TEXT.SECONDARY} />
                <Text className="ml-1 text-xs text-gray-500 dark:text-gray-400">
                  {item.memberCount}명 참여중
                </Text>
                <View className="ml-3 bg-pink-100 dark:bg-pink-900/30 px-2 py-0.5 rounded-full">
                  <Text className="text-xs text-pink-600 dark:text-pink-400">
                    활발함
                  </Text>
                </View>
              </View>
            </View>
            <Icon name="chevron-forward" size={20} color={colors.TEXT.TERTIARY} />
          </View>
          {item.description && (
            <Text className="mt-3 text-sm text-gray-600 dark:text-gray-300" numberOfLines={2}>
              {item.description}
            </Text>
          )}
        </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
  );

  return (
    <SafeAreaView className="flex-1 bg-gradient-to-b from-pink-50 to-purple-50 dark:from-gray-900 dark:to-gray-800">
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* 헤더 */}
        <View className="flex-row items-center justify-between px-5 py-4">
          <TouchableOpacity onPress={() => navigation.goBack()} className="p-2">
            <Icon name="arrow-back" size={24} color={isDark ? '#FFFFFF' : '#000000'} />
          </TouchableOpacity>
          <Text className="text-xl font-bold text-gray-900 dark:text-white">그룹 찾기</Text>
          <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
            <Text className="text-2xl">💝</Text>
          </Animated.View>
        </View>

        <Animated.View 
          style={{
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }]
          }}
        >
          {/* 초대 코드 섹션 */}
          <View className="mx-5 mb-4">
            <LinearGradient
              colors={['#FF6B6B', '#FF8A8A']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              className="rounded-2xl p-5"
            >
              <Text className="text-white font-bold text-lg mb-3">초대 코드로 참여</Text>
              <View className="flex-row space-x-2">
                <TextInput
                  className="flex-1 bg-white/90 rounded-xl px-4 py-3 text-gray-900 font-semibold"
                  placeholder="초대 코드 입력"
                  placeholderTextColor="#9CA3AF"
                  value={inviteCode}
                  onChangeText={setInviteCode}
                  autoCapitalize="characters"
                />
                <TouchableOpacity
                  className="bg-white rounded-xl px-6 justify-center"
                  onPress={handleJoinGroupByCode}
                  disabled={isJoining}
                >
                  {isJoining ? (
                    <ActivityIndicator color="#FF6B6B" size="small" />
                  ) : (
                    <Text className="text-pink-500 font-bold">참여</Text>
                  )}
                </TouchableOpacity>
              </View>
            </LinearGradient>
          </View>

          {/* 검색 섹션 */}
          <View className="bg-white dark:bg-gray-800 rounded-t-3xl px-5 pt-6 pb-4">
            <Text className="text-lg font-bold text-gray-900 dark:text-white mb-4">그룹 검색</Text>
            
            {/* 카테고리 */}
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              className="mb-4"
            >
              <View className="flex-row space-x-2">
                {CATEGORIES.map(category => (
                  <TouchableOpacity
                    key={category.id}
                    onPress={() => handleCategoryChange(category.id)}
                    className="mr-2"
                  >
                    <LinearGradient
                      colors={(selectedCategory === category.id ? category.gradient : ['#F3F4F6', '#E5E7EB']) as any}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      className="flex-row items-center px-4 py-2 rounded-full"
                    >
                      <Icon 
                        name={category.icon} 
                        size={16} 
                        color={selectedCategory === category.id ? '#FFFFFF' : '#6B7280'} 
                      />
                      <Text className={`ml-2 font-semibold ${
                        selectedCategory === category.id ? 'text-white' : 'text-gray-600'
                      }`}>
                        {category.name}
                      </Text>
                    </LinearGradient>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>

            {/* 검색 입력 */}
            <View className="flex-row space-x-2">
              <View className="flex-1 flex-row items-center bg-gray-100 dark:bg-gray-700 rounded-xl px-4">
                <Icon name="search" size={20} color={colors.TEXT.SECONDARY} />
                <TextInput
                  className="flex-1 ml-2 py-3 text-gray-900 dark:text-white"
                  placeholder="그룹 이름 또는 설명 검색"
                  placeholderTextColor={colors.TEXT.SECONDARY}
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  onSubmitEditing={handleSearch}
                />
              </View>
              <TouchableOpacity
                className="bg-purple-500 px-6 rounded-xl justify-center"
                onPress={handleSearch}
              >
                <Text className="text-white font-bold">검색</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* 검색 결과 */}
          {hasSearched && (
            <View className="bg-white dark:bg-gray-800 px-5 py-4">
              <Text className="text-lg font-bold text-gray-900 dark:text-white mb-4">
                검색 결과 {searchResults.length > 0 && `(${searchResults.length})`}
              </Text>
              {searchResults.length > 0 ? (
                <FlatList
                  data={searchResults}
                  renderItem={renderGroupItem}
                  keyExtractor={item => item.id}
                  scrollEnabled={false}
                />
              ) : (
                <View className="items-center py-12">
                  <Icon name="search-outline" size={48} color={colors.TEXT.TERTIARY} />
                  <Text className="mt-4 text-lg font-semibold text-gray-900 dark:text-white">
                    검색 결과가 없습니다
                  </Text>
                  <Text className="mt-2 text-sm text-gray-500 dark:text-gray-400 text-center">
                    '{searchQuery}'에 대한 그룹을 찾을 수 없습니다.{'\n'}
                    다른 키워드로 검색해보세요.
                  </Text>
                </View>
              )}
            </View>
          )}

          {/* 인기 그룹 */}
          <View className="bg-white dark:bg-gray-800 px-5 py-4 mt-4 rounded-t-3xl">
            <View className="flex-row items-center justify-between mb-4">
              <Text className="text-lg font-bold text-gray-900 dark:text-white">
                인기 그룹
              </Text>
              <View className="flex-row items-center">
                <Text className="text-2xl mr-1">🔥</Text>
                <Text className="text-xs text-gray-500 dark:text-gray-400">실시간</Text>
              </View>
            </View>
            {popularGroups.length > 0 ? (
              <FlatList
                data={popularGroups}
                renderItem={renderGroupItem}
                keyExtractor={item => item.id}
                scrollEnabled={false}
              />
            ) : (
              <View className="items-center py-8">
                <ActivityIndicator size="large" color="#FF6B6B" />
                <Text className="mt-3 text-gray-500 dark:text-gray-400">
                  인기 그룹을 불러오는 중...
                </Text>
              </View>
            )}
          </View>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
};