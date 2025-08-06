import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Alert,
  RefreshControl,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useGroupStore } from '@/store/slices/groupSlice';
import { Group, GroupType } from '@/types';
import { COLORS, SPACING, FONT_SIZES } from '@/utils/constants';

export const MyGroupsScreen = () => {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedTab, setSelectedTab] = useState<'joined' | 'created'>('joined');
  
  const navigation = useNavigation();
  const groupStore = useGroupStore();

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      // 실제로는 API 호출하여 그룹 정보 새로고침
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (error) {
      console.error('Failed to refresh groups:', error);
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  const handleLeaveGroup = useCallback((group: Group) => {
    Alert.alert(
      '그룹 나가기',
      `정말 "${group.name}" 그룹에서 나가시겠습니까?\n\n나간 후에는 다시 참여해야 그룹 내 활동에 참여할 수 있습니다.`,
      [
        { text: '취소', style: 'cancel' },
        {
          text: '나가기',
          style: 'destructive',
          onPress: () => {
            groupStore.leaveGroup(group.id);
            Alert.alert('완료', `"${group.name}" 그룹에서 나갔습니다.`);
          },
        },
      ]
    );
  }, [groupStore]);

  const handleManageGroup = useCallback((_group: Group) => {
    Alert.alert(
      '그룹 관리',
      '그룹 관리 기능은 곧 추가될 예정입니다.',
      [{ text: '확인' }]
    );
  }, []);

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

  const renderGroupItem = ({ item }: { item: Group }) => {
    const isCreator = item.creatorId === 'current_user'; // TODO: 실제 사용자 ID와 비교

    return (
      <View style={styles.groupItem}>
        <View style={styles.groupHeader}>
          <View style={styles.groupInfo}>
            <Text style={styles.groupIcon}>
              {renderGroupTypeIcon(item.type)}
            </Text>
            <View style={styles.groupDetails}>
              <View style={styles.groupTitleRow}>
                <Text style={styles.groupName}>{item.name}</Text>
                {isCreator && <Text style={styles.creatorBadge}>관리자</Text>}
              </View>
              <Text style={styles.groupDescription} numberOfLines={2}>
                {item.description}
              </Text>
              <Text style={styles.groupStats}>
                멤버 {item.memberCount}명 • 매칭 {item.isMatchingActive ? '활성' : '비활성'}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.groupActions}>
          {isCreator ? (
            <TouchableOpacity
              style={[styles.actionButton, styles.manageButton]}
              onPress={() => handleManageGroup(item)}
            >
              <Text style={styles.manageButtonText}>관리</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[styles.actionButton, styles.leaveButton]}
              onPress={() => handleLeaveGroup(item)}
            >
              <Text style={styles.leaveButtonText}>나가기</Text>
            </TouchableOpacity>
          )}
          
          <TouchableOpacity
            style={[styles.actionButton, styles.viewButton]}
            onPress={() => {
              // TODO: 그룹 상세 페이지로 이동
              Alert.alert('알림', '그룹 상세 보기 기능이 곧 추가됩니다.');
            }}
          >
            <Text style={styles.viewButtonText}>보기</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderTabBar = () => (
    <View style={styles.tabBar}>
      <TouchableOpacity
        style={[
          styles.tabButton,
          selectedTab === 'joined' && styles.tabButtonActive,
        ]}
        onPress={() => setSelectedTab('joined')}
      >
        <Text
          style={[
            styles.tabButtonText,
            selectedTab === 'joined' && styles.tabButtonTextActive,
          ]}
        >
          참여 중인 그룹 ({groupStore.joinedGroups.length})
        </Text>
      </TouchableOpacity>
      
      <TouchableOpacity
        style={[
          styles.tabButton,
          selectedTab === 'created' && styles.tabButtonActive,
        ]}
        onPress={() => setSelectedTab('created')}
      >
        <Text
          style={[
            styles.tabButtonText,
            selectedTab === 'created' && styles.tabButtonTextActive,
          ]}
        >
          내가 만든 그룹 ({groupStore.joinedGroups.filter(g => g.creatorId === 'current_user').length})
        </Text>
      </TouchableOpacity>
    </View>
  );

  const renderHeader = () => (
    <View style={styles.header}>
      <Text style={styles.headerTitle}>내 그룹</Text>
      <Text style={styles.headerSubtitle}>
        참여하고 있는 그룹과 내가 만든 그룹을 관리하세요
      </Text>
    </View>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Text style={styles.emptyStateEmoji}>
        {selectedTab === 'joined' ? '👥' : '➕'}
      </Text>
      <Text style={styles.emptyStateTitle}>
        {selectedTab === 'joined' 
          ? '참여 중인 그룹이 없어요'
          : '만든 그룹이 없어요'
        }
      </Text>
      <Text style={styles.emptyStateSubtitle}>
        {selectedTab === 'joined'
          ? '그룹 탐색에서 관심있는 그룹에 참여해보세요!'
          : '새로운 그룹을 만들어 사람들과 만나보세요!'
        }
      </Text>
      <TouchableOpacity
        style={styles.emptyStateButton}
        onPress={() => {
          if (selectedTab === 'joined') {
            navigation.navigate('Groups' as never);
          } else {
            navigation.navigate('CreateGroup' as never);
          }
        }}
      >
        <Text style={styles.emptyStateButtonText}>
          {selectedTab === 'joined' ? '그룹 탐색하기' : '새 그룹 만들기'}
        </Text>
      </TouchableOpacity>
    </View>
  );

  const getCurrentTabGroups = (): Group[] => {
    if (selectedTab === 'joined') {
      return groupStore.joinedGroups;
    } else {
      return groupStore.joinedGroups.filter(group => group.creatorId === 'current_user');
    }
  };

  const currentGroups = getCurrentTabGroups();

  return (
    <SafeAreaView style={styles.container}>
      {renderHeader()}
      {renderTabBar()}
      
      <FlatList
        data={currentGroups}
        keyExtractor={(item) => item.id}
        renderItem={renderGroupItem}
        ListEmptyComponent={renderEmptyState}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            colors={[COLORS.PRIMARY]}
            tintColor={COLORS.PRIMARY}
          />
        }
        showsVerticalScrollIndicator={false}
        contentContainerStyle={currentGroups.length === 0 ? styles.emptyContainer : styles.listContainer}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.BACKGROUND,
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
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: COLORS.SURFACE,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.BORDER,
  },
  tabButton: {
    flex: 1,
    paddingVertical: SPACING.MD,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: COLORS.TRANSPARENT,
  },
  tabButtonActive: {
    borderBottomColor: COLORS.PRIMARY,
  },
  tabButtonText: {
    fontSize: FONT_SIZES.SM,
    color: COLORS.TEXT.SECONDARY,
    fontWeight: '500',
  },
  tabButtonTextActive: {
    color: COLORS.PRIMARY,
    fontWeight: '600',
  },
  listContainer: {
    padding: SPACING.MD,
  },
  emptyContainer: {
    flexGrow: 1,
  },
  groupItem: {
    backgroundColor: COLORS.SURFACE,
    borderRadius: 12,
    padding: SPACING.MD,
    marginBottom: SPACING.MD,
    elevation: 2,
    shadowColor: COLORS.SHADOW,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  groupHeader: {
    marginBottom: SPACING.MD,
  },
  groupInfo: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  groupIcon: {
    fontSize: 24,
    marginRight: SPACING.MD,
    marginTop: 2,
  },
  groupDetails: {
    flex: 1,
  },
  groupTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.XS,
  },
  groupName: {
    fontSize: FONT_SIZES.LG,
    fontWeight: 'bold',
    color: COLORS.TEXT.PRIMARY,
    flex: 1,
  },
  creatorBadge: {
    fontSize: FONT_SIZES.XS,
    color: COLORS.TEXT.WHITE,
    backgroundColor: COLORS.SUCCESS,
    paddingHorizontal: SPACING.SM,
    paddingVertical: 2,
    borderRadius: 12,
    overflow: 'hidden',
    marginLeft: SPACING.SM,
  },
  groupDescription: {
    fontSize: FONT_SIZES.SM,
    color: COLORS.TEXT.SECONDARY,
    lineHeight: 18,
    marginBottom: SPACING.XS,
  },
  groupStats: {
    fontSize: FONT_SIZES.XS,
    color: COLORS.TEXT.LIGHT,
  },
  groupActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: SPACING.SM,
  },
  actionButton: {
    paddingHorizontal: SPACING.MD,
    paddingVertical: SPACING.SM,
    borderRadius: 8,
    minWidth: 70,
    alignItems: 'center',
  },
  manageButton: {
    backgroundColor: COLORS.PRIMARY,
  },
  manageButtonText: {
    color: COLORS.TEXT.WHITE,
    fontSize: FONT_SIZES.SM,
    fontWeight: '600',
  },
  leaveButton: {
    backgroundColor: COLORS.ERROR,
  },
  leaveButtonText: {
    color: COLORS.TEXT.WHITE,
    fontSize: FONT_SIZES.SM,
    fontWeight: '600',
  },
  viewButton: {
    backgroundColor: COLORS.TEXT.LIGHT,
  },
  viewButtonText: {
    color: COLORS.TEXT.PRIMARY,
    fontSize: FONT_SIZES.SM,
    fontWeight: '500',
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
    marginBottom: SPACING.XL,
  },
  emptyStateButton: {
    backgroundColor: COLORS.PRIMARY,
    paddingHorizontal: SPACING.LG,
    paddingVertical: SPACING.MD,
    borderRadius: 8,
  },
  emptyStateButtonText: {
    color: COLORS.TEXT.WHITE,
    fontSize: FONT_SIZES.MD,
    fontWeight: '600',
  },
});