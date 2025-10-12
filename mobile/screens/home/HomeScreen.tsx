/**
 * 홈 화면 (Home Screen)
 *
 * @screen
 * @description 메인 피드 및 스토리를 표시하는 메인 홈 화면
 * - 무한 스크롤 피드
 * - 상단 스토리 리스트
 * - Pull-to-refresh 기능
 * - 좋아요/댓글/공유 인터랙션
 */

/**
 * 홈 화면 컴포넌트
 *
 * @component
 * @returns {JSX.Element} 홈 피드 화면 UI
 *
 * @description
 * 사용자의 메인 피드를 표시하는 핵심 화면
 * - 스토리 리스트: 24시간 제한, 이미지/비디오 스토리
 * - 콘텐츠 피드: 그룹별 게시물, 무한 스크롤
 * - 성공 스토리: 매칭 성공 사례 표시
 * - 좋아요 시스템: 일일 무료 좋아요 제한, 프리미엄 무제한
 * - Pull-to-refresh: 최신 콘텐츠 갱신
 * - FAB 버튼: 새 게시물 작성
 *
 * @navigation
 * - From: Main Tab Navigator (기본 홈 탭)
 * - To: CreateContent, PostDetail, Profile 등
 *
 * @example
 * ```tsx
 * // Tab Navigator에서 사용
 * <Tab.Screen name="HomeTab" component={HomeScreen} />
 * ```
 */
import React, { useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  RefreshControl,
  ActivityIndicator,
  Platform,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation, useIsFocused } from '@react-navigation/native';
import { useAuth } from '@/hooks/useAuth';
import Icon from 'react-native-vector-icons/Ionicons';
import { useAndroidSafeTranslation } from '@/hooks/useAndroidSafeTranslation';
import { useAuthStore } from '@/store/slices/authSlice';
import { useLikeStore } from '@/store/slices/likeSlice';
import { useGroupStore } from '@/store/slices/groupSlice';
import { useTheme } from '@/hooks/useTheme';
import { Content } from '@/types';
import { ACTION_ICONS } from '@/utils/icons';
import { cn } from '@/lib/utils';

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
  const isFocused = useIsFocused();
  const authStore = useAuthStore();
  const likeStore = useLikeStore();
  const groupStore = useGroupStore();
  const { colors } = useTheme();
  const { t } = useAndroidSafeTranslation(['navigation', 'home', 'common']);
  const navigation = useNavigation() as any;
  const { isSignedIn, isLoaded } = useAuth();

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
      if (!isLoaded || !isSignedIn) {
        return;
      }
      console.log('[HomeScreen] Screen focused - loading data');
      Promise.all([loadContents(), loadStories(), loadSuccessStories()]);
    }, [isLoaded, isSignedIn, loadContents, loadStories, loadSuccessStories])
  );

  // 초기 데이터 로드
  useEffect(() => {
    if (!isLoaded || !isSignedIn) {
      return;
    }
    Promise.all([loadContents(), loadStories(), loadSuccessStories()]);
  }, [isLoaded, isSignedIn, loadContents, loadStories, loadSuccessStories]);

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
    // 그룹 정보 찾기 (배열 검증 추가)
    const groups = Array.isArray(groupStore.groups) ? groupStore.groups : [];
    const group = groups.find(g => g.id === item.groupId);
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

  // 비로그인: 매력적인 안내 화면
  if (!isSignedIn) {
    return (
      <SafeAreaView className="flex-1 bg-background dark:bg-background-dark">
        <ServerConnectionError 
          onRetry={() => {}}
          message={t('home:loading.content')}
        />
      </SafeAreaView>
    );
  }

  // 웹에서 포커스되지 않은 경우 빈 View 반환
  if (Platform.OS === 'web' && !isFocused) {
    return <View className="flex-1" />;
  }

  // 서버 연결 에러 시 에러 화면 표시
  if (serverConnectionError) {
    return (
      <SafeAreaView className="flex-1 bg-background dark:bg-background-dark">
        <ServerConnectionError 
          onRetry={() => loadContents(true)}
          message={t('common:errors.loadErrors.homeFeed')}
        />
      </SafeAreaView>
    );
  }

  // 초기 로딩 상태
  if (isLoading && contents.length === 0) {
    return (
      <SafeAreaView 
        className="flex-1 bg-background dark:bg-background-dark"
        edges={Platform.OS === 'android' ? ['top'] : ['top', 'bottom']}
      >
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#FF6B6B" />
          <Text className="mt-3 text-base text-foreground dark:text-foreground-dark">
            {t('home:loading.content')}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView 
      className="flex-1 bg-background dark:bg-background-dark"
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
        contentContainerStyle={contents.length === 0 ? { flexGrow: 1 } : undefined}
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
        className={cn(
          'absolute bottom-5 right-5 w-14 h-14 rounded-full',
          'bg-pink-500 dark:bg-pink-600',
          'justify-center items-center',
          Platform.select({
            ios: 'shadow-lg',
            android: 'elevation-8',
            web: 'shadow-xl'
          })
        )}
        onPress={() => navigation.navigate('CreateContent' as never)}
        activeOpacity={0.9}
        accessibilityLabel={t('home:createPost')}
        accessibilityHint={t('home:fab.createPost')}
        accessibilityRole="button"
      >
        <Icon name={ACTION_ICONS.CREATE} color="white" size={28} />
      </TouchableOpacity>
    </SafeAreaView>
  );
};