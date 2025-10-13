/**
 * 그룹 카드 컴포넌트
 */
import React from 'react';
import { View, Text, TouchableOpacity, Alert } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { Group } from '@/types';
import { useTheme } from '@/hooks/useTheme';
import { useGroupStore } from '@/store/slices/groupSlice';
import { useAuthStore } from '@/store/slices/authSlice';
import { useNavigation } from '@react-navigation/native';
import { useAndroidSafeTranslation } from '@/hooks/useAndroidSafeTranslation';
import { shadowStyles } from '@/utils/shadowStyles';

interface GroupCardProps {
  group: Group;
}

export const GroupCard: React.FC<GroupCardProps> = ({ group }) => {
  const { colors } = useTheme();
  const { t } = useAndroidSafeTranslation('group');
  const navigation = useNavigation();
  const groupStore = useGroupStore();
  const authStore = useAuthStore();
  
  const isCreator = authStore.user?.id === group.creatorId;

  const getGroupTypeLabel = (type: string): string => {
    const typeMap: Record<string, string> = {
      OFFICIAL: t('group:types.official'),
      CREATED: t('group:types.created'),
      INSTANCE: t('group:types.instance'),
      LOCATION: t('group:types.location'),
    };
    return typeMap[type] || type;
  };

  const getGroupTypeColor = (type: string): string => {
    const colorMap: Record<string, string> = {
      OFFICIAL: colors.SUCCESS,
      CREATED: colors.INFO,
      INSTANCE: colors.WARNING,
      LOCATION: colors.PRIMARY,
    };
    return colorMap[type] || colors.SECONDARY;
  };

  const handleGroupPress = () => {
    (navigation as any).navigate('GroupDetail', { groupId: group.id });
  };

  const handleJoinPress = () => {
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
              groupStore.leaveGroup(group.id);
              Alert.alert(t('main.leave.successTitle'), t('main.leave.successMessage'));
            },
          },
        ]
      );
    } else {
      // 그룹 상세 화면으로 이동
      (navigation as any).navigate('GroupDetail', { groupId: group.id });
    }
  };

  const handleLikePress = (e: any) => {
    e.stopPropagation();
    groupStore.toggleGroupLike(group.id);
  };

  return (
    <TouchableOpacity
      className="mx-4 my-2 p-4 bg-white dark:bg-gray-800 rounded-xl"
      onPress={handleGroupPress}
      activeOpacity={0.8}
      style={shadowStyles.medium}
    >
      <View className="flex-row items-start justify-between mb-3">
        <View className="flex-1 mr-2">
          <Text className="text-base font-bold text-gray-900 dark:text-gray-100 mb-2">
            {group.name}
          </Text>
          <View className="flex-row items-center gap-x-2">
            <View className="px-2 py-1 rounded-md" style={{ backgroundColor: getGroupTypeColor(group.type) + '20' }}>
              <Text className="text-xs font-medium" style={{ color: getGroupTypeColor(group.type) }}>
                {getGroupTypeLabel(group.type)}
              </Text>
            </View>
            <View className="flex-row items-center">
              <Icon name="people-outline" size={16} color={colors.TEXT.SECONDARY} />
              <Text className="text-xs text-gray-600 dark:text-gray-400 ml-1">
                {group.memberCount}명
              </Text>
            </View>
          </View>
        </View>

        {isCreator && (
          <View className="flex-row items-center px-2 py-1 bg-purple-50 dark:bg-purple-900/20 rounded-md">
            <Icon name="star" size={14} color={colors.PRIMARY} />
            <Text className="text-xs font-medium text-purple-600 dark:text-purple-400 ml-1">
              내 그룹
            </Text>
          </View>
        )}
      </View>

      {group.description && (
        <Text
          className="text-sm text-gray-700 dark:text-gray-300 mb-3"
          numberOfLines={2}
        >
          {group.description}
        </Text>
      )}

      <View className="flex-row items-center justify-between">
        <View className="flex-1">
          {group.location && (
            <Text className="text-xs text-gray-600 dark:text-gray-400 mb-1">
              📍 {group.location.address}
            </Text>
          )}

          {group.expiresAt && (
            <Text className="text-xs text-gray-600 dark:text-gray-400">
              ⏰ {new Date(group.expiresAt).toLocaleDateString()}
            </Text>
          )}
        </View>

        <View className="flex-row items-center gap-x-2">
          <TouchableOpacity
            className="w-10 h-10 items-center justify-center"
            onPress={handleLikePress}
          >
            <Icon
              name={groupStore.isGroupLiked(group.id) ? "heart" : "heart-outline"}
              size={20}
              color={groupStore.isGroupLiked(group.id) ? colors.ERROR : colors.TEXT.SECONDARY}
            />
          </TouchableOpacity>

          <TouchableOpacity
            className="px-4 py-2 bg-red-500 rounded-lg"
            onPress={handleJoinPress}
          >
            <Text className="text-xs font-semibold text-white">
              {isCreator
                ? t('main.actions.leaveGroup')
                : (groupStore.isUserInGroup(group.id)
                    ? t('main.actions.joined')
                    : t('main.actions.viewDetails'))}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
};

