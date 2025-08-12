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
import { useTranslation } from 'react-i18next';
import { useGroupStore } from '@/store/slices/groupSlice';
import { useTheme } from '@/hooks/useTheme';
import { Group, GroupType } from '@/types';
import { COLORS, SPACING, FONT_SIZES } from '@/utils/constants';

export const MyGroupsScreen = () => {
  const { t } = useTranslation('group');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedTab, setSelectedTab] = useState<'joined' | 'created'>('joined');
  
  const navigation = useNavigation();
  const groupStore = useGroupStore();
  const { colors } = useTheme();

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
      t('myGroups.leaveGroup.title'),
      t('myGroups.leaveGroup.message', { groupName: group.name }),
      [
        { text: t('myGroups.leaveGroup.cancel'), style: 'cancel' },
        {
          text: t('myGroups.leaveGroup.confirm'),
          style: 'destructive',
          onPress: () => {
            groupStore.leaveGroup(group.id);
            Alert.alert(t('myGroups.leaveGroup.successTitle'), t('myGroups.leaveGroup.successMessage', { groupName: group.name }));
          },
        },
      ]
    );
  }, [groupStore, t]);

  const handleManageGroup = useCallback((_group: Group) => {
    Alert.alert(
      t('myGroups.manageGroup.title'),
      t('myGroups.manageGroup.message'),
      [{ text: t('myGroups.manageGroup.confirm') }]
    );
  }, [t]);

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
      <View style={[styles.groupItem, { backgroundColor: colors.SURFACE, shadowColor: colors.SHADOW }]}>
        <View style={styles.groupHeader}>
          <View style={styles.groupInfo}>
            <Text style={styles.groupIcon}>
              {renderGroupTypeIcon(item.type)}
            </Text>
            <View style={styles.groupDetails}>
              <View style={styles.groupTitleRow}>
                <Text style={[styles.groupName, { color: colors.TEXT.PRIMARY }]}>{item.name}</Text>
                {isCreator && <Text style={[styles.creatorBadge, { color: colors.TEXT.WHITE, backgroundColor: colors.SUCCESS }]}>{t('myGroups.creatorBadge')}</Text>}
              </View>
              <Text style={[styles.groupDescription, { color: colors.TEXT.SECONDARY }]} numberOfLines={2}>
                {item.description}
              </Text>
              <Text style={[styles.groupStats, { color: colors.TEXT.LIGHT }]}>
                {t('myGroups.groupStats', { 
                  memberCount: item.memberCount,
                  matchingStatus: item.isMatchingActive ? t('myGroups.active') : t('myGroups.inactive')
                })}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.groupActions}>
          {isCreator ? (
            <TouchableOpacity
              style={[styles.actionButton, styles.manageButton, { backgroundColor: colors.PRIMARY }]}
              onPress={() => handleManageGroup(item)}
            >
              <Text style={[styles.manageButtonText, { color: colors.TEXT.WHITE }]}>{t('myGroups.manageButton')}</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[styles.actionButton, styles.leaveButton, { backgroundColor: colors.ERROR }]}
              onPress={() => handleLeaveGroup(item)}
            >
              <Text style={[styles.leaveButtonText, { color: colors.TEXT.WHITE }]}>{t('myGroups.leaveButton')}</Text>
            </TouchableOpacity>
          )}
          
          <TouchableOpacity
            style={[styles.actionButton, styles.viewButton, { backgroundColor: colors.TEXT.LIGHT }]}
            onPress={() => {
              // TODO: Navigate to group detail page
              Alert.alert(t('myGroups.viewGroup.title'), t('myGroups.viewGroup.message'));
            }}
          >
            <Text style={[styles.viewButtonText, { color: colors.TEXT.PRIMARY }]}>{t('myGroups.viewButton')}</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderTabBar = () => (
    <View style={[styles.tabBar, { backgroundColor: colors.SURFACE, borderBottomColor: colors.BORDER }]}>
      <TouchableOpacity
        style={[
          styles.tabButton,
          selectedTab === 'joined' && [styles.tabButtonActive, { borderBottomColor: colors.PRIMARY }],
        ]}
        onPress={() => setSelectedTab('joined')}
      >
        <Text
          style={[
            [styles.tabButtonText, { color: colors.TEXT.SECONDARY }],
            selectedTab === 'joined' && [styles.tabButtonTextActive, { color: colors.PRIMARY }],
          ]}
        >
          {t('myGroups.joinedTab', { count: groupStore.joinedGroups.length })}
        </Text>
      </TouchableOpacity>
      
      <TouchableOpacity
        style={[
          styles.tabButton,
          selectedTab === 'created' && [styles.tabButtonActive, { borderBottomColor: colors.PRIMARY }],
        ]}
        onPress={() => setSelectedTab('created')}
      >
        <Text
          style={[
            [styles.tabButtonText, { color: colors.TEXT.SECONDARY }],
            selectedTab === 'created' && [styles.tabButtonTextActive, { color: colors.PRIMARY }],
          ]}
        >
          {t('myGroups.createdTab', { count: groupStore.joinedGroups.filter(g => g.creatorId === 'current_user').length })}
        </Text>
      </TouchableOpacity>
    </View>
  );

  const renderHeader = () => (
    <View style={[styles.header, { backgroundColor: colors.SURFACE, borderBottomColor: colors.BORDER }]}>
      <Text style={[styles.headerTitle, { color: colors.PRIMARY }]}>{t('myGroups.title')}</Text>
      <Text style={[styles.headerSubtitle, { color: colors.TEXT.PRIMARY }]}>
        {t('myGroups.subtitle')}
      </Text>
    </View>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Text style={styles.emptyStateEmoji}>
        {selectedTab === 'joined' ? '👥' : '➕'}
      </Text>
      <Text style={[styles.emptyStateTitle, { color: colors.TEXT.PRIMARY }]}>
        {selectedTab === 'joined' 
          ? t('myGroups.emptyJoined.title')
          : t('myGroups.emptyCreated.title')
        }
      </Text>
      <Text style={[styles.emptyStateSubtitle, { color: colors.TEXT.SECONDARY }]}>
        {selectedTab === 'joined'
          ? t('myGroups.emptyJoined.subtitle')
          : t('myGroups.emptyCreated.subtitle')
        }
      </Text>
      <TouchableOpacity
        style={[styles.emptyStateButton, { backgroundColor: colors.PRIMARY }]}
        onPress={() => {
          if (selectedTab === 'joined') {
            navigation.navigate('Groups' as never);
          } else {
            navigation.navigate('CreateGroup' as never);
          }
        }}
      >
        <Text style={[styles.emptyStateButtonText, { color: colors.TEXT.WHITE }]}>
          {selectedTab === 'joined' ? t('myGroups.emptyJoined.button') : t('myGroups.emptyCreated.button')}
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
    <SafeAreaView style={[styles.container, { backgroundColor: colors.BACKGROUND }]}>
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
            colors={[colors.PRIMARY]}
            tintColor={colors.PRIMARY}
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