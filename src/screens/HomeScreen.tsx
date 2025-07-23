import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  RefreshControl,
  SafeAreaView,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useAuthStore } from '@/store/slices/authSlice';
import { useLikeStore } from '@/store/slices/likeSlice';
import { ContentItem } from '@/components/ContentItem';
import { Content } from '@/types';
import { COLORS, SPACING, FONT_SIZES } from '@/utils/constants';
import { generateDummyContent } from '@/utils/mockData';
import { ACTION_ICONS } from '@/utils/icons';


export const HomeScreen: React.FC = () => {
  const [contents, setContents] = useState<Content[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [hasMoreData, setHasMoreData] = useState(true);
  
  const navigation = useNavigation();
  const authStore = useAuthStore();
  const likeStore = useLikeStore();

  // 좋아요 토글 함수
  const handleLikeToggle = useCallback(async (contentId: string, authorId: string) => {
    const content = contents.find(c => c.id === contentId);
    if (!content) return;

    // 자기 자신의 콘텐츠에는 좋아요 불가
    if (authorId === authStore.user?.id) {
      Alert.alert('알림', '자신의 게시물에는 좋아요를 누를 수 없습니다.');
      return;
    }

    // 이미 좋아요를 눌렀다면
    if (content.isLikedByUser) {
      Alert.alert('알림', '이미 좋아요를 누른 게시물입니다.');
      return;
    }

    // 일일 좋아요 한도 체크
    if (!likeStore.canSendLike(authorId)) {
      const remainingLikes = likeStore.getRemainingFreeLikes();
      if (remainingLikes === 0) {
        Alert.alert(
          '좋아요 한도 초과',
          '오늘의 무료 좋아요를 모두 사용했습니다.\n추가 좋아요는 결제를 통해 구매할 수 있습니다.',
          [
            { text: '취소', style: 'cancel' },
            { text: '구매하기', onPress: () => console.log('Navigate to purchase') },
          ]
        );
        return;
      } else {
        Alert.alert('알림', '2주 이내에 이미 좋아요를 보낸 사용자입니다.');
        return;
      }
    }

    try {
      // 좋아요 보내기 (Zustand store 사용)
      const success = await likeStore.sendLike(authorId, content.groupId);
      
      if (success) {
        // 로컬 상태 업데이트 (optimistic update)
        setContents(prevContents => 
          prevContents.map(c => 
            c.id === contentId 
              ? { ...c, likeCount: c.likeCount + 1, isLikedByUser: true }
              : c
          )
        );

        Alert.alert(
          '좋아요 전송 완료! 💕',
          `${content.authorNickname}님에게 익명으로 좋아요를 보냈습니다.\n서로 좋아요를 보내면 매칭됩니다!`
        );
      }
    } catch (error) {
      console.error('Like toggle error:', error);
      Alert.alert('오류', '좋아요 처리 중 오류가 발생했습니다.');
    }
  }, [contents, authStore.user?.id, likeStore]);

  // 콘텐츠 로드 함수 (실제로는 API 호출)
  const loadContents = useCallback(async (refresh = false) => {
    if (refresh) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }

    try {
      // 실제로는 여기서 API 호출
      // const response = await contentAPI.getContents({ page: 1, limit: 10 });
      
      // 임시로 더미 데이터 사용
      await new Promise(resolve => setTimeout(resolve, 1000)); // 로딩 시뮬레이션
      const dummyContents = generateDummyContent();
      
      if (refresh) {
        setContents(dummyContents);
      } else {
        setContents(dummyContents);
      }
    } catch (error) {
      console.error('Failed to load contents:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  // 더 많은 콘텐츠 로드 (무한 스크롤)
  const loadMoreContents = useCallback(async () => {
    if (!hasMoreData || isLoading) return;

    try {
      // 실제로는 다음 페이지 API 호출
      console.log('Loading more contents...');
      // 임시로 더 이상 로드할 데이터가 없다고 설정
      setHasMoreData(false);
    } catch (error) {
      console.error('Failed to load more contents:', error);
    }
  }, [hasMoreData, isLoading]);

  useEffect(() => {
    loadContents();
  }, [loadContents]);

  const renderHeader = () => (
    <View style={styles.header}>
      <Text style={styles.headerTitle}>Glimpse</Text>
      <Text style={styles.headerSubtitle}>
        안녕하세요, {authStore.user?.nickname || '사용자'}님! 👋
      </Text>
      <View style={styles.headerStats}>
        <Text style={styles.statsText}>
          받은 좋아요: {likeStore.getReceivedLikesCount()}개
        </Text>
        <Text style={styles.statsText}>
          남은 좋아요: {likeStore.getRemainingFreeLikes()}개
        </Text>
      </View>
      
      {/* 위치 기반 기능 버튼 */}
      <TouchableOpacity
        style={styles.locationButton}
        onPress={() => navigation.navigate('LocationGroup' as never)}
      >
        <Icon name="location" size={20} color={COLORS.PRIMARY} />
        <Text style={styles.locationButtonText}>근처 그룹 및 사용자</Text>
        <Icon name="chevron-forward" size={16} color={COLORS.TEXT.SECONDARY} />
      </TouchableOpacity>
    </View>
  );

  const renderContentItem = ({ item }: { item: Content }) => (
    <ContentItem
      item={item}
      currentUserId={authStore.user?.id}
      remainingLikes={likeStore.getRemainingFreeLikes()}
      onLikeToggle={handleLikeToggle}
    />
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Text style={styles.emptyStateEmoji}>📱</Text>
      <Text style={styles.emptyStateTitle}>아직 콘텐츠가 없어요</Text>
      <Text style={styles.emptyStateSubtitle}>
        그룹에 참여하거나 첫 번째 게시물을 작성해보세요!
      </Text>
    </View>
  );

  const renderFooter = () => {
    if (!hasMoreData) return null;
    
    return (
      <View style={styles.loadingFooter}>
        <ActivityIndicator size="small" color={COLORS.PRIMARY} />
        <Text style={styles.loadingText}>더 많은 콘텐츠를 불러오는 중...</Text>
      </View>
    );
  };

  if (isLoading && contents.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.PRIMARY} />
          <Text style={styles.loadingText}>콘텐츠를 불러오는 중...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={contents}
        keyExtractor={(item) => item.id}
        renderItem={renderContentItem}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmptyState}
        ListFooterComponent={renderFooter}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={() => loadContents(true)}
            colors={[COLORS.PRIMARY]}
            tintColor={COLORS.PRIMARY}
          />
        }
        onEndReached={loadMoreContents}
        onEndReachedThreshold={0.1}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={contents.length === 0 ? styles.emptyContainer : undefined}
      />
      
      {/* Floating Action Button */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('CreateContent' as never)}
        activeOpacity={0.8}
        accessibilityLabel="새 게시물 작성"
        accessibilityHint="새로운 콘텐츠를 작성할 수 있는 화면으로 이동합니다"
        accessibilityRole="button"
      >
        <Icon name={ACTION_ICONS.CREATE} color="white" size={28} />
      </TouchableOpacity>
    </SafeAreaView>
  );
};


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.BACKGROUND,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: SPACING.MD,
    fontSize: FONT_SIZES.MD,
    color: COLORS.TEXT.SECONDARY,
  },
  header: {
    backgroundColor: COLORS.SURFACE,
    paddingHorizontal: SPACING.LG,
    paddingVertical: SPACING.LG,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.BORDER,
  },
  headerTitle: {
    fontSize: FONT_SIZES.XXL,
    fontWeight: 'bold',
    color: COLORS.PRIMARY,
    marginBottom: SPACING.XS,
  },
  headerSubtitle: {
    fontSize: FONT_SIZES.MD,
    color: COLORS.TEXT.PRIMARY,
    marginBottom: SPACING.MD,
  },
  headerStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  locationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.SURFACE,
    borderRadius: 12,
    padding: SPACING.MD,
    marginTop: SPACING.MD,
    borderWidth: 1,
    borderColor: COLORS.PRIMARY + '20',
  },
  locationButtonText: {
    flex: 1,
    fontSize: FONT_SIZES.MD,
    color: COLORS.TEXT.PRIMARY,
    fontWeight: '500',
    marginLeft: SPACING.SM,
  },
  statsText: {
    fontSize: FONT_SIZES.SM,
    color: COLORS.TEXT.SECONDARY,
    fontWeight: '500',
  },
  emptyContainer: {
    flexGrow: 1,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING.XL,
  },
  emptyStateEmoji: {
    fontSize: 64,
    marginBottom: SPACING.LG,
  },
  emptyStateTitle: {
    fontSize: FONT_SIZES.LG,
    fontWeight: 'bold',
    color: COLORS.TEXT.PRIMARY,
    marginBottom: SPACING.SM,
    textAlign: 'center',
  },
  emptyStateSubtitle: {
    fontSize: FONT_SIZES.MD,
    color: COLORS.TEXT.SECONDARY,
    textAlign: 'center',
    lineHeight: 22,
  },
  loadingFooter: {
    paddingVertical: SPACING.LG,
    alignItems: 'center',
  },
  fab: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.PRIMARY,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
});