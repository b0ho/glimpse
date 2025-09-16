import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAndroidSafeTranslation } from '@/hooks/useAndroidSafeTranslation';
import { useTheme } from '@/hooks/useTheme';
import { useAuthStore } from '@/store/slices/authSlice';
import Icon from 'react-native-vector-icons/Ionicons';
import { usePremiumStore, premiumSelectors } from '@/store/slices/premiumSlice';
import { useLikeStore } from '@/store/slices/likeSlice';
import { User } from '@/types';
import { likeApi } from '@/services/api/likeApi';
import { cn } from '@/lib/utils';

interface LikeInfo {
  id: string;
  fromUser: User;
  groupId: string;
  groupName: string;
  likedAt: Date;
  isSuper: boolean;
}

export const WhoLikesYouScreen = () => {
  const { t } = useAndroidSafeTranslation('premium');
  const navigation = useNavigation();
  const { user } = useAuthStore();
  const { colors, isDarkMode } = useTheme();
  
  const [likesReceived, setLikesReceived] = useState<LikeInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const isPremiumUser = usePremiumStore(premiumSelectors.isPremiumUser());
  const { sendLike, sendSuperLike, canSendSuperLike, getRemainingSuperLikes } = useLikeStore();

  // 받은 좋아요 데이터 로드
  const loadLikesReceived = useCallback(async () => {
    if (!user?.id || !isPremiumUser) return;

    try {
      console.log('[WhoLikesYouScreen] 받은 좋아요 로드 시작');
      const receivedLikes = await likeApi.getReceivedLikes();
      console.log('[WhoLikesYouScreen] 받은 좋아요 로드 성공:', receivedLikes.length);
      
      // Like 타입을 LikeInfo로 변환
      const likeInfos: LikeInfo[] = receivedLikes.map((like: any) => ({
        id: like.id,
        fromUser: {
          id: like.fromUserId,
          anonymousId: `anon_${like.fromUserId}`,
          phoneNumber: '',
          nickname: t('wholikesyou:whoLikesYou.anonymousUser'),
          isVerified: true,
          credits: 0,
          isPremium: false,
          lastActive: new Date(),
          createdAt: new Date(like.createdAt),
          updatedAt: new Date(like.createdAt),
        },
        groupId: like.groupId || 'unknown',
        groupName: t('wholikesyou:whoLikesYou.group'),
        likedAt: new Date(like.createdAt),
        isSuper: like.isSuper || false,
      }));
      
      setLikesReceived(likeInfos);
    } catch (error: any) {
      console.error('[WhoLikesYouScreen] 받은 좋아요 로드 실패:', error);
      Alert.alert(t('wholikesyou:whoLikesYou.error'), t('whoLikesYou:whoLikesYou.loadError'));
      setLikesReceived([]);
    }
  }, [user?.id, isPremiumUser]);

  useEffect(() => {
    loadLikesReceived().finally(() => setIsLoading(false));
  }, [loadLikesReceived]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadLikesReceived();
    setRefreshing(false);
  }, [loadLikesReceived]);

  const handleLikeBack = useCallback(async (likeInfo: LikeInfo) => {
    try {
      Alert.alert(
        t('wholikesyou:whoLikesYou.sendLike.title'),
        t('whoLikesYou:whoLikesYou.sendLike.message', { nickname: likeInfo.fromUser.nickname }),
        [
          { text: t('wholikesyou:whoLikesYou.sendLike.cancel'), style: 'cancel' },
          {
            text: t('wholikesyou:whoLikesYou.sendLike.confirm'),
            onPress: async () => {
              const success = await sendLike(
                likeInfo.fromUser.id,
                likeInfo.groupId
              );

              if (success) {
                Alert.alert(
                  t('wholikesyou:whoLikesYou.matchSuccess.title'),
                  t('whoLikesYou:whoLikesYou.matchSuccess.message', { nickname: likeInfo.fromUser.nickname }),
                  [
                    {
                      text: t('wholikesyou:whoLikesYou.matchSuccess.startChat'),
                      onPress: () => {
                        console.log('Navigate to chat - matchId needed');
                      },
                    },
                  ]
                );
              } else {
                Alert.alert(t('common:error'), t('wholikesyou:whoLikesYou.errors.sendLikeFailed'));
              }
            },
          },
        ]
      );
    } catch (error) {
      console.error('Error sending like back:', error);
      Alert.alert(t('common:error'), t('wholikesyou:whoLikesYou.errors.sendLikeError'));
    }
  }, [sendLike]);

  const handleSuperLikeBack = useCallback(async (likeInfo: LikeInfo) => {
    try {
      if (!isPremiumUser) {
        Alert.alert(
          t('wholikesyou:whoLikesYou.premiumFeature.title'),
          t('whoLikesYou:whoLikesYou.premiumFeature.message'),
          [
            { text: t('common:buttons.cancel'), style: 'cancel' },
            {
              text: t('wholikesyou:whoLikesYou.premiumFeature.subscribe'),
              onPress: () => navigation.navigate('Premium' as never),
            },
          ]
        );
        return;
      }

      if (!canSendSuperLike()) {
        const remaining = getRemainingSuperLikes();
        Alert.alert(
          t('wholikesyou:whoLikesYou.superLike.limitExceeded'),
          t('whoLikesYou:whoLikesYou.superLike.limitExceededMessage', { remaining }),
          [{ text: t('common:buttons.confirm') }]
        );
        return;
      }

      const remainingSuperLikes = getRemainingSuperLikes();
      Alert.alert(
        t('wholikesyou:whoLikesYou.superLike.sendTitle'),
        t('whoLikesYou:whoLikesYou.superLike.sendMessage', { nickname: likeInfo.fromUser.nickname, remaining: remainingSuperLikes - 1 }),
        [
          { text: t('common:buttons.cancel'), style: 'cancel' },
          {
            text: t('wholikesyou:whoLikesYou.superLike.sendButton'),
            style: 'default',
            onPress: async () => {
              const success = await sendSuperLike(
                likeInfo.fromUser.id,
                likeInfo.groupId
              );

              if (success) {
                Alert.alert(
                  t('wholikesyou:whoLikesYou.superLike.matchSuccess'),
                  t('whoLikesYou:whoLikesYou.superLike.matchSuccessMessage', { nickname: likeInfo.fromUser.nickname }),
                  [
                    {
                      text: t('wholikesyou:whoLikesYou.superLike.startChat'),
                      onPress: () => {
                        console.log('Navigate to super match chat - matchId needed');
                      },
                    },
                  ]
                );
              } else {
                Alert.alert(t('common:status.error'), t('wholikesyou:whoLikesYou.superLike.sendFailed'));
              }
            },
          },
        ]
      );
    } catch (error) {
      console.error('Error sending super like back:', error);
      Alert.alert(t('common:status.error'), t('wholikesyou:whoLikesYou.superLike.sendError'));
    }
  }, [sendSuperLike, isPremiumUser, canSendSuperLike, getRemainingSuperLikes, navigation]);

  const renderLikeItem = ({ item }: { item: LikeInfo }) => (
    <View 
      className={cn(
        "rounded-xl p-4 mb-4 border",
        "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700"
      )}
      style={{ backgroundColor: colors.SURFACE, borderColor: colors.BORDER }}
    >
      <View className="mb-4">
        <View className="flex-row items-start">
          <View 
            className="w-12 h-12 rounded-full items-center justify-center mr-4"
            style={{ backgroundColor: colors.BACKGROUND }}
          >
            <Icon name="person" size={24} color={colors.TEXT.SECONDARY} />
          </View>
          <View className="flex-1">
            <View className="flex-row items-center mb-1">
              <Text 
                className="text-base font-semibold mr-2"
                style={{ color: colors.TEXT.PRIMARY }}
              >
                {item.fromUser.nickname}
              </Text>
              {item.fromUser.isVerified && (
                <Icon name="checkmark-circle" size={16} color={colors.SUCCESS} />
              )}
              {item.isSuper && (
                <View 
                  className="flex-row items-center px-1.5 py-0.5 rounded-xl ml-2"
                  style={{ backgroundColor: colors.WARNING }}
                >
                  <Icon name="star" size={12} color={colors.TEXT.WHITE} />
                  <Text 
                    className="text-xs font-semibold ml-0.5"
                    style={{ color: colors.TEXT.WHITE }}
                  >
                    SUPER
                  </Text>
                </View>
              )}
            </View>
            <Text 
              className="text-sm mb-0.5"
              style={{ color: colors.TEXT.SECONDARY }}
            >
              {item.groupName}
            </Text>
            <Text 
              className="text-xs"
              style={{ color: colors.TEXT.LIGHT }}
            >
              {item.likedAt.toLocaleDateString('ko-KR', {
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </Text>
          </View>
        </View>
      </View>

      <View className="flex-row space-x-3">
        <TouchableOpacity
          className="flex-1 flex-row items-center justify-center py-3 rounded-lg"
          style={{ backgroundColor: colors.PRIMARY }}
          onPress={() => handleLikeBack(item)}
        >
          <Icon name="heart" size={20} color={colors.TEXT.WHITE} />
          <Text 
            className="text-sm font-semibold ml-2"
            style={{ color: colors.TEXT.WHITE }}
          >
            {t('wholikesyou:whoLikesYou.sendLikeButton')}
          </Text>
        </TouchableOpacity>
        
        {isPremiumUser && canSendSuperLike() && (
          <TouchableOpacity
            className="flex-1 flex-row items-center justify-center py-3 rounded-lg"
            style={{ backgroundColor: colors.WARNING }}
            onPress={() => handleSuperLikeBack(item)}
          >
            <Icon name="star" size={20} color={colors.TEXT.WHITE} />
            <Text 
              className="text-sm font-semibold ml-2"
              style={{ color: colors.TEXT.WHITE }}
            >
              {t('wholikesyou:whoLikesYou.superLikeButton')} ({getRemainingSuperLikes()})
            </Text>
          </TouchableOpacity>
        )}
        
        {isPremiumUser && !canSendSuperLike() && (
          <TouchableOpacity
            className="flex-1 flex-row items-center justify-center py-3 rounded-lg border"
            style={{ 
              backgroundColor: colors.BACKGROUND, 
              borderColor: colors.BORDER 
            }}
            disabled={true}
          >
            <Icon name="star-outline" size={20} color={colors.TEXT.LIGHT} />
            <Text 
              className="text-sm font-medium ml-2"
              style={{ color: colors.TEXT.LIGHT }}
            >
              {t('wholikesyou:whoLikesYou.limitExceeded')}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  const renderEmptyState = () => (
    <View className="items-center justify-center py-16">
      <Icon name="heart-outline" size={64} color={colors.TEXT.LIGHT} />
      <Text 
        className="text-lg font-semibold mt-6 mb-3"
        style={{ color: colors.TEXT.PRIMARY }}
      >
        {t('wholikesyou:whoLikesYou.noLikes')}
      </Text>
      <Text 
        className="text-base text-center leading-5"
        style={{ color: colors.TEXT.SECONDARY }}
      >
        {t('wholikesyou:whoLikesYou.noLikesFullDescription')}
      </Text>
    </View>
  );

  const renderNonPremiumState = () => (
    <View className="flex-1 items-center justify-center px-6">
      <View className="mb-6">
        <Icon name="diamond-outline" size={48} color={colors.PRIMARY} />
      </View>
      <Text 
        className="text-2xl font-semibold mb-3"
        style={{ color: colors.TEXT.PRIMARY }}
      >
        {t('wholikesyou:whoLikesYou.premiumRequired')}
      </Text>
      <Text 
        className="text-base text-center leading-6 mb-8"
        style={{ color: colors.TEXT.SECONDARY }}
      >
        {t('wholikesyou:whoLikesYou.premiumDescription')}
      </Text>
      <TouchableOpacity
        className="px-8 py-4 rounded-xl"
        style={{ backgroundColor: colors.PRIMARY }}
        onPress={() => navigation.navigate('Premium' as never)}
      >
        <Text 
          className="text-base font-semibold"
          style={{ color: colors.TEXT.WHITE }}
        >
          {t('wholikesyou:whoLikesYou.upgradeToPremium')}
        </Text>
      </TouchableOpacity>
    </View>
  );

  if (!isPremiumUser) {
    return (
      <SafeAreaView 
        className={cn(
          "flex-1",
          "bg-white dark:bg-gray-900"
        )}
        style={{ backgroundColor: colors.BACKGROUND }}
      >
        <View 
          className={cn(
            "flex-row items-center justify-between px-4 py-3 border-b",
            "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700"
          )}
          style={{ backgroundColor: colors.SURFACE, borderBottomColor: colors.BORDER }}
        >
          <TouchableOpacity
            className="p-3"
            onPress={() => navigation.goBack()}
          >
            <Icon name="arrow-back" size={24} color={colors.TEXT.PRIMARY} />
          </TouchableOpacity>
          <Text 
            className="text-lg font-semibold"
            style={{ color: colors.TEXT.PRIMARY }}
          >
            {t('wholikesyou:whoLikesYou.title')}
          </Text>
          <View className="w-10" />
        </View>
        
        {renderNonPremiumState()}
      </SafeAreaView>
    );
  }

  if (isLoading) {
    return (
      <SafeAreaView 
        className={cn(
          "flex-1",
          "bg-white dark:bg-gray-900"
        )}
        style={{ backgroundColor: colors.BACKGROUND }}
      >
        <View 
          className={cn(
            "flex-row items-center justify-between px-4 py-3 border-b",
            "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700"
          )}
          style={{ backgroundColor: colors.SURFACE, borderBottomColor: colors.BORDER }}
        >
          <TouchableOpacity
            className="p-3"
            onPress={() => navigation.goBack()}
          >
            <Icon name="arrow-back" size={24} color={colors.TEXT.PRIMARY} />
          </TouchableOpacity>
          <Text 
            className="text-lg font-semibold"
            style={{ color: colors.TEXT.PRIMARY }}
          >
            {t('wholikesyou:whoLikesYou.title')}
          </Text>
          <View className="w-10" />
        </View>
        
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={colors.PRIMARY} />
          <Text 
            className="text-base mt-4"
            style={{ color: colors.TEXT.SECONDARY }}
          >
            좋아요 정보를 불러오는 중...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView 
      className={cn(
        "flex-1",
        "bg-white dark:bg-gray-900"
      )}
      style={{ backgroundColor: colors.BACKGROUND }}
    >
      <View 
        className={cn(
          "flex-row items-center justify-between px-4 py-3 border-b",
          "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700"
        )}
        style={{ backgroundColor: colors.SURFACE, borderBottomColor: colors.BORDER }}
      >
        <TouchableOpacity
          className="p-3"
          onPress={() => navigation.goBack()}
        >
          <Icon name="arrow-back" size={24} color={colors.TEXT.PRIMARY} />
        </TouchableOpacity>
        <Text 
          className="text-lg font-semibold"
          style={{ color: colors.TEXT.PRIMARY }}
        >
          좋아요 받은 사람
        </Text>
        <TouchableOpacity
          className="p-3"
          onPress={handleRefresh}
        >
          <Icon name="refresh" size={24} color={colors.TEXT.SECONDARY} />
        </TouchableOpacity>
      </View>

      <FlatList
        data={likesReceived}
        renderItem={renderLikeItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 16 }}
        ListEmptyComponent={renderEmptyState}
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
      
      {likesReceived.length > 0 && (
        <View 
          className={cn(
            "p-4 border-t",
            "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700"
          )}
          style={{ backgroundColor: colors.SURFACE, borderTopColor: colors.BORDER }}
        >
          <Text 
            className="text-sm text-center"
            style={{ color: colors.TEXT.SECONDARY }}
          >
            💡 좋아요를 보내면 매칭이 성사됩니다
          </Text>
        </View>
      )}
    </SafeAreaView>
  );
};