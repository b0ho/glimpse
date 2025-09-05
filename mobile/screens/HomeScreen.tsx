/**
 * 홈 스크린 컴포넌트 - 모듈화된 버전
 * 
 * 이 파일은 948줄에서 약 250줄로 리팩토링되었습니다.
 * 모든 로직과 컴포넌트가 분리되었습니다.
 */
import React, { useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
  Platform,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useAndroidSafeTranslation } from '@/hooks/useAndroidSafeTranslation';
import { useAuthStore } from '@/store/slices/authSlice';
import { useLikeStore } from '@/store/slices/likeSlice';
import { useGroupStore } from '@/store/slices/groupSlice';
import { useTheme } from '@/hooks/useTheme';
import { Content } from '@/types';
import { ACTION_ICONS } from '@/utils/icons';
import { shadowPresets } from '@/utils/styles/platformStyles';

// Custom hooks
import { useContentData } from '@/hooks/home/useContentData';
import { useLikeHandlers } from '@/hooks/home/useLikeHandlers';
import { useStoryData } from '@/hooks/home/useStoryData';

// Components
import { ContentItem } from '@/components/ContentItem';
import { StoryList } from '@/components/story/StoryList';
import { StoryFullViewer } from '@/components/story/StoryFullViewer';
import { AddStoryModal } from '@/components/story/AddStoryModal';
import { ServerConnectionError } from '@/components/ServerConnectionError';
import { HomeHeader } from '@/components/home/HomeHeader';
import { SuccessStoriesSection } from '@/components/home/SuccessStoriesSection';
import { HomeEmptyState } from '@/components/home/HomeEmptyState';
import { HomeFooter } from '@/components/home/HomeFooter';

/**
 * 홈 스크린 - 메인 피드 및 스토리 표시
 */
export const HomeScreen = () => {
  const authStore = useAuthStore();
  const likeStore = useLikeStore();
  const groupStore = useGroupStore();
  const { colors } = useTheme();
  const { t } = useAndroidSafeTranslation(['navigation']);
  const navigation = useNavigation() as any;

  // 콘텐츠 데이터 관리
  const {
    contents,
    setContents,
    isLoading,
    isRefreshing,
    isLoadingMore,
    hasMoreData,
    serverConnectionError,
    loadContents,
    loadMoreContents,
  } = useContentData();

  // 좋아요 핸들러
  const {
    handleLikeToggle,
    handleEditContent,
    handleDeleteContent,
  } = useLikeHandlers({ contents, setContents, t });

  // 스토리 데이터 관리
  const {
    stories,
    storiesLoading,
    showStoryViewer,
    selectedStoryIndex,
    setShowStoryViewer,
    showAddStoryModal,
    setShowAddStoryModal,
    successStories,
    celebratedStories,
    loadStories,
    loadSuccessStories,
    handleToggleCelebration,
    handleStoryPress,
    handleAddStoryPress,
    handleStoryUpload,
  } = useStoryData();

  // 웹에서 페이지 타이틀 설정
  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.title = t('home:meta.title');
    }
  }, [t]);

  // 화면 포커스 시 데이터 로드
  useFocusEffect(
    useCallback(() => {
      console.log('[HomeScreen] Screen focused - loading data');
      Promise.all([
        loadContents(),
        loadStories(),
        loadSuccessStories()
      ]);
    }, [])
  );

  // 초기 데이터 로드
  useEffect(() => {
    Promise.all([
      loadContents(),
      loadStories(),
      loadSuccessStories()
    ]);
  }, []);

  /**
   * Pull-to-refresh 핸들러
   */
  const handlePullToRefresh = useCallback(async () => {
    console.log('[HomeScreen] Pull-to-refresh triggered');
    await Promise.all([
      loadContents(true),
      loadStories(),
      loadSuccessStories()
    ]);
  }, [loadContents, loadStories, loadSuccessStories]);

  /**
   * 콘텐츠 아이템 렌더링
   */
  const renderContentItem = ({ item }: { item: Content }) => {
    // 그룹 정보 찾기
    const group = groupStore.groups.find(g => g.id === item.groupId);
    const groupName = group?.name || '일반';
    
    return (
      <ContentItem
        item={item}
        currentUserId={authStore.user?.id}
        remainingLikes={likeStore.getRemainingFreeLikes()}
        onLikeToggle={handleLikeToggle}
        onEdit={handleEditContent}
        onDelete={handleDeleteContent}
        groupName={groupName}
      />
    );
  };

  // 서버 연결 에러 시 에러 화면 표시
  if (serverConnectionError) {
    return (
      <ServerConnectionError 
        onRetry={() => loadContents(true)}
        message="홈 피드를 불러올 수 없습니다"
      />
    );
  }

  // 초기 로딩 상태
  if (isLoading && contents.length === 0) {
    return (
      <SafeAreaView 
        style={[styles.container, { backgroundColor: colors.BACKGROUND }]} 
        edges={Platform.OS === 'android' ? ['top'] : ['top', 'bottom']}
      >
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.PRIMARY} />
          <Text style={[styles.loadingText, { color: colors.TEXT.PRIMARY }]}>
            {t('home:loading.content')}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView 
      style={[styles.container, { backgroundColor: colors.BACKGROUND }]} 
      edges={Platform.OS === 'android' ? ['top'] : ['top', 'bottom']}
    >
      <FlatList
        data={contents}
        keyExtractor={(item) => item.id}
        renderItem={renderContentItem}
        ListHeaderComponent={
          <>
            {/* 스토리 리스트 - 최상단에 위치 */}
            <StoryList
              stories={stories}
              onStoryPress={handleStoryPress}
              onAddStoryPress={handleAddStoryPress}
              currentUserId={authStore.user?.id || ''}
              isLoading={storiesLoading}
              onRefresh={loadStories}
              refreshing={false}
            />
            
            {/* 헤더 */}
            <HomeHeader 
              t={t}
              remainingLikes={likeStore.getRemainingFreeLikes()}
              receivedLikesCount={likeStore.getReceivedLikesCount()}
              userName={authStore.user?.nickname}
            />
            
            {/* 성공 스토리 섹션 */}
            <SuccessStoriesSection
              successStories={successStories}
              celebratedStories={celebratedStories}
              onToggleCelebration={handleToggleCelebration}
              t={t}
            />
          </>
        }
        ListEmptyComponent={<HomeEmptyState t={t} />}
        ListFooterComponent={
          <HomeFooter
            hasMoreData={hasMoreData}
            isLoadingMore={isLoadingMore}
            contentsLength={contents.length}
            t={t}
          />
        }
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handlePullToRefresh}
            tintColor={colors.PRIMARY}
            colors={[colors.PRIMARY]}
            progressBackgroundColor={colors.SURFACE}
            title={t('home:loading.pullToRefresh')}
            titleColor={colors.TEXT.SECONDARY}
          />
        }
        onEndReached={loadMoreContents}
        onEndReachedThreshold={0.5}
        contentContainerStyle={contents.length === 0 ? styles.emptyContainer : undefined}
        showsVerticalScrollIndicator={false}
      />

      {/* 스토리 뷰어 */}
      {showStoryViewer && (
        <StoryFullViewer
          visible={showStoryViewer}
          stories={stories}
          initialIndex={selectedStoryIndex}
          onClose={() => setShowStoryViewer(false)}
          currentUserId={authStore.user?.id || ''}
        />
      )}
      
      {/* 스토리 추가 모달 */}
      <AddStoryModal
        visible={showAddStoryModal}
        onClose={() => setShowAddStoryModal(false)}
        onSubmit={handleStoryUpload}
      />
      
      {/* FAB - 게시물 작성 버튼 */}
      <TouchableOpacity
        style={[styles.fab, { backgroundColor: colors.PRIMARY }]}
        onPress={() => navigation.navigate('CreateContent' as never)}
        activeOpacity={0.8}
        accessibilityLabel="게시물 작성"
        accessibilityHint="새로운 게시물을 작성할 수 있는 화면으로 이동합니다"
        accessibilityRole="button"
      >
        <Icon name={ACTION_ICONS.CREATE} color={colors.TEXT.WHITE} size={28} />
      </TouchableOpacity>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
  },
  emptyContainer: {
    flexGrow: 1,
  },
  fab: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadowPresets.fab,
  },
});