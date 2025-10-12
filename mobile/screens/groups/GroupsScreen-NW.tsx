/**
 * 그룹 탐색 화면
 *
 * @screen
 * @description 다양한 타입의 그룹 목록을 탐색하고 검색하는 메인 화면
 */

import React, { useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  RefreshControl,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useIsFocused } from '@react-navigation/native';
import { useAndroidSafeTranslation } from '@/hooks/useAndroidSafeTranslation';
import { useTheme } from '@/hooks/useTheme';

// Custom hooks
import { useGroupData } from '@/hooks/groups/useGroupData';

// Components
import { GroupCard } from '@/components/groups/GroupCard';
import { GroupsHeader } from '@/components/groups/GroupsHeader';
import { GroupsEmptyState } from '@/components/groups/GroupsEmptyState';
import { GroupsFooter } from '@/components/groups/GroupsFooter';
import { ServerConnectionError } from '@/components/ServerConnectionError';

/**
 * 그룹 탐색 화면 컴포넌트
 *
 * @component
 * @returns {JSX.Element}
 *
 * @description
 * 다양한 타입의 그룹을 탐색하고 검색하는 메인 화면
 * - 모든 그룹 목록 표시 (공식, 일반, 장소, 이벤트)
 * - 무한 스크롤 페이지네이션
 * - Pull-to-refresh 기능
 * - 서버 연결 에러 처리
 * - 빈 상태 UI
 * - 로딩 상태 표시
 * - 그룹 카드 컴포넌트로 구성
 *
 * @navigation
 * - From: 하단 탭 바의 Groups 탭
 * - To: 그룹 상세 화면, 그룹 생성 화면
 *
 * @example
 * ```tsx
 * <Tab.Screen
 *   name="Groups"
 *   component={GroupsScreen}
 *   options={{ title: '그룹' }}
 * />
 * ```
 */
export const GroupsScreen = () => {
  const isFocused = useIsFocused();
  const { t } = useAndroidSafeTranslation('group');
  const { colors } = useTheme();
  
  // 그룹 데이터 관리 훅
  const {
    groups,
    isLoading,
    isRefreshing,
    isLoadingMore,
    hasMoreData,
    serverConnectionError,
    loadGroups,
    handleLoadMore,
  } = useGroupData();

  // 화면 포커스 시 데이터 로드
  useFocusEffect(
    React.useCallback(() => {
      console.log('[GroupsScreen] Screen focused - loading groups');
      loadGroups();
      return () => {
        console.log('[GroupsScreen] Screen unfocused');
      };
    }, [])
  );

  // 초기 로드
  useEffect(() => {
    loadGroups();
  }, []);

  // 새로고침 핸들러
  const handleRefresh = () => {
    loadGroups(true);
  };

  // 웹에서 포커스되지 않은 경우 빈 View 반환
  if (Platform.OS === 'web' && !isFocused) {
    return <View className="flex-1" />;
  }

  // 서버 연결 에러 시 에러 화면 표시
  if (serverConnectionError) {
    return (
      <ServerConnectionError 
        onRetry={() => {
          loadGroups(true);
        }}
        message="그룹 목록을 불러올 수 없습니다"
      />
    );
  }

  // 초기 로딩 상태
  if (isLoading && groups.length === 0) {
    return (
      <SafeAreaView 
        className="flex-1 bg-gray-50 dark:bg-gray-900"
        edges={Platform.OS === 'android' ? ['top'] : ['top', 'bottom']}
      >
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color={colors.PRIMARY} />
          <Text className="mt-3 text-base text-gray-900 dark:text-gray-100">
            {t('group:loading.groups')}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView 
      className="flex-1 bg-gray-50 dark:bg-gray-900"
      edges={Platform.OS === 'android' ? ['top'] : ['top', 'bottom']}
    >
      <FlatList
        data={groups}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <GroupCard group={item} />}
        ListHeaderComponent={
          <>
            <GroupsHeader t={t} />
            {groups.length === 0 && <GroupsEmptyState t={t} />}
          </>
        }
        ListFooterComponent={
          <GroupsFooter
            hasMoreData={hasMoreData}
            isLoadingMore={isLoadingMore}
            groupsLength={groups.length}
            t={t}
          />
        }
        ListEmptyComponent={groups.length === 0 ? null : <GroupsEmptyState t={t} />}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor={colors.PRIMARY}
            colors={[colors.PRIMARY]}
            progressBackgroundColor={colors.SURFACE}
            title={t('group:loading.pullToRefresh')}
            titleColor={colors.TEXT.SECONDARY}
          />
        }
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
        contentContainerStyle={groups.length === 0 ? { flexGrow: 1 } : { paddingBottom: 20 }}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
};