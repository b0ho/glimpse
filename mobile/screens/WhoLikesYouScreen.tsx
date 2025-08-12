import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Alert,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '@/store/slices/authSlice';
import Icon from 'react-native-vector-icons/Ionicons';
import { usePremiumStore, premiumSelectors } from '@/store/slices/premiumSlice';
import { useLikeStore } from '@/store/slices/likeSlice';
import { COLORS, SPACING, FONT_SIZES } from '@/utils/constants';
import { User } from '@/types';
import { likeApi } from '@/services/api/likeApi';

interface LikeInfo {
  id: string;
  fromUser: User;
  groupId: string;
  groupName: string;
  likedAt: Date;
  isSuper: boolean;
}

export const WhoLikesYouScreen = () => {
  const { t } = useTranslation('premium');
  const navigation = useNavigation();
  const { user } = useAuthStore();
  
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
          nickname: t('whoLikesYou.anonymousUser'),
          isVerified: true,
          credits: 0,
          isPremium: false,
          lastActive: new Date(),
          createdAt: new Date(like.createdAt),
          updatedAt: new Date(like.createdAt),
        },
        groupId: like.groupId || 'unknown',
        groupName: t('whoLikesYou.group'),
        likedAt: new Date(like.createdAt),
        isSuper: like.isSuper || false,
      }));
      
      setLikesReceived(likeInfos);
    } catch (error: any) {
      console.error('[WhoLikesYouScreen] 받은 좋아요 로드 실패:', error);
      Alert.alert(t('whoLikesYou.error'), t('whoLikesYou.loadError'));
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
        t('whoLikesYou.sendLike.title'),
        t('whoLikesYou.sendLike.message', { nickname: likeInfo.fromUser.nickname }),
        [
          { text: t('whoLikesYou.sendLike.cancel'), style: 'cancel' },
          {
            text: t('whoLikesYou.sendLike.confirm'),
            onPress: async () => {
              const success = await sendLike(
                likeInfo.fromUser.id,
                likeInfo.groupId
              );

              if (success) {
                Alert.alert(
                  t('whoLikesYou.matchSuccess.title'),
                  t('whoLikesYou.matchSuccess.message', { nickname: likeInfo.fromUser.nickname }),
                  [
                    {
                      text: t('whoLikesYou.matchSuccess.startChat'),
                      onPress: () => {
                        // TODO: 실제 채팅 화면으로 이동 로직 구현 (Gemini 피드백 반영)
                        // navigation.navigate('Chat', { matchId: newMatchId, roomId: roomId });
                        console.log('Navigate to chat - matchId needed');
                      },
                    },
                  ]
                );
              } else {
                Alert.alert(t('common:error'), t('whoLikesYou.errors.sendLikeFailed'));
              }
            },
          },
        ]
      );
    } catch (error) {
      console.error('Error sending like back:', error);
      Alert.alert(t('common:error'), t('whoLikesYou.errors.sendLikeError'));
    }
  }, [sendLike]);

  const handleSuperLikeBack = useCallback(async (likeInfo: LikeInfo) => {
    try {
      // 프리미엄 사용자가 아닌 경우 체크
      if (!isPremiumUser) {
        Alert.alert(
          t('whoLikesYou.premiumFeature.title'),
          t('whoLikesYou.premiumFeature.message'),
          [
            { text: t('common:buttons.cancel'), style: 'cancel' },
            {
              text: t('whoLikesYou.premiumFeature.subscribe'),
              onPress: () => navigation.navigate('Premium' as never),
            },
          ]
        );
        return;
      }

      // 슈퍼 좋아요 사용 가능 여부 확인
      if (!canSendSuperLike()) {
        const remaining = getRemainingSuperLikes();
        Alert.alert(
          t('whoLikesYou.superLike.limitExceeded'),
          t('whoLikesYou.superLike.limitExceededMessage', { remaining }),
          [{ text: t('common:buttons.confirm') }]
        );
        return;
      }

      const remainingSuperLikes = getRemainingSuperLikes();
      Alert.alert(
        t('whoLikesYou.superLike.sendTitle'),
        t('whoLikesYou.superLike.sendMessage', { nickname: likeInfo.fromUser.nickname, remaining: remainingSuperLikes - 1 }),
        [
          { text: t('common:buttons.cancel'), style: 'cancel' },
          {
            text: t('whoLikesYou.superLike.sendButton'),
            style: 'default',
            onPress: async () => {
              const success = await sendSuperLike(
                likeInfo.fromUser.id,
                likeInfo.groupId
              );

              if (success) {
                Alert.alert(
                  t('whoLikesYou.superLike.matchSuccess'),
                  t('whoLikesYou.superLike.matchSuccessMessage', { nickname: likeInfo.fromUser.nickname }),
                  [
                    {
                      text: t('whoLikesYou.superLike.startChat'),
                      onPress: () => {
                        // TODO: 실제 채팅 화면으로 이동 로직 구현 (Gemini 피드백 반영)
                        // navigation.navigate('Chat', { matchId: newMatchId, roomId: roomId });
                        console.log('Navigate to super match chat - matchId needed');
                      },
                    },
                  ]
                );
              } else {
                Alert.alert(t('common:status.error'), t('whoLikesYou.superLike.sendFailed'));
              }
            },
          },
        ]
      );
    } catch (error) {
      console.error('Error sending super like back:', error);
      Alert.alert(t('common:status.error'), t('whoLikesYou.superLike.sendError'));
    }
  }, [sendSuperLike, isPremiumUser, canSendSuperLike, getRemainingSuperLikes, navigation]);

  const renderLikeItem = ({ item }: { item: LikeInfo }) => (
    <View style={styles.likeItem}>
      <View style={styles.likeHeader}>
        <View style={styles.userInfo}>
          <View style={styles.userAvatar}>
            <Icon name="person" size={24} color={COLORS.TEXT.SECONDARY} />
          </View>
          <View style={styles.userDetails}>
            <View style={styles.nicknameRow}>
              <Text style={styles.nickname}>{item.fromUser.nickname}</Text>
              {item.fromUser.isVerified && (
                <Icon name="checkmark-circle" size={16} color={COLORS.SUCCESS} />
              )}
              {item.isSuper && (
                <View style={styles.superBadge}>
                  <Icon name="star" size={12} color={COLORS.WARNING} />
                  <Text style={styles.superText}>SUPER</Text>
                </View>
              )}
            </View>
            <Text style={styles.groupName}>{item.groupName}</Text>
            <Text style={styles.likedTime}>
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

      <View style={styles.actionButtons}>
        <TouchableOpacity
          style={[styles.actionButton, styles.likeButton]}
          onPress={() => handleLikeBack(item)}
        >
          <Icon name="heart" size={20} color={COLORS.TEXT.WHITE} />
          <Text style={styles.likeButtonText}>{t('whoLikesYou.sendLikeButton')}</Text>
        </TouchableOpacity>
        
        {isPremiumUser && canSendSuperLike() && (
          <TouchableOpacity
            style={[styles.actionButton, styles.superLikeButton]}
            onPress={() => handleSuperLikeBack(item)}
          >
            <Icon name="star" size={20} color={COLORS.TEXT.WHITE} />
            <Text style={styles.superLikeButtonText}>
              {t('whoLikesYou.superLikeButton')} ({getRemainingSuperLikes()})
            </Text>
          </TouchableOpacity>
        )}
        
        {isPremiumUser && !canSendSuperLike() && (
          <TouchableOpacity
            style={[styles.actionButton, styles.superLikeButtonDisabled]}
            disabled={true}
          >
            <Icon name="star-outline" size={20} color={COLORS.TEXT.LIGHT} />
            <Text style={styles.superLikeButtonDisabledText}>{t('whoLikesYou.limitExceeded')}</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Icon name="heart-outline" size={64} color={COLORS.TEXT.LIGHT} />
      <Text style={styles.emptyTitle}>{t('whoLikesYou.noLikes')}</Text>
      <Text style={styles.emptyDescription}>
        {t('whoLikesYou.noLikesFullDescription')}
      </Text>
    </View>
  );

  const renderNonPremiumState = () => (
    <View style={styles.nonPremiumState}>
      <View style={styles.premiumIcon}>
        <Icon name="diamond-outline" size={48} color={COLORS.PRIMARY} />
      </View>
      <Text style={styles.premiumTitle}>{t('whoLikesYou.premiumRequired')}</Text>
      <Text style={styles.premiumDescription}>
        {t('whoLikesYou.premiumDescription')}
      </Text>
      <TouchableOpacity
        style={styles.premiumButton}
        onPress={() => navigation.navigate('Premium' as never)}
      >
        <Text style={styles.premiumButtonText}>{t('whoLikesYou.upgradeToPremium')}</Text>
      </TouchableOpacity>
    </View>
  );

  if (!isPremiumUser) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Icon name="arrow-back" size={24} color={COLORS.TEXT.PRIMARY} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t('whoLikesYou.title')}</Text>
          <View style={styles.headerRight} />
        </View>
        
        {renderNonPremiumState()}
      </SafeAreaView>
    );
  }

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
          <Text style={styles.headerTitle}>{t('whoLikesYou.title')}</Text>
          <View style={styles.headerRight} />
        </View>
        
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.PRIMARY} />
          <Text style={styles.loadingText}>좋아요 정보를 불러오는 중...</Text>
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
        <Text style={styles.headerTitle}>좋아요 받은 사람</Text>
        <TouchableOpacity
          style={styles.refreshButton}
          onPress={handleRefresh}
        >
          <Icon name="refresh" size={24} color={COLORS.TEXT.SECONDARY} />
        </TouchableOpacity>
      </View>

      <FlatList
        data={likesReceived}
        renderItem={renderLikeItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={renderEmptyState}
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
      
      {likesReceived.length > 0 && (
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            💡 좋아요를 보내면 매칭이 성사됩니다
          </Text>
        </View>
      )}
    </SafeAreaView>
  );
};

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
    padding: SPACING.MD,
  },
  likeItem: {
    backgroundColor: COLORS.SURFACE,
    borderRadius: 12,
    padding: SPACING.MD,
    marginBottom: SPACING.MD,
    borderWidth: 1,
    borderColor: COLORS.BORDER,
  },
  likeHeader: {
    marginBottom: SPACING.MD,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  userAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.BACKGROUND,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.MD,
  },
  userDetails: {
    flex: 1,
  },
  nicknameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  nickname: {
    fontSize: FONT_SIZES.MD,
    fontWeight: '600',
    color: COLORS.TEXT.PRIMARY,
    marginRight: SPACING.XS,
  },
  superBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.WARNING,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 12,
    marginLeft: SPACING.XS,
  },
  superText: {
    fontSize: 10,
    fontWeight: '600',
    color: COLORS.TEXT.WHITE,
    marginLeft: 2,
  },
  groupName: {
    fontSize: FONT_SIZES.SM,
    color: COLORS.TEXT.SECONDARY,
    marginBottom: 2,
  },
  likedTime: {
    fontSize: FONT_SIZES.XS,
    color: COLORS.TEXT.LIGHT,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: SPACING.SM,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.SM,
    borderRadius: 8,
    gap: SPACING.XS,
  },
  likeButton: {
    backgroundColor: COLORS.PRIMARY,
  },
  likeButtonText: {
    color: COLORS.TEXT.WHITE,
    fontSize: FONT_SIZES.SM,
    fontWeight: '600',
  },
  superLikeButton: {
    backgroundColor: COLORS.WARNING,
  },
  superLikeButtonText: {
    color: COLORS.TEXT.WHITE,
    fontSize: FONT_SIZES.SM,
    fontWeight: '600',
  },
  superLikeButtonDisabled: {
    backgroundColor: COLORS.BACKGROUND,
    borderWidth: 1,
    borderColor: COLORS.BORDER,
  },
  superLikeButtonDisabledText: {
    color: COLORS.TEXT.LIGHT,
    fontSize: FONT_SIZES.SM,
    fontWeight: '500',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.XXL * 2,
  },
  emptyTitle: {
    fontSize: FONT_SIZES.LG,
    fontWeight: '600',
    color: COLORS.TEXT.PRIMARY,
    marginTop: SPACING.LG,
    marginBottom: SPACING.SM,
  },
  emptyDescription: {
    fontSize: FONT_SIZES.SM,
    color: COLORS.TEXT.SECONDARY,
    textAlign: 'center',
    lineHeight: 20,
  },
  nonPremiumState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING.LG,
  },
  premiumIcon: {
    marginBottom: SPACING.LG,
  },
  premiumTitle: {
    fontSize: FONT_SIZES.XL,
    fontWeight: '600',
    color: COLORS.TEXT.PRIMARY,
    marginBottom: SPACING.SM,
  },
  premiumDescription: {
    fontSize: FONT_SIZES.MD,
    color: COLORS.TEXT.SECONDARY,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: SPACING.XL,
  },
  premiumButton: {
    backgroundColor: COLORS.PRIMARY,
    paddingHorizontal: SPACING.XL,
    paddingVertical: SPACING.MD,
    borderRadius: 12,
  },
  premiumButtonText: {
    color: COLORS.TEXT.WHITE,
    fontSize: FONT_SIZES.MD,
    fontWeight: '600',
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
  footer: {
    padding: SPACING.MD,
    backgroundColor: COLORS.SURFACE,
    borderTopWidth: 1,
    borderTopColor: COLORS.BORDER,
  },
  footerText: {
    fontSize: FONT_SIZES.SM,
    color: COLORS.TEXT.SECONDARY,
    textAlign: 'center',
  },
});