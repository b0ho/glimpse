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
import { useUser } from '@clerk/clerk-expo';
import Icon from 'react-native-vector-icons/Ionicons';
import { usePremiumStore, premiumSelectors } from '@/store/slices/premiumSlice';
import { useLikeStore } from '@/store/slices/likeSlice';
import { COLORS, SPACING, FONT_SIZES } from '@/utils/constants';
import { User } from '@/types';

interface LikeInfo {
  id: string;
  fromUser: User;
  groupId: string;
  groupName: string;
  likedAt: Date;
  isSuper: boolean;
}

export const WhoLikesYouScreen: React.FC = () => {
  const navigation = useNavigation();
  const { user } = useUser();
  
  const [likesReceived, setLikesReceived] = useState<LikeInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const isPremiumUser = usePremiumStore(premiumSelectors.isPremiumUser());
  const { sendLike, sendSuperLike, canSendSuperLike, getRemainingSuperLikes } = useLikeStore();

  // 받은 좋아요 데이터 로드
  const loadLikesReceived = useCallback(async () => {
    if (!user?.id || !isPremiumUser) return;

    try {
      // TODO: 실제 API 호출로 교체 (Gemini 피드백 반영)
      // 임시 더미 데이터
      const dummyLikes: LikeInfo[] = [
        {
          id: '1',
          fromUser: {
            id: 'user1',
            anonymousId: 'anon1',
            nickname: '익명의 누군가',
            isVerified: true,
            createdAt: new Date('2024-01-15'),
          },
          groupId: 'group1',
          groupName: '테크 스타트업',
          likedAt: new Date('2024-01-20'),
          isSuper: true,
        },
        {
          id: '2',
          fromUser: {
            id: 'user2',
            anonymousId: 'anon2',
            nickname: '미스터리한 그 사람',
            isVerified: false,
            createdAt: new Date('2024-01-10'),
          },
          groupId: 'group2',
          groupName: '카페 애호가들',
          likedAt: new Date('2024-01-19'),
          isSuper: false,
        },
        {
          id: '3',
          fromUser: {
            id: 'user3',
            anonymousId: 'anon3',
            nickname: '조용한 관찰자',
            isVerified: true,
            createdAt: new Date('2024-01-12'),
          },
          groupId: 'group1',
          groupName: '테크 스타트업',
          likedAt: new Date('2024-01-18'),
          isSuper: false,
        },
      ];

      await new Promise(resolve => setTimeout(resolve, 1000)); // API 지연 시뮬레이션
      setLikesReceived(dummyLikes);
    } catch (error) {
      console.error('Error loading likes received:', error);
      Alert.alert('오류', '좋아요 정보를 불러오는 중 오류가 발생했습니다.');
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
        '좋아요 보내기',
        `${likeInfo.fromUser.nickname}님에게 좋아요를 보내시겠습니까?`,
        [
          { text: '취소', style: 'cancel' },
          {
            text: '좋아요',
            onPress: async () => {
              const success = await sendLike(
                likeInfo.fromUser.id,
                likeInfo.groupId
              );

              if (success) {
                Alert.alert(
                  '매칭 성공!',
                  `${likeInfo.fromUser.nickname}님과 매칭되었습니다!\n이제 채팅을 시작할 수 있습니다.`,
                  [
                    {
                      text: '채팅하기',
                      onPress: () => {
                        // TODO: 실제 채팅 화면으로 이동 로직 구현 (Gemini 피드백 반영)
                        // navigation.navigate('Chat', { matchId: newMatchId, roomId: roomId });
                        console.log('Navigate to chat - matchId needed');
                      },
                    },
                  ]
                );
              } else {
                Alert.alert('오류', '좋아요 전송에 실패했습니다.');
              }
            },
          },
        ]
      );
    } catch (error) {
      console.error('Error sending like back:', error);
      Alert.alert('오류', '좋아요 전송 중 오류가 발생했습니다.');
    }
  }, [sendLike]);

  const handleSuperLikeBack = useCallback(async (likeInfo: LikeInfo) => {
    try {
      // 프리미엄 사용자가 아닌 경우 체크
      if (!isPremiumUser) {
        Alert.alert(
          '프리미엄 전용 기능',
          '슈퍼 좋아요는 프리미엄 사용자만 사용할 수 있습니다.',
          [
            { text: '취소', style: 'cancel' },
            {
              text: '프리미엄 가입',
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
          '슈퍼 좋아요 한도 초과',
          `오늘 사용 가능한 슈퍼 좋아요가 ${remaining}개 남았습니다.\n내일 다시 시도해주세요.`,
          [{ text: '확인' }]
        );
        return;
      }

      const remainingSuperLikes = getRemainingSuperLikes();
      Alert.alert(
        '슈퍼 좋아요 보내기',
        `${likeInfo.fromUser.nickname}님에게 슈퍼 좋아요를 보내시겠습니까?\n\n⭐ 슈퍼 좋아요는 즉시 상대방에게 알림이 가며 더 높은 매칭 확률을 제공합니다.\n💎 오늘 ${remainingSuperLikes - 1}개 더 사용할 수 있습니다.`,
        [
          { text: '취소', style: 'cancel' },
          {
            text: '⭐ 슈퍼 좋아요',
            style: 'default',
            onPress: async () => {
              const success = await sendSuperLike(
                likeInfo.fromUser.id,
                likeInfo.groupId
              );

              if (success) {
                Alert.alert(
                  '🌟 슈퍼 매칭 성공!',
                  `⭐ ${likeInfo.fromUser.nickname}님과 슈퍼 매칭되었습니다!\n특별한 대화를 시작해보세요!`,
                  [
                    {
                      text: '💬 채팅하기',
                      onPress: () => {
                        // TODO: 실제 채팅 화면으로 이동 로직 구현 (Gemini 피드백 반영)
                        // navigation.navigate('Chat', { matchId: newMatchId, roomId: roomId });
                        console.log('Navigate to super match chat - matchId needed');
                      },
                    },
                  ]
                );
              } else {
                Alert.alert('오류', '슈퍼 좋아요 전송에 실패했습니다.');
              }
            },
          },
        ]
      );
    } catch (error) {
      console.error('Error sending super like back:', error);
      Alert.alert('오류', '슈퍼 좋아요 전송 중 오류가 발생했습니다.');
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
          <Text style={styles.likeButtonText}>좋아요</Text>
        </TouchableOpacity>
        
        {isPremiumUser && canSendSuperLike() && (
          <TouchableOpacity
            style={[styles.actionButton, styles.superLikeButton]}
            onPress={() => handleSuperLikeBack(item)}
          >
            <Icon name="star" size={20} color={COLORS.TEXT.WHITE} />
            <Text style={styles.superLikeButtonText}>
              슈퍼 ({getRemainingSuperLikes()})
            </Text>
          </TouchableOpacity>
        )}
        
        {isPremiumUser && !canSendSuperLike() && (
          <TouchableOpacity
            style={[styles.actionButton, styles.superLikeButtonDisabled]}
            disabled={true}
          >
            <Icon name="star-outline" size={20} color={COLORS.TEXT.LIGHT} />
            <Text style={styles.superLikeButtonDisabledText}>한도 초과</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Icon name="heart-outline" size={64} color={COLORS.TEXT.LIGHT} />
      <Text style={styles.emptyTitle}>아직 받은 좋아요가 없어요</Text>
      <Text style={styles.emptyDescription}>
        그룹에 참여하고 활동하면{'\n'}
        더 많은 사람들이 관심을 보일 거예요!
      </Text>
    </View>
  );

  const renderNonPremiumState = () => (
    <View style={styles.nonPremiumState}>
      <View style={styles.premiumIcon}>
        <Icon name="diamond-outline" size={48} color={COLORS.PRIMARY} />
      </View>
      <Text style={styles.premiumTitle}>프리미엄 전용 기능</Text>
      <Text style={styles.premiumDescription}>
        누가 나에게 좋아요를 보냈는지 확인하려면{'\n'}
        프리미엄 구독이 필요해요
      </Text>
      <TouchableOpacity
        style={styles.premiumButton}
        onPress={() => navigation.navigate('Premium' as never)}
      >
        <Text style={styles.premiumButtonText}>프리미엄 가입하기</Text>
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
          <Text style={styles.headerTitle}>좋아요 받은 사람</Text>
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
          <Text style={styles.headerTitle}>좋아요 받은 사람</Text>
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