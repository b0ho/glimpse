import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  SafeAreaView,
  TouchableOpacity,
  Alert,
  RefreshControl,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAndroidSafeTranslation } from '@/hooks/useAndroidSafeTranslation';
import { useGroupStore } from '@/store/slices/groupSlice';
import { useTheme } from '@/hooks/useTheme';
import { Group, GroupType } from '@/types';
import { cn } from '@/lib/utils';

export const MyGroupsScreen = () => {
  const { t } = useAndroidSafeTranslation('mygroups');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedTab, setSelectedTab] = useState<'joined' | 'created'>('joined');
  
  const navigation = useNavigation();
  const groupStore = useGroupStore();
  const { colors, isDarkMode } = useTheme();

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      // TODO: Call API to refresh group information
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
    const isCreator = item.creatorId === 'current_user'; // TODO: Compare with actual user ID

    return (
      <View 
        className="rounded-xl p-4 mb-4 shadow-sm bg-white dark:bg-gray-800"
        style={{ 
          backgroundColor: colors.SURFACE,
          shadowColor: colors.SHADOW,
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
          elevation: 3,
        }}
      >
        <View className="mb-4">
          <View className="flex-row items-start">
            <Text className="text-2xl mr-4 mt-0.5">
              {renderGroupTypeIcon(item.type)}
            </Text>
            <View className="flex-1">
              <View className="flex-row items-center mb-1">
                <Text 
                  className="text-lg font-bold flex-1"
                  style={{ color: colors.TEXT.PRIMARY }}
                >
                  {item.name}
                </Text>
                {isCreator && (
                  <Text 
                    className="text-xs px-2 py-0.5 rounded-xl ml-2 overflow-hidden"
                    style={{ 
                      color: colors.TEXT.WHITE, 
                      backgroundColor: colors.SUCCESS 
                    }}
                  >
                    {t('myGroups.creatorBadge')}
                  </Text>
                )}
              </View>
              <Text 
                className="text-sm leading-4 mb-1"
                style={{ color: colors.TEXT.SECONDARY }}
                numberOfLines={2}
              >
                {item.description}
              </Text>
              <Text 
                className="text-xs"
                style={{ color: colors.TEXT.LIGHT }}
              >
                {t('myGroups.groupStats', { 
                  memberCount: item.memberCount,
                  matchingStatus: item.isMatchingActive ? t('myGroups.active') : t('myGroups.inactive')
                })}
              </Text>
            </View>
          </View>
        </View>

        <View className="flex-row justify-end space-x-2">
          {isCreator ? (
            <TouchableOpacity
              className="px-4 py-2 rounded-lg min-w-[70px] items-center"
              style={{ backgroundColor: colors.PRIMARY }}
              onPress={() => handleManageGroup(item)}
            >
              <Text 
                className="text-sm font-semibold"
                style={{ color: colors.TEXT.WHITE }}
              >
                {t('myGroups.manageButton')}
              </Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              className="px-4 py-2 rounded-lg min-w-[70px] items-center"
              style={{ backgroundColor: colors.ERROR }}
              onPress={() => handleLeaveGroup(item)}
            >
              <Text 
                className="text-sm font-semibold"
                style={{ color: colors.TEXT.WHITE }}
              >
                {t('myGroups.leaveButton')}
              </Text>
            </TouchableOpacity>
          )}
          
          <TouchableOpacity
            className="px-4 py-2 rounded-lg min-w-[70px] items-center"
            style={{ backgroundColor: colors.TEXT.LIGHT }}
            onPress={() => {
              // TODO: Navigate to group detail page
              Alert.alert(t('myGroups.viewGroup.title'), t('myGroups.viewGroup.message'));
            }}
          >
            <Text 
              className="text-sm font-medium"
              style={{ color: colors.TEXT.PRIMARY }}
            >
              {t('myGroups.viewButton')}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderTabBar = () => (
    <View 
      className="flex-row border-b bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700"
      style={{ 
        backgroundColor: colors.SURFACE, 
        borderBottomColor: colors.BORDER 
      }}
    >
      <TouchableOpacity
        className={cn(
          "flex-1 py-4 items-center border-b-2",
          selectedTab === 'joined' ? "" : "border-transparent"
        )}
        style={{
          borderBottomColor: selectedTab === 'joined' ? colors.PRIMARY : 'transparent'
        }}
        onPress={() => setSelectedTab('joined')}
      >
        <Text
          className={cn(
            "text-sm font-medium",
            selectedTab === 'joined' ? "font-semibold" : ""
          )}
          style={{
            color: selectedTab === 'joined' ? colors.PRIMARY : colors.TEXT.SECONDARY
          }}
        >
          {t('myGroups.joinedTab', { count: groupStore.joinedGroups.length })}
        </Text>
      </TouchableOpacity>
      
      <TouchableOpacity
        className={cn(
          "flex-1 py-4 items-center border-b-2",
          selectedTab === 'created' ? "" : "border-transparent"
        )}
        style={{
          borderBottomColor: selectedTab === 'created' ? colors.PRIMARY : 'transparent'
        }}
        onPress={() => setSelectedTab('created')}
      >
        <Text
          className={cn(
            "text-sm font-medium",
            selectedTab === 'created' ? "font-semibold" : ""
          )}
          style={{
            color: selectedTab === 'created' ? colors.PRIMARY : colors.TEXT.SECONDARY
          }}
        >
          {t('myGroups.createdTab', { count: groupStore.joinedGroups.filter(g => g.creatorId === 'current_user').length })}
        </Text>
      </TouchableOpacity>
    </View>
  );

  const renderHeader = () => (
    <View 
      className="px-6 py-6 border-b bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700"
      style={{ 
        backgroundColor: colors.SURFACE, 
        borderBottomColor: colors.BORDER 
      }}
    >
      <Text 
        className="text-2xl font-bold mb-1"
        style={{ color: colors.PRIMARY }}
      >
        {t('myGroups.title')}
      </Text>
      <Text 
        className="text-base"
        style={{ color: colors.TEXT.PRIMARY }}
      >
        {t('myGroups.subtitle')}
      </Text>
    </View>
  );

  const renderEmptyState = () => (
    <View className="flex-1 justify-center items-center px-8">
      <Text className="text-6xl mb-6">
        {selectedTab === 'joined' ? '👥' : '➕'}
      </Text>
      <Text 
        className="text-lg font-bold mb-3 text-center"
        style={{ color: colors.TEXT.PRIMARY }}
      >
        {selectedTab === 'joined' 
          ? t('myGroups.emptyJoined.title')
          : t('myGroups.emptyCreated.title')
        }
      </Text>
      <Text 
        className="text-base text-center leading-6 mb-8"
        style={{ color: colors.TEXT.SECONDARY }}
      >
        {selectedTab === 'joined'
          ? t('myGroups.emptyJoined.subtitle')
          : t('myGroups.emptyCreated.subtitle')
        }
      </Text>
      <TouchableOpacity
        className="px-6 py-4 rounded-lg"
        style={{ backgroundColor: colors.PRIMARY }}
        onPress={() => {
          if (selectedTab === 'joined') {
            navigation.navigate('Groups' as never);
          } else {
            navigation.navigate('CreateGroup' as never);
          }
        }}
      >
        <Text 
          className="text-base font-semibold"
          style={{ color: colors.TEXT.WHITE }}
        >
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
    <SafeAreaView 
      className="flex-1 bg-gray-50 dark:bg-gray-900"
      style={{ backgroundColor: colors.BACKGROUND }}
    >
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
        contentContainerStyle={
          currentGroups.length === 0 
            ? { flexGrow: 1 } 
            : { padding: 16 }
        }
      />
    </SafeAreaView>
  );
};