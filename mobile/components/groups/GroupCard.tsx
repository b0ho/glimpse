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
    navigation.navigate('GroupDetail' as never, { groupId: group.id } as never);
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
      navigation.navigate('GroupDetail' as never, { groupId: group.id } as never);
    }
  };

  const handleLikePress = (e: any) => {
    e.stopPropagation();
    groupStore.toggleGroupLike(group.id);
  };

  return (
    <TouchableOpacity
      className="groupCard"
      onPress={handleGroupPress}
      activeOpacity={0.8}
    >
      <View className="groupHeader">
        <View className="groupInfo">
          <Text className="groupName">{group.name}</Text>
          <View className="groupMeta">
            <View className="groupTypeBadge">
              <Text className="groupTypeText">
                {getGroupTypeLabel(group.type)}
              </Text>
            </View>
            <View className="memberCount">
              <Icon name="people-outline" size={16} color={colors.TEXT.SECONDARY} />
              <Text className="memberCountText">
                {group.memberCount}명
              </Text>
            </View>
          </View>
        </View>

        {isCreator && (
          <View className="creatorBadge">
            <Icon name="star" size={14} color={colors.PRIMARY} />
            <Text className="creatorText">내 그룹</Text>
          </View>
        )}
      </View>

      {group.description && (
        <Text 
          className="groupDescription"
          numberOfLines={2}
        >
          {group.description}
        </Text>
      )}

      <View className="groupFooter">
        <View className="statusInfo">
          {group.location && (
            <Text className="locationText">
              📍 {group.location.address}
            </Text>
          )}
          
          {group.expiresAt && (
            <Text className="expiryText">
              ⏰ {new Date(group.expiresAt).toLocaleDateString()}
            </Text>
          )}
        </View>

        <View className="groupActions">
          <TouchableOpacity
            className="likeButton"
            onPress={handleLikePress}
          >
            <Icon 
              name={groupStore.isGroupLiked(group.id) ? "heart" : "heart-outline"} 
              size={20} 
              color={groupStore.isGroupLiked(group.id) ? colors.ERROR : colors.TEXT.SECONDARY} 
            />
          </TouchableOpacity>

          <TouchableOpacity
            className="joinButton"
            onPress={handleJoinPress}
          >
            <Text className="joinButtonText">
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

