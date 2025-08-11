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
import { useTranslation } from 'react-i18next';
import Icon from 'react-native-vector-icons/Ionicons';
import { useGroupStore } from '@/store/slices/groupSlice';
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
  const { t } = useTranslation(['group', 'common']);
  const [groups, setGroups] = useState<Group[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  const navigation = useNavigation();
  const groupStore = useGroupStore();

  /**
   * 그룹 목록 로드
   * @param {boolean} refresh - 새로고침 여부
   * @returns {Promise<void>}
   * @description 서버에서 그룹 목록을 가져와 표시하는 함수
   */
  const loadGroups = useCallback(async (refresh = false) => {
    if (refresh) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }

    try {
      // API 호출하여 그룹 목록 가져오기
      const loadedGroups = await groupApi.getGroups();
      setGroups(loadedGroups);
      groupStore.setGroups(loadedGroups);
    } catch (error: any) {
      console.error('[GroupsScreen] 그룹 목록 로드 실패:', error);
      Alert.alert(t('common:status.error'), error?.message || t('group:errors.loadFailed'));
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [groupStore]);

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
              
              groupStore.joinGroup(group);
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
  }, []); // 빈 의존성 배열로 변경하여 무한 루프 방지

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
        return '공식 그룹';
      case GroupType.CREATED:
        return '생성 그룹';
      case GroupType.INSTANCE:
        return '이벤트 그룹';
      case GroupType.LOCATION:
        return '장소 그룹';
      default:
        return '일반 그룹';
    }
  };

  /**
   * 그룹 아이템 렌더링
   * @param {Object} params - 리스트 아이템 파라미터
   * @param {Group} params.item - 그룹 객체
   * @returns {JSX.Element} 그룹 카드 UI
   * @description 각 그룹의 정보를 카드 형태로 표시
   */
  const renderGroupItem = ({ item }: { item: Group }) => (
    <View style={styles.groupItem}>
      <View style={styles.groupHeader}>
        <View style={styles.groupInfo}>
          <Text style={styles.groupIcon}>
            {renderGroupTypeIcon(item.type)}
          </Text>
          <View style={styles.groupDetails}>
            <Text style={styles.groupName}>{item.name}</Text>
            <Text style={styles.groupType}>
              {renderGroupTypeName(item.type)}
            </Text>
          </View>
        </View>
        
        <View style={styles.memberInfo}>
          <Text style={styles.memberCount}>
            {item.memberCount}명
          </Text>
          <Text style={styles.genderBalance}>
            👨 {item.maleCount} · 👩 {item.femaleCount}
          </Text>
        </View>
      </View>

      {item.description && (
        <Text style={styles.groupDescription}>
          {item.description}
        </Text>
      )}

      <View style={styles.groupFooter}>
        <View style={styles.statusInfo}>
          <Text style={[
            styles.matchingStatus,
            item.isMatchingActive ? styles.statusActive : styles.statusInactive
          ]}>
            {item.isMatchingActive ? '🟢 매칭 활성' : '🔴 매칭 비활성'}
          </Text>
          
          {item.location && (
            <Text style={styles.locationText}>
              📍 {item.location.address}
            </Text>
          )}
          
          {item.expiresAt && (
            <Text style={styles.expiryText}>
              ⏰ {item.expiresAt.toLocaleDateString('ko-KR')}까지
            </Text>
          )}
        </View>

        <TouchableOpacity
          style={[
            styles.joinButton,
            groupStore.isUserInGroup(item.id) && styles.joinButtonDisabled,
            !item.isMatchingActive && styles.joinButtonInactive,
          ]}
          onPress={() => handleJoinGroup(item)}
          disabled={groupStore.isUserInGroup(item.id) || !item.isMatchingActive}
        >
          <Text style={[
            styles.joinButtonText,
            groupStore.isUserInGroup(item.id) && styles.joinButtonTextDisabled,
          ]}>
            {groupStore.isUserInGroup(item.id) ? t('group:explore.joined') : t('group:explore.join')}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  /**
   * 헤더 렌더링
   * @returns {JSX.Element} 헤더 UI
   * @description 그룹 탐색 화면의 헤더 영역
   */
  const renderHeader = () => (
    <View style={styles.header}>
      <Text style={styles.headerTitle}>그룹 탐색</Text>
      <Text style={styles.headerSubtitle}>
        관심사와 소속이 비슷한 사람들을 만나보세요
      </Text>
      <View style={styles.joinedGroupsInfo}>
        <Text style={styles.joinedCount}>
          참여 중인 그룹: {groupStore.joinedGroups.length}개
        </Text>
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
      <Text style={styles.emptyStateTitle}>{t('group:explore.empty.title')}</Text>
      <Text style={styles.emptyStateSubtitle}>
        {t('group:explore.empty.subtitle')}
      </Text>
    </View>
  );

  if (isLoading && groups.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.PRIMARY} />
          <Text style={styles.loadingText}>{t('group:loading.groups')}</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={groups}
        keyExtractor={(item) => item.id}
        renderItem={renderGroupItem}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmptyState}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={() => loadGroups(true)}
            colors={[COLORS.PRIMARY]}
            tintColor={COLORS.PRIMARY}
          />
        }
        showsVerticalScrollIndicator={false}
        contentContainerStyle={groups.length === 0 ? styles.emptyContainer : undefined}
      />
      
      {/* Create Group Floating Action Button */}
      <TouchableOpacity
        style={styles.createGroupFab}
        onPress={() => navigation.navigate('CreateGroup' as never)}
        activeOpacity={0.8}
        accessibilityLabel="새 그룹 만들기"
        accessibilityHint="새로운 그룹을 생성할 수 있는 화면으로 이동합니다"
        accessibilityRole="button"
      >
        <Icon name={ACTION_ICONS.ADD} color="white" size={32} />
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
  joinedGroupsInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  joinedCount: {
    fontSize: FONT_SIZES.SM,
    color: COLORS.TEXT.SECONDARY,
    fontWeight: '500',
  },
  groupItem: {
    backgroundColor: COLORS.SURFACE,
    marginVertical: SPACING.XS,
    marginHorizontal: SPACING.MD,
    borderRadius: 12,
    padding: SPACING.MD,
    elevation: 2,
    shadowColor: COLORS.SHADOW,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
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