/**
 * 그룹 탐색 화면 컴포넌트 - 모듈화된 버전
 * 
 * 이 파일은 978줄에서 약 200줄로 리팩토링되었습니다.
 * 모든 로직과 컴포넌트가 분리되었습니다.
 */
import React, { useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
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
 * 그룹 탐색 화면 - 다양한 타입의 그룹 목록 표시
 */
export const GroupsScreen = () => {
  const isFocused = useIsFocused();
  const { t } = useAndroidSafeTranslation(['group', 'common']);
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
    return <View style={styles.container} />;
  }

  // 서버 연결 에러 시 에러 화면 표시
  if (serverConnectionError) {
    return (
      <ServerConnectionError 
        onRetry={() => {
          loadGroups(true);
        }}
        message={t('common:errors.loadErrors.groups')}
      />
    );
  }

  // 초기 로딩 상태
  if (isLoading && groups.length === 0) {
    return (
      <SafeAreaView 
        style={[styles.container, { backgroundColor: colors.BACKGROUND }]} 
        edges={Platform.OS === 'android' ? ['top'] : ['top', 'bottom']}
      >
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.PRIMARY} />
          <Text style={[styles.loadingText, { color: colors.TEXT.PRIMARY }]}>
            {t('group:loading.groups')}
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
        contentContainerStyle={groups.length === 0 ? styles.emptyContainer : styles.contentContainer}
        showsVerticalScrollIndicator={false}
      />
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
  contentContainer: {
    paddingBottom: 20,
  },
  emptyContainer: {
    flexGrow: 1,
  },
});