import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
  ScrollView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useAndroidSafeTranslation } from '@/hooks/useAndroidSafeTranslation';
import Icon from 'react-native-vector-icons/Ionicons';
import { useGroupStore } from '@/store/slices/groupSlice';
import { useAuthStore } from '@/store/slices/authSlice';
import { useTheme } from '@/hooks/useTheme';
import { Group, GroupType } from '@/types';
import { COLORS, SPACING, FONT_SIZES } from '@/utils/constants';
import { ACTION_ICONS } from '@/utils/icons';
import { groupApi } from '@/services/api/groupApi';

/**
 * 그룹 탐색 화면 컴포넌트 - 다양한 타입의 그룹 목록 표시
 * @component
 * @returns {JSX.Element} 그룹 목록 화면 UI
 * @description 공식/생성/인스턴트/위치 기반 그룹을 탐색하고 참여할 수 있는 화면
 */
export const GroupsScreen = () => {
  const { t } = useAndroidSafeTranslation('group');
  const { colors } = useTheme();
  const [groups, setGroups] = useState<Group[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefreshTime, setLastRefreshTime] = useState<Date | null>(null);
  const [hasMoreData, setHasMoreData] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  
  const navigation = useNavigation();
  const groupStore = useGroupStore();
  const authStore = useAuthStore();

  /**
   * 3일 이내 그룹만 필터링
   * @param {Group[]} groups - 필터링할 그룹 배열
   * @returns {Group[]} 필터링된 그룹 배열
   */
  const filterRecentGroups = useCallback((groups: Group[]): Group[] => {
    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
    threeDaysAgo.setHours(0, 0, 0, 0); // 자정부터 시작
    
    return groups.filter(group => {
      const groupDate = new Date(group.createdAt);
      return groupDate >= threeDaysAgo;
    });
  }, []);

  /**
   * 그룹 목록 로드
   * @param {boolean} refresh - 새로고침 여부
   * @param {number} page - 페이지 번호
   * @returns {Promise<void>}
   * @description 서버에서 그룹 목록을 가져와 표시하는 함수
   */
  const loadGroups = useCallback(async (refresh = false, page = 1) => {
    console.log('[GroupsScreen] loadGroups called, refresh:', refresh, 'page:', page);
    
    // 인스타그램 스타일: 너무 빠른 연속 새로고침 방지 (2초 이내)
    if (refresh && lastRefreshTime) {
      const timeSinceLastRefresh = Date.now() - lastRefreshTime.getTime();
      if (timeSinceLastRefresh < 2000) {
        console.log('[GroupsScreen] 새로고침 제한: 너무 빠른 연속 새로고침');
        return;
      }
    }
    
    if (refresh) {
      setIsRefreshing(true);
      setLastRefreshTime(new Date());
      setCurrentPage(1);
    } else if (page > 1) {
      setIsLoadingMore(true);
    } else {
      setIsLoading(true);
    }

    try {
      // API 호출하여 그룹 목록 가져오기
      console.log('[GroupsScreen] API를 통한 그룹 목록 로드 시작');
      const loadedGroups = await groupApi.getGroups({ page, limit: 10 });
      console.log('[GroupsScreen] API에서 로드된 그룹 수:', loadedGroups.length);
      
      // API 응답이 없거나 에러인 경우 테스트 데이터 사용
      if (!loadedGroups || loadedGroups.length === 0) {
        // 현재 날짜 기준으로 테스트 데이터 생성 (3일 이내)
        const now = new Date();
        const testGroups: Group[] = [
          {
            id: `test-group-${page}-1`,
            name: `서강대학교 IT학과 (Page ${page})`,
            description: '서강대학교 IT학과 학생들의 모임입니다. 코딩, 공모전, 취업 정보를 공유합니다.',
            type: 'OFFICIAL' as any,
            memberCount: 45 + page,
            maleCount: 23 + page,
            femaleCount: 22,
            isMatchingActive: true,
            creatorId: 'user-creator',
            createdAt: new Date(now.getTime() - (page - 1) * 60 * 60 * 1000).toISOString(),
            updatedAt: new Date(now.getTime() - (page - 1) * 60 * 60 * 1000).toISOString(),
            location: {
              address: '서울 마포구 서강대로',
              latitude: 37.5503,
              longitude: 126.9413
            }
          },
          {
            id: `test-group-${page}-2`,
            name: `홍대 경영학과 모임 (Page ${page})`,
            description: '홍대 경영학과 학생들이 모여 스터디, 네트워킹, 취업 준비를 함께합니다.',
            type: 'OFFICIAL' as any,
            memberCount: 38 + page,
            maleCount: 20 + page,
            femaleCount: 18,
            isMatchingActive: true,
            creatorId: 'user-creator2',
            createdAt: new Date(now.getTime() - (page - 1) * 60 * 60 * 1000 - 60 * 60 * 1000).toISOString(),
            updatedAt: new Date(now.getTime() - (page - 1) * 60 * 60 * 1000 - 60 * 60 * 1000).toISOString(),
            location: {
              address: '서울 마포구 와우산로',
              latitude: 37.5502,
              longitude: 126.9225
            }
          },
          {
            id: `test-group-${page}-3`,
            name: `강남 커피 러버즈 (Page ${page})`,
            description: '강남역 근처 커피숙에서 모이는 커피 애호가들의 모임입니다.',
            type: 'CREATED' as any,
            memberCount: 28 + page,
            maleCount: 15 + page,
            femaleCount: 13,
            isMatchingActive: true,
            creatorId: 'user-creator3',
            createdAt: new Date(now.getTime() - (page - 1) * 60 * 60 * 1000 - 2 * 60 * 60 * 1000).toISOString(),
            updatedAt: new Date(now.getTime() - (page - 1) * 60 * 60 * 1000 - 2 * 60 * 60 * 1000).toISOString(),
            location: {
              address: '서울 강남구 강남역',
              latitude: 37.4979,
              longitude: 127.0276
            }
          }
        ];
        
        console.log('[GroupsScreen] Using test groups for page:', page);
        
        // 3일 이내 그룹만 필터링
        const recentTestGroups = filterRecentGroups(testGroups);
        
        if (refresh || page === 1) {
          setGroups(recentTestGroups);
          groupStore.setGroups(recentTestGroups);
          setCurrentPage(1);
        } else {
          setGroups(prevGroups => [...prevGroups, ...recentTestGroups]);
          setCurrentPage(page);
        }
        
        // 테스트 데이터의 경우 5페이지까지만 로드
        setHasMoreData(page < 5 && recentTestGroups.length > 0);
        return;
      }
      
      console.log('[GroupsScreen] Setting real groups:', loadedGroups.length);
      
      // 3일 이내 그룹만 필터링
      const recentGroups = filterRecentGroups(loadedGroups);
      console.log('[GroupsScreen] Filtered recent groups:', recentGroups.length, '/ original:', loadedGroups.length);
      
      if (refresh || page === 1) {
        setGroups(recentGroups);
        groupStore.setGroups(recentGroups);
        setCurrentPage(1);
      } else {
        setGroups(prevGroups => [...prevGroups, ...recentGroups]);
        setCurrentPage(page);
      }
      
      // 더 이상 로드할 데이터가 있는지 확인
      // API에서 받은 데이터가 10개 미만이거나, 필터링 후 데이터가 없으면 끝
      setHasMoreData(loadedGroups.length >= 10 && recentGroups.length > 0);
    } catch (error: any) {
      console.error('[GroupsScreen] 그룹 목록 로드 실패:', error);
      // 에러 시 fallback 데이터
      if (page === 1) {
        const fallbackGroups: Group[] = [
          {
            id: 'fallback-group-1',
            name: '기본 그룹',
            description: '기본 그룹 설명입니다.',
            type: 'CREATED' as any,
            memberCount: 10,
            maleCount: 5,
            femaleCount: 5,
            isMatchingActive: true,
            creatorId: 'fallback-user',
            createdAt: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
            updatedAt: new Date(Date.now() - 60 * 60 * 1000).toISOString()
          }
        ];
        const recentFallbackGroups = filterRecentGroups(fallbackGroups);
        setGroups(recentFallbackGroups);
        setHasMoreData(false); // 에러 시에는 추가 로드 안함
      }
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
      setIsLoadingMore(false);
    }
  }, [filterRecentGroups]); // 필수 의존성만 유지

  /**
   * Pull-to-refresh 핸들러
   * @returns {Promise<void>}
   * @description 인스타그램 스타일의 pull-to-refresh 동작을 처리하는 함수
   */
  const handlePullToRefresh = useCallback(async () => {
    console.log('[GroupsScreen] Pull-to-refresh triggered - 인스타그램 스타일 새로고침');
    await loadGroups(true);
  }, [loadGroups]);

  /**
   * 추가 그룹 로드 (무한 스크롤)
   * @returns {Promise<void>}
   * @description 스크롤 끝에 도달했을 때 추가 그룹을 로드하는 함수
   */
  const loadMoreGroups = useCallback(async () => {
    console.log('[GroupsScreen] loadMoreGroups called:', { hasMoreData, isLoading, isLoadingMore, currentPage });
    
    if (!hasMoreData || isLoading || isLoadingMore) {
      console.log('[GroupsScreen] 무한 스크롤 중단:', { hasMoreData, isLoading, isLoadingMore });
      return;
    }

    console.log('[GroupsScreen] 무한 스크롤: 다음 페이지 로드 시작', { nextPage: currentPage + 1 });
    await loadGroups(false, currentPage + 1);
  }, [hasMoreData, isLoading, isLoadingMore, currentPage, loadGroups]);

  /**
   * 그룹 참여 핸들러
   * @param {Group} group - 참여할 그룹 객체
   * @returns {Promise<void>}
   * @description 성별 균형 및 참여 조건을 확인하고 그룹에 참여하는 함수
   */
  const handleJoinGroup = useCallback(async (group: Group) => {
    // 이미 참여한 그룹인지 확인
    if (groupStore.isUserInGroup(group.id)) {
      Alert.alert(t('common:status.notification'), t('group:alerts.alreadyJoined'));
      return;
    }

    // 성별 균형 확인 (실제로는 백엔드에서 처리)
    const genderRatio = (group.maleCount || 0) / (group.femaleCount || 1);
    if (group.maleCount && group.femaleCount && (genderRatio > 2 || genderRatio < 0.5)) {
      Alert.alert(
        t('group:alerts.joinTitle'),
        t('group:alerts.joinRestricted'),
        [{ text: t('common:buttons.confirm') }]
      );
      return;
    }

    Alert.alert(
      t('group:alerts.joinTitle'),
      t('group:alerts.joinConfirm', { name: group.name }),
      [
        { text: t('common:buttons.cancel'), style: 'cancel' },
        {
          text: t('group:alerts.join'),
          onPress: async () => {
            try {
              // API 호출하여 그룹 참여
              await groupApi.joinGroup(group.id);
              
              // Store 업데이트 (async로 변경됨)
              await groupStore.joinGroup(group.id);
              Alert.alert(
                t('group:join.success.title'),
                t('group:join.success.message', { groupName: group.name })
              );
              
              // 로컬 상태 업데이트
              setGroups(prevGroups =>
                prevGroups.map(g =>
                  g.id === group.id
                    ? { ...g, memberCount: g.memberCount + 1 }
                    : g
                )
              );
            } catch (error) {
              console.error('Join group error:', error);
              Alert.alert(t('common:status.error'), t('group:alerts.error'));
            }
          },
        },
      ]
    );
  }, [groupStore]);

  useEffect(() => {
    loadGroups();
  }, []); // 빈 의존성 배열로 마운트 시에만 실행

  // 화면으로 돌아올 때 그룹 목록 새로고침
  useFocusEffect(
    useCallback(() => {
      console.log('[GroupsScreen] 화면 포커스 - 그룹 목록 새로고침 시작');
      // 초기 로딩이 완료된 후에만 새로고침
      // 첫 마운트 시에는 useEffect가 이미 로드했으므로 스킵
      if (!isLoading && groups.length > 0) {
        loadGroups(true);
      }
      return () => {
        // cleanup 함수에서 상태 초기화 방지
      };
    }, []) // 빈 의존성 배열로 변경
  );

  /**
   * 그룹 타입 아이콘 렌더링
   * @param {GroupType} type - 그룹 타입
   * @returns {string} 이모티콘 문자
   * @description 그룹 타입에 따른 아이콘을 반환
   */
  const renderGroupTypeIcon = (type: GroupType): string => {
    switch (type) {
      case GroupType.OFFICIAL:
        return '🏢';
      case GroupType.CREATED:
        return '👥';
      case GroupType.INSTANCE:
        return '⏰';
      case GroupType.LOCATION:
        return '📍';
      default:
        return '🔵';
    }
  };

  /**
   * 그룹 타입 이름 렌더링
   * @param {GroupType} type - 그룹 타입
   * @returns {string} 한글 그룹 타입명
   * @description 그룹 타입을 한글 이름으로 변환
   */
  const renderGroupTypeName = (type: GroupType): string => {
    switch (type) {
      case GroupType.OFFICIAL:
        return t('group:types.official');
      case GroupType.CREATED:
        return t('group:types.created');
      case GroupType.INSTANCE:
        return t('group:types.instance');
      case GroupType.LOCATION:
        return t('group:types.location');
      default:
        return t('group:types.general');
    }
  };

  /**
   * 그룹 아이템 렌더링
   * @param {Object} params - 리스트 아이템 파라미터
   * @param {Group} params.item - 그룹 객체
   * @param {boolean} params.isCreator - 생성자 여부
   * @returns {JSX.Element} 그룹 카드 UI
   * @description 각 그룹의 정보를 카드 형태로 표시
   */
  const renderGroupItem = ({ item, isCreator = false }: { item: Group; isCreator?: boolean }) => (
    <TouchableOpacity 
      style={[styles.groupItem, { backgroundColor: colors.SURFACE, shadowColor: colors.SHADOW }]}
      onPress={() => navigation.navigate('GroupDetail' as never, { groupId: item.id } as never)}
      activeOpacity={0.7}
    >
      <View style={styles.groupHeader}>
        <View style={styles.groupInfo}>
          <Text style={styles.groupIcon}>
            {renderGroupTypeIcon(item.type)}
          </Text>
          <View style={styles.groupDetails}>
            <Text style={[styles.groupName, { color: colors.TEXT.PRIMARY }]}>{item.name}</Text>
            <Text style={[styles.groupType, { color: colors.TEXT.SECONDARY }]}>
              {renderGroupTypeName(item.type)}
            </Text>
          </View>
        </View>
        
        <View style={styles.memberInfo}>
          <Text style={[styles.memberCount, { color: colors.TEXT.SECONDARY }]}>
            {t('group:members.count', { count: item.memberCount })}
          </Text>
          <Text style={[styles.genderBalance, { color: colors.TEXT.LIGHT }]}>
            👨 {item.maleCount} · 👩 {item.femaleCount}
          </Text>
        </View>
      </View>

      {item.description && (
        <Text style={[styles.groupDescription, { color: colors.TEXT.PRIMARY }]}>
          {item.description}
        </Text>
      )}

      <View style={styles.groupFooter}>
        <View style={styles.statusInfo}>
          {item.location && (
            <Text style={styles.locationText}>
              📍 {item.location.address}
            </Text>
          )}
          
          {item.expiresAt && (
            <Text style={styles.expiryText}>
              ⏰ {t('group:status.expiresAt', { date: item.expiresAt.toLocaleDateString() })}
            </Text>
          )}
        </View>

        <View style={styles.groupActions}>
          <TouchableOpacity
            style={[styles.likeButton, groupStore.isGroupLiked(item.id) && { backgroundColor: colors.ERROR + '20' }]}
            onPress={(e) => {
              e.stopPropagation();
              groupStore.toggleGroupLike(item.id);
            }}
          >
            <Icon 
              name={groupStore.isGroupLiked(item.id) ? "heart" : "heart-outline"} 
              size={20} 
              color={groupStore.isGroupLiked(item.id) ? colors.ERROR : colors.TEXT.SECONDARY} 
            />
          </TouchableOpacity>

          <TouchableOpacity
          style={[
            styles.joinButton,
            isCreator && { backgroundColor: colors.ERROR + '20', borderWidth: 1, borderColor: colors.ERROR },
            groupStore.isUserInGroup(item.id) && !isCreator && styles.joinButtonDisabled,
            !item.isMatchingActive && styles.joinButtonInactive,
          ]}
          onPress={() => {
            if (isCreator) {
              // 내가 만든 그룹은 나가기 확인
              Alert.alert(
                t('main.leave.title'),
                t('main.leave.confirmMessage'),
                [
                  { text: t('main.leave.cancel'), style: 'cancel' },
                  {
                    text: t('main.leave.confirm'),
                    style: 'destructive',
                    onPress: () => {
                      groupStore.leaveGroup(item.id);
                      Alert.alert(t('main.leave.successTitle'), t('main.leave.successMessage'));
                    },
                  },
                ]
              );
            } else {
              // 그룹 상세 화면으로 이동
              navigation.navigate('GroupDetail' as never, { groupId: item.id } as never);
            }
          }}
        >
          <Text style={[
            styles.joinButtonText,
            isCreator && { color: colors.ERROR },
            groupStore.isUserInGroup(item.id) && !isCreator && styles.joinButtonTextDisabled,
          ]}>
            {isCreator ? t('main.actions.leaveGroup') : (groupStore.isUserInGroup(item.id) ? t('main.actions.joined') : t('main.actions.viewDetails'))}
          </Text>
        </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );

  /**
   * 헤더 렌더링
   * @returns {JSX.Element} 헤더 UI
   * @description 그룹 탐색 화면의 헤더 영역
   */
  const renderHeader = () => (
    <View style={[styles.header, { backgroundColor: colors.SURFACE, borderBottomColor: colors.BORDER }]}>
      <Text style={[styles.headerTitle, { color: colors.PRIMARY }]}>{t('main.title')}</Text>
      <Text style={[styles.headerSubtitle, { color: colors.TEXT.PRIMARY }]}>
        {t('main.subtitle')}
      </Text>
      
      {/* 그룹 생성 및 찾기 버튼 */}
      <View style={styles.actionButtons}>
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: colors.PRIMARY }]}
          onPress={() => navigation.navigate('CreateGroup' as never)}
        >
          <Icon name="add-circle-outline" size={20} color="#FFFFFF" />
          <Text style={styles.actionButtonText}>{t('main.actions.createGroup')}</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: colors.BACKGROUND, borderColor: colors.PRIMARY, borderWidth: 1 }]}
          onPress={() => navigation.navigate('JoinGroup' as never, { inviteCode: '' } as never)}
        >
          <Icon name="search-outline" size={20} color={colors.PRIMARY} />
          <Text style={[styles.actionButtonText, { color: colors.PRIMARY }]}>{t('main.actions.findGroup')}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  /**
   * 빈 상태 렌더링
   * @returns {JSX.Element} 빈 상태 UI
   * @description 그룹이 없을 때 표시되는 UI
   */
  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Text style={styles.emptyStateEmoji}>🔍</Text>
      <Text style={[styles.emptyStateTitle, { color: colors.TEXT.PRIMARY }]}>{t('group:explore.empty.title')}</Text>
      <Text style={[styles.emptyStateSubtitle, { color: colors.TEXT.SECONDARY }]}>
        {t('group:explore.empty.subtitle')}
      </Text>
    </View>
  );

  /**
   * 풋터 렌더링
   * @returns {JSX.Element | null} 풋터 UI
   * @description 무한 스크롤 로딩 표시 및 마지막 안내
   */
  const renderFooter = () => {
    console.log('[GroupsScreen] renderFooter:', { hasMoreData, isLoadingMore, groupsLength: groups.length });
    
    if (isLoadingMore) {
      return (
        <View style={styles.loadingFooter}>
          <ActivityIndicator size="small" color={colors.PRIMARY} />
          <Text style={[styles.loadingText, { color: colors.TEXT.PRIMARY }]}>
            {t('group:loading.moreGroups')}
          </Text>
        </View>
      );
    }
    
    if (!hasMoreData && groups.length > 0) {
      return (
        <View style={styles.endReachedFooter}>
          <Text style={[styles.endReachedText, { color: colors.TEXT.SECONDARY }]}>
            {t('group:loading.endReached')}
          </Text>
          <Text style={[styles.endReachedSubtext, { color: colors.TEXT.SECONDARY }]}>
            {t('group:loading.noMoreGroups')}
          </Text>
        </View>
      );
    }
    
    return null;
  };

  if (isLoading && groups.length === 0) {
    return (
      <SafeAreaView 
        style={[styles.container, { backgroundColor: colors.BACKGROUND }]} 
        edges={Platform.OS === 'android' ? ['top'] : ['top', 'bottom']}
      >
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.PRIMARY} />
          <Text style={[styles.loadingText, { color: colors.TEXT.PRIMARY }]}>{t('group:loading.groups')}</Text>
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
        renderItem={({ item }) => renderGroupItem({ item })}
        ListHeaderComponent={
          <>
            {renderHeader()}
            
            {/* 내가 만든 그룹 섹션 */}
            {groupStore.joinedGroups.filter(g => g.creatorId === authStore.user?.id).length > 0 && (
              <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: colors.TEXT.PRIMARY }]}>
                  {t('main.sections.myCreatedGroups')}
                </Text>
                {groupStore.joinedGroups
                  .filter(g => g.creatorId === authStore.user?.id)
                  .map(group => (
                    <View key={group.id} style={styles.groupItemWrapper}>
                      {renderGroupItem({ item: group, isCreator: true })}
                    </View>
                  ))}
              </View>
            )}
            
            {/* 내가 참여한 그룹 섹션 */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.TEXT.PRIMARY }]}>
                {t('main.sections.myJoinedGroups')}
              </Text>
              {groupStore.joinedGroups.filter(g => g.creatorId !== authStore.user?.id).length > 0 ? (
                groupStore.joinedGroups
                  .filter(g => g.creatorId !== authStore.user?.id)
                  .map(group => (
                    <View key={group.id} style={styles.groupItemWrapper}>
                      {renderGroupItem({ item: group })}
                    </View>
                  ))
              ) : (
                <View style={styles.emptySection}>
                  <Text style={[styles.emptyText, { color: colors.TEXT.SECONDARY }]}>
                    {t('main.empty.noJoinedGroups')}
                  </Text>
                  <TouchableOpacity
                    style={[styles.findGroupButton, { backgroundColor: colors.PRIMARY }]}
                    onPress={() => navigation.navigate('JoinGroup' as never, { inviteCode: '' } as never)}
                  >
                    <Text style={styles.findGroupButtonText}>{t('main.actions.findGroupsButton')}</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
            
            {/* 추천 그룹 섹션 */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.TEXT.PRIMARY }]}>
                추천 그룹
              </Text>
            </View>
          </>
        }
        ListEmptyComponent={renderEmptyState}
        ListFooterComponent={renderFooter}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handlePullToRefresh}
            colors={[colors.PRIMARY]}
            tintColor={colors.PRIMARY}
            backgroundColor={colors.SURFACE}
            title={t('group:loading.groups')}
            titleColor={colors.TEXT.SECONDARY}
          />
        }
        onEndReached={loadMoreGroups}
        onEndReachedThreshold={0.3}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={groups.length === 0 ? styles.emptyContainer : styles.listContainer}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.BACKGROUND,
  },
  listContainer: {
    flexGrow: 1,
    paddingBottom: SPACING.XL,
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
  joinedGroupsInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  joinedCount: {
    fontSize: FONT_SIZES.SM,
    color: COLORS.TEXT.SECONDARY,
    fontWeight: '500',
  },
  myGroupsSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: SPACING.MD,
    paddingTop: SPACING.MD,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
  },
  myGroupsTitle: {
    fontSize: FONT_SIZES.MD,
    fontWeight: '600',
  },
  myGroupsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
  },
  myGroupsButtonText: {
    color: '#FFFFFF',
    fontSize: FONT_SIZES.SM,
    fontWeight: '600',
    marginRight: 4,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: SPACING.MD,
    gap: SPACING.SM,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING.MD,
    paddingVertical: SPACING.SM,
    borderRadius: 12,
    gap: SPACING.XS,
  },
  actionButtonText: {
    fontSize: FONT_SIZES.SM,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  section: {
    marginTop: SPACING.MD,
    paddingHorizontal: SPACING.MD,
  },
  sectionTitle: {
    fontSize: FONT_SIZES.LG,
    fontWeight: '700',
    marginBottom: SPACING.SM,
  },
  emptySection: {
    alignItems: 'center',
    paddingVertical: SPACING.XL,
  },
  emptyText: {
    fontSize: FONT_SIZES.MD,
    marginBottom: SPACING.MD,
  },
  findGroupButton: {
    paddingHorizontal: SPACING.LG,
    paddingVertical: SPACING.SM,
    borderRadius: 20,
  },
  findGroupButtonText: {
    color: '#FFFFFF',
    fontSize: FONT_SIZES.SM,
    fontWeight: '600',
  },
  groupItem: {
    backgroundColor: COLORS.SURFACE,
    marginVertical: SPACING.XS,
    borderRadius: 12,
    padding: SPACING.MD,
    elevation: 2,
    shadowColor: COLORS.SHADOW,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  groupItemWrapper: {
    marginBottom: SPACING.SM,
  },
  loadingFooter: {
    paddingVertical: SPACING.LG,
    alignItems: 'center',
  },
  endReachedFooter: {
    paddingVertical: SPACING.XL,
    alignItems: 'center',
    marginTop: SPACING.MD,
  },
  endReachedText: {
    fontSize: FONT_SIZES.MD,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: SPACING.XS,
  },
  endReachedSubtext: {
    fontSize: FONT_SIZES.SM,
    textAlign: 'center',
  },
  groupHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.SM,
  },
  groupInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  groupIcon: {
    fontSize: 24,
    marginRight: SPACING.SM,
  },
  groupDetails: {
    flex: 1,
  },
  groupName: {
    fontSize: FONT_SIZES.LG,
    fontWeight: 'bold',
    color: COLORS.TEXT.PRIMARY,
    marginBottom: 2,
  },
  groupType: {
    fontSize: FONT_SIZES.SM,
    color: COLORS.TEXT.SECONDARY,
  },
  memberInfo: {
    alignItems: 'flex-end',
  },
  memberCount: {
    fontSize: FONT_SIZES.MD,
    fontWeight: 'bold',
    color: COLORS.PRIMARY,
    marginBottom: 2,
  },
  genderBalance: {
    fontSize: FONT_SIZES.XS,
    color: COLORS.TEXT.SECONDARY,
  },
  groupDescription: {
    fontSize: FONT_SIZES.SM,
    color: COLORS.TEXT.PRIMARY,
    lineHeight: 20,
    marginBottom: SPACING.MD,
  },
  groupFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  statusInfo: {
    flex: 1,
  },
  groupActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.SM,
  },
  likeButton: {
    padding: SPACING.SM,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.BORDER,
  },
  matchingStatus: {
    fontSize: FONT_SIZES.SM,
    fontWeight: '500',
    marginBottom: 4,
  },
  statusActive: {
    color: COLORS.SUCCESS,
  },
  statusInactive: {
    color: COLORS.ERROR,
  },
  locationText: {
    fontSize: FONT_SIZES.XS,
    color: COLORS.TEXT.SECONDARY,
    marginBottom: 2,
  },
  expiryText: {
    fontSize: FONT_SIZES.XS,
    color: COLORS.WARNING,
  },
  joinButton: {
    backgroundColor: COLORS.PRIMARY,
    paddingHorizontal: SPACING.MD,
    paddingVertical: SPACING.SM,
    borderRadius: 8,
    minWidth: 80,
    alignItems: 'center',
  },
  joinButtonDisabled: {
    backgroundColor: COLORS.TEXT.LIGHT,
  },
  joinButtonInactive: {
    backgroundColor: COLORS.TEXT.LIGHT,
  },
  joinButtonText: {
    color: COLORS.TEXT.WHITE,
    fontSize: FONT_SIZES.SM,
    fontWeight: '600',
  },
  joinButtonTextDisabled: {
    color: COLORS.TEXT.SECONDARY,
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
  createGroupFab: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.SUCCESS,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: COLORS.SHADOW,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
});