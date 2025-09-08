/**
 * 그룹 카드 컴포넌트
 */
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
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
      style={[styles.groupCard, { backgroundColor: colors.SURFACE }]}
      onPress={handleGroupPress}
      activeOpacity={0.8}
    >
      <View style={styles.groupHeader}>
        <View style={styles.groupInfo}>
          <Text style={[styles.groupName, { color: colors.TEXT.PRIMARY }]}>{group.name}</Text>
          <View style={styles.groupMeta}>
            <View style={[styles.groupTypeBadge, { backgroundColor: getGroupTypeColor(group.type) + '20' }]}>
              <Text style={[styles.groupTypeText, { color: getGroupTypeColor(group.type) }]}>
                {getGroupTypeLabel(group.type)}
              </Text>
            </View>
            <View style={styles.memberCount}>
              <Icon name="people-outline" size={16} color={colors.TEXT.SECONDARY} />
              <Text style={[styles.memberCountText, { color: colors.TEXT.SECONDARY }]}>
                {group.memberCount}명
              </Text>
            </View>
          </View>
        </View>

        {isCreator && (
          <View style={[styles.creatorBadge, { backgroundColor: colors.PRIMARY + '20' }]}>
            <Icon name="star" size={14} color={colors.PRIMARY} />
            <Text style={[styles.creatorText, { color: colors.PRIMARY }]}>내 그룹</Text>
          </View>
        )}
      </View>

      {group.description && (
        <Text 
          style={[styles.groupDescription, { color: colors.TEXT.SECONDARY }]}
          numberOfLines={2}
        >
          {group.description}
        </Text>
      )}

      <View style={styles.groupFooter}>
        <View style={styles.statusInfo}>
          {group.location && (
            <Text style={[styles.locationText, { color: colors.TEXT.TERTIARY }]}>
              📍 {group.location.address}
            </Text>
          )}
          
          {group.expiresAt && (
            <Text style={[styles.expiryText, { color: colors.TEXT.TERTIARY }]}>
              ⏰ {new Date(group.expiresAt).toLocaleDateString()}
            </Text>
          )}
        </View>

        <View style={styles.groupActions}>
          <TouchableOpacity
            style={[
              styles.likeButton, 
              groupStore.isGroupLiked(group.id) && { backgroundColor: colors.ERROR + '20' }
            ]}
            onPress={handleLikePress}
          >
            <Icon 
              name={groupStore.isGroupLiked(group.id) ? "heart" : "heart-outline"} 
              size={20} 
              color={groupStore.isGroupLiked(group.id) ? colors.ERROR : colors.TEXT.SECONDARY} 
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.joinButton,
              isCreator && { backgroundColor: colors.ERROR + '20', borderWidth: 1, borderColor: colors.ERROR },
              groupStore.isUserInGroup(group.id) && !isCreator && styles.joinButtonDisabled,
              !group.isMatchingActive && styles.joinButtonInactive,
              { backgroundColor: colors.PRIMARY }
            ]}
            onPress={handleJoinPress}
          >
            <Text style={[
              styles.joinButtonText,
              isCreator && { color: colors.ERROR },
              groupStore.isUserInGroup(group.id) && !isCreator && styles.joinButtonTextDisabled,
              { color: colors.TEXT.WHITE }
            ]}>
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

const styles = StyleSheet.create({
  groupCard: {
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 12,
    ...shadowStyles.card,
  },
  groupHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  groupInfo: {
    flex: 1,
  },
  groupName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  groupMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  groupTypeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  groupTypeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  memberCount: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  memberCountText: {
    fontSize: 12,
  },
  creatorBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  creatorText: {
    fontSize: 11,
    fontWeight: '600',
  },
  groupDescription: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  groupFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusInfo: {
    flex: 1,
    gap: 4,
  },
  locationText: {
    fontSize: 12,
  },
  expiryText: {
    fontSize: 12,
  },
  groupActions: {
    flexDirection: 'row',
    gap: 8,
  },
  likeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  joinButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  joinButtonDisabled: {
    opacity: 0.5,
  },
  joinButtonInactive: {
    opacity: 0.7,
  },
  joinButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  joinButtonTextDisabled: {
    opacity: 0.5,
  },
});