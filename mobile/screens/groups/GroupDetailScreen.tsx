/**
 * 그룹 상세 정보 화면
 *
 * @screen
 * @description 선택한 그룹의 상세 정보를 표시하고, 참여/탈퇴, 채팅, 초대 기능을 제공하는 화면
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Share,
  Modal,
  Platform,
  Animated,
} from 'react-native';
import { showAlert } from '@/utils/webAlert';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { IconWrapper as Icon } from '@/components/IconWrapper';
import { useTheme } from '@/hooks/useTheme';
import { useGroupStore } from '@/store/slices/groupSlice';
import { useAndroidSafeTranslation } from '@/hooks/useAndroidSafeTranslation';
import { LinearGradient } from 'expo-linear-gradient';
import { ServerConnectionError } from '@/components/ServerConnectionError';
import { apiClient } from '@/services/api/config';

interface GroupDetailScreenProps {
  route: {
    params: {
      groupId: string;
    };
  };
}

/**
 * 그룹 상세 화면 컴포넌트
 *
 * @component
 * @param {GroupDetailScreenProps} props - 컴포넌트 props
 * @returns {JSX.Element}
 *
 * @description
 * 그룹의 상세 정보를 표시하는 화면
 * - 그룹 커버 이미지 및 기본 정보
 * - 참여/탈퇴 버튼 (상태에 따라)
 * - 그룹 채팅방 입장 (참여자만)
 * - 초대 코드 생성 및 공유 (참여자만)
 * - 활성 멤버 목록 표시
 * - 최근 게시물 목록
 * - 부드러운 애니메이션 효과
 *
 * @navigation
 * - From: 그룹 목록, 검색 결과, 알림
 * - To: 그룹 채팅방, 공유 화면
 *
 * @example
 * ```tsx
 * navigation.navigate('GroupDetail', {
 *   groupId: 'group-123'
 * });
 * ```
 */
export const GroupDetailScreen: React.FC<GroupDetailScreenProps> = ({ route }) => {
  const navigation = useNavigation<any>();
  const { colors, isDark } = useTheme();
  const { t } = useAndroidSafeTranslation('group');
  const { groupId } = route.params;
  const { groups, joinGroup, leaveGroup, getOrCreateInviteCode, isUserInGroup } = useGroupStore();
  
  const [group, setGroup] = useState<any>(null);
  const [isJoined, setIsJoined] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteCode, setInviteCode] = useState<string>('');
  const [serverConnectionError, setServerConnectionError] = useState(false);

  // 애니메이션 값
  const fadeAnim = useState(new Animated.Value(0))[0];
  const slideAnim = useState(new Animated.Value(50))[0];
  const scaleAnim = useState(new Animated.Value(0.9))[0];

  useEffect(() => {
    loadGroupDetail();
  }, [groupId]);

  useEffect(() => {
    // 그룹 정보 로드 시 애니메이션
    if (group) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.spring(slideAnim, {
          toValue: 0,
          tension: 50,
          friction: 8,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 50,
          friction: 8,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [group]);

  const loadGroupDetail = async () => {
    setLoading(true);
    setServerConnectionError(false);
    try {
      const response = await apiClient.get<any>(`/groups/${groupId}`);
      
      if (response.success && response.data) {
        setGroup(response.data);
        setIsJoined(response.data.isJoined || false);
      } else {
        setGroup(null);
        setServerConnectionError(true);
      }
    } catch (error) {
      console.error('Failed to load group detail:', error);
      setGroup(null);
      setServerConnectionError(true);
    } finally {
      setLoading(false);
    }
  };

  const handleJoinLeave = async () => {
    if (isJoined) {
      showAlert(
        t('detail.alerts.leaveConfirm.title'),
        t('detail.alerts.leaveConfirm.message'),
        [
          { text: t('detail.alerts.leaveConfirm.cancel'), style: 'cancel' },
          {
            text: t('detail.alerts.leaveConfirm.confirm'),
            style: 'destructive',
            onPress: async () => {
              try {
                await leaveGroup(groupId);
                setIsJoined(false);
                setGroup({ ...group, memberCount: group.memberCount - 1 });
                showAlert(t('detail.alerts.leaveSuccess.title'), t('detail.alerts.leaveSuccess.message'));
                navigation.goBack();
              } catch (error) {
                showAlert(t('detail.alerts.leaveError.title'), t('detail.alerts.leaveError.message'));
              }
            },
          },
        ],
      );
    } else {
      try {
        await joinGroup(groupId);
        setIsJoined(true);
        setGroup({ ...group, memberCount: group.memberCount + 1 });
        showAlert(t('detail.alerts.joinSuccess.title'), t('detail.alerts.joinSuccess.message'));
      } catch (error) {
        showAlert(t('detail.alerts.joinError.title'), t('detail.alerts.joinError.message'));
      }
    }
  };

  const handleInviteCode = async () => {
    if (!isJoined) {
      showAlert(t('detail.alerts.inviteCodeRequiresJoin.title'), t('detail.alerts.inviteCodeRequiresJoin.message'));
      return;
    }
    
    try {
      const code = await getOrCreateInviteCode(groupId);
      setInviteCode(code);
      setShowInviteModal(true);
    } catch (error) {
      showAlert(t('detail.alerts.inviteCodeError.title'), t('detail.alerts.inviteCodeError.message'));
    }
  };

  const handleShareInviteCode = async () => {
    try {
      const message = t('detail.shareInviteMessage', { groupName: group.name, inviteCode });
      
      await Share.share({
        message,
        title: t('detail.shareInviteTitle'),
      });
    } catch (error) {
      console.error('Share failed:', error);
    }
  };

  const handleGroupChat = () => {
    if (!isJoined) {
      showAlert(t('detail.alerts.chatRequiresJoin.title'), t('detail.alerts.chatRequiresJoin.message'));
      return;
    }
    navigation.navigate('Chat', {
      roomId: `group-${groupId}`,
      matchId: groupId,
      otherUserNickname: group?.name || t('detail.chatButton'),
      isGroupChat: true,
    });
  };

  if (serverConnectionError) {
    return (
      <ServerConnectionError 
        onRetry={() => {
          setServerConnectionError(false);
          loadGroupDetail();
        }}
        message="그룹 정보를 불러올 수 없습니다"
      />
    );
  }

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-white dark:bg-gray-900">
        <ActivityIndicator size="large" color="#FF6B6B" />
        <Text className="mt-4 text-gray-600 dark:text-gray-400">그룹 정보를 불러오는 중...</Text>
      </View>
    );
  }

  if (!group) {
    return (
      <View className="flex-1 justify-center items-center bg-white dark:bg-gray-900">
        <Icon name="alert-circle-outline" size={64} color={colors.TEXT.TERTIARY} />
        <Text className="mt-4 text-lg text-gray-800 dark:text-gray-200">
          {t('detail.notFound')}
        </Text>
      </View>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50 dark:bg-gray-900">
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* 헤더 */}
        <View className="absolute top-0 left-0 right-0 z-10 flex-row items-center justify-between px-5 pt-12 pb-4">
          <TouchableOpacity 
            onPress={() => navigation.goBack()}
            className="bg-white/90 dark:bg-gray-800/90 rounded-full p-2"
          >
            <Icon name="arrow-back" size={24} color={isDark ? '#FFFFFF' : '#000000'} />
          </TouchableOpacity>
          <TouchableOpacity className="bg-white/90 dark:bg-gray-800/90 rounded-full p-2">
            <Icon name="ellipsis-vertical" size={24} color={isDark ? '#FFFFFF' : '#000000'} />
          </TouchableOpacity>
        </View>

        {/* 커버 이미지 */}
        <Animated.View 
          style={{ 
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }]
          }}
        >
          <Image 
            source={{ uri: group.coverImage }} 
            className="w-full h-64"
            resizeMode="cover"
          />
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.6)']}
            className="absolute bottom-0 left-0 right-0 h-32"
          />
        </Animated.View>

        {/* 그룹 정보 */}
        <Animated.View 
          className="bg-white dark:bg-gray-800 rounded-t-3xl -mt-8 px-5 pt-6 pb-4"
          style={{
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }]
          }}
        >
          <View className="flex-row items-start justify-between mb-4">
            <View className="flex-1">
              <Text className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                {group.name}
              </Text>
              <View className="flex-row items-center space-x-3">
                <View className="bg-pink-100 dark:bg-pink-900/30 px-3 py-1 rounded-full">
                  <Text className="text-pink-600 dark:text-pink-400 text-xs font-semibold">
                    {group.category}
                  </Text>
                </View>
                <View className="flex-row items-center">
                  <Icon name="people" size={16} color={colors.TEXT.SECONDARY} />
                  <Text className="ml-1 text-gray-600 dark:text-gray-400 text-sm">
                    {t('detail.memberCount', { count: group.memberCount })}
                  </Text>
                </View>
              </View>
            </View>
            <View className="items-center">
              <Text className="text-3xl mb-1">💝</Text>
              <Text className="text-xs text-gray-500 dark:text-gray-400">인기</Text>
            </View>
          </View>

          <Text className="text-gray-600 dark:text-gray-300 leading-6 mb-6">
            {group.description}
          </Text>

          {/* 액션 버튼들 */}
          <View className="space-y-3">
            <TouchableOpacity
              onPress={handleJoinLeave}
              className={`flex-row items-center justify-center py-4 rounded-2xl ${
                isJoined ? 'bg-gray-200 dark:bg-gray-700' : 'bg-gradient-to-r from-pink-500 to-red-500'
              }`}
            >
              <LinearGradient
                colors={isJoined ? ['#E5E7EB', '#E5E7EB'] : ['#FF6B6B', '#FF8A8A']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                className="absolute inset-0 rounded-2xl"
              />
              <Icon 
                name={isJoined ? "exit-outline" : "heart"} 
                size={20} 
                color={isJoined ? "#6B7280" : "#FFFFFF"}
              />
              <Text className={`ml-2 font-bold ${
                isJoined ? 'text-gray-600 dark:text-gray-300' : 'text-white'
              }`}>
                {isJoined ? t('detail.leaveButton') : t('detail.joinButton')}
              </Text>
            </TouchableOpacity>

            {isJoined && (
              <View className="flex-row space-x-3">
                <TouchableOpacity
                  onPress={handleGroupChat}
                  className="flex-1 flex-row items-center justify-center bg-purple-500 py-3.5 rounded-2xl"
                >
                  <Icon name="chatbubbles" size={20} color="#FFFFFF" />
                  <Text className="ml-2 text-white font-semibold">
                    {t('detail.chatButton')}
                  </Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  onPress={handleInviteCode}
                  className="flex-1 flex-row items-center justify-center bg-blue-500 py-3.5 rounded-2xl"
                >
                  <Icon name="share-social" size={20} color="#FFFFFF" />
                  <Text className="ml-2 text-white font-semibold">
                    {t('detail.inviteButton')}
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </Animated.View>

        {/* 멤버 섹션 */}
        <View className="mt-4 bg-white dark:bg-gray-800 rounded-3xl px-5 py-4">
          <Text className="text-lg font-bold text-gray-900 dark:text-white mb-4">
            {t('detail.activeMembersTitle')}
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View className="flex-row space-x-4">
              {group.members.map((member: any, index: number) => (
                <Animated.View 
                  key={member.id} 
                  className="items-center"
                  style={{
                    opacity: fadeAnim,
                    transform: [{
                      translateY: Animated.multiply(slideAnim, (index + 1) * 0.2)
                    }]
                  }}
                >
                  <View className="relative">
                    <Image 
                      source={{ uri: member.profileImage }} 
                      className="w-16 h-16 rounded-full border-2 border-pink-200"
                    />
                    {member.isOnline && (
                      <View className="absolute bottom-0 right-0 w-4 h-4 bg-green-500 rounded-full border-2 border-white" />
                    )}
                  </View>
                  <Text className="mt-2 text-xs text-gray-600 dark:text-gray-400">
                    {member.nickname}
                  </Text>
                </Animated.View>
              ))}
            </View>
          </ScrollView>
        </View>

        {/* 최근 게시물 */}
        <View className="mt-4 bg-white dark:bg-gray-800 rounded-3xl px-5 py-4 mb-6">
          <Text className="text-lg font-bold text-gray-900 dark:text-white mb-4">
            {t('detail.recentPostsTitle')}
          </Text>
          {group.recentPosts.map((post: any) => (
            <TouchableOpacity
              key={post.id}
              className="bg-gray-50 dark:bg-gray-700 rounded-2xl p-4 mb-3"
            >
              <Text className="font-semibold text-gray-900 dark:text-white mb-2">
                {post.title}
              </Text>
              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center space-x-3">
                  <Text className="text-xs text-gray-500 dark:text-gray-400">
                    {post.author}
                  </Text>
                  <Text className="text-xs text-gray-400 dark:text-gray-500">
                    {post.createdAt}
                  </Text>
                </View>
                <View className="flex-row items-center">
                  <Icon name="heart" size={14} color="#FF6B6B" />
                  <Text className="ml-1 text-xs text-gray-500 dark:text-gray-400">
                    {post.likes}
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      {/* 초대코드 모달 */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={showInviteModal}
        onRequestClose={() => setShowInviteModal(false)}
      >
        <View className="flex-1 bg-black/50 justify-center items-center px-6">
          <View className="bg-white dark:bg-gray-800 rounded-3xl p-6 w-full max-w-sm">
            <TouchableOpacity
              className="absolute top-4 right-4 p-2"
              onPress={() => setShowInviteModal(false)}
            >
              <Icon name="close" size={24} color={colors.TEXT.PRIMARY} />
            </TouchableOpacity>
            
            <Text className="text-xl font-bold text-gray-900 dark:text-white text-center mb-6">
              {t('detail.inviteCodeTitle')}
            </Text>
            
            <LinearGradient
              colors={['#FF6B6B', '#FF8A8A']}
              className="rounded-2xl p-6 mb-4"
            >
              <Text className="text-3xl font-bold text-white text-center tracking-widest">
                {inviteCode}
              </Text>
            </LinearGradient>
            
            <Text className="text-gray-600 dark:text-gray-300 text-center mb-6">
              {t('detail.inviteCodeDescription')}
            </Text>
            
            <TouchableOpacity
              className="bg-blue-500 py-4 rounded-2xl flex-row items-center justify-center"
              onPress={handleShareInviteCode}
            >
              <Icon name="share-social" size={20} color="#FFFFFF" />
              <Text className="ml-2 text-white font-bold">
                {t('detail.shareToSNS')}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};