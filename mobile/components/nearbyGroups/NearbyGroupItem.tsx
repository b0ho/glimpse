import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { LocationGroup } from '@/types/nearbyGroups';
import { useTheme } from '@/hooks/useTheme';
import { shadowStyles } from '@/utils/shadowStyles';
import { SPACING, FONT_SIZES } from '@/utils/constants';

interface NearbyGroupItemProps {
  group: LocationGroup;
  onPress: (group: LocationGroup) => void;
  onJoin: (group: LocationGroup) => void;
  onLeave: (group: LocationGroup) => void;
  formatDistance: (meters: number) => string;
  t: (key: string) => string;
}

export const NearbyGroupItem: React.FC<NearbyGroupItemProps> = ({
  group,
  onPress,
  onJoin,
  onLeave,
  formatDistance,
  t,
}) => {
  const { colors } = useTheme();

  const getRemainingTime = () => {
    if (!group.expiresAt) return null;
    
    const now = new Date();
    const expires = new Date(group.expiresAt);
    const diffMs = expires.getTime() - now.getTime();
    
    if (diffMs <= 0) return t('nearbygroups:expired');
    
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 0) {
      return t('nearbygroups:hoursRemaining', { hours });
    }
    return t('nearbygroups:minutesRemaining', { minutes });
  };

  return (
    <TouchableOpacity
      style={[styles.groupCard, { backgroundColor: colors.SURFACE }]}
      onPress={() => onPress(group)}
      activeOpacity={0.7}
    >
      <View style={styles.groupHeader}>
        <View style={styles.groupInfo}>
          <Text style={[styles.groupName, { color: colors.TEXT.PRIMARY }]}>
            {group.name}
          </Text>
          <Text style={[styles.groupDescription, { color: colors.TEXT.SECONDARY }]}>
            {group.description}
          </Text>
        </View>
        {group.isJoined && (
          <View style={[styles.joinedBadge, { backgroundColor: colors.SUCCESS + '20' }]}>
            <Text style={[styles.joinedText, { color: colors.SUCCESS }]}>
              {t('nearbygroups:joined')}
            </Text>
          </View>
        )}
      </View>

      <View style={styles.groupStats}>
        <View style={styles.statItem}>
          <Icon name="location-outline" size={16} color={colors.TEXT.SECONDARY} />
          <Text style={[styles.statText, { color: colors.TEXT.SECONDARY }]}>
            {formatDistance(group.distance || 0)}
          </Text>
        </View>
        
        <View style={styles.statItem}>
          <Icon name="people-outline" size={16} color={colors.TEXT.SECONDARY} />
          <Text style={[styles.statText, { color: colors.TEXT.SECONDARY }]}>
            {t('nearbygroups:memberCount', { 
              count: group.activeMembers,
              total: group.memberCount 
            })}
          </Text>
        </View>
        
        {group.expiresAt && (
          <View style={styles.statItem}>
            <Icon name="time-outline" size={16} color={colors.TEXT.SECONDARY} />
            <Text style={[styles.statText, { color: colors.TEXT.SECONDARY }]}>
              {getRemainingTime()}
            </Text>
          </View>
        )}
      </View>

      <View style={styles.groupActions}>
        {group.isJoined ? (
          <TouchableOpacity
            style={[styles.actionButton, styles.leaveButton]}
            onPress={() => onLeave(group)}
          >
            <Text style={[styles.actionButtonText, { color: colors.ERROR }]}>
              {t('nearbygroups:leave')}
            </Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[styles.actionButton, styles.joinButton, { backgroundColor: colors.PRIMARY }]}
            onPress={() => onJoin(group)}
          >
            <Text style={[styles.actionButtonText, { color: colors.WHITE }]}>
              {t('nearbygroups:join')}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  groupCard: {
    padding: SPACING.MD,
    marginHorizontal: SPACING.MD,
    marginVertical: SPACING.SM,
    borderRadius: 12,
    ...shadowStyles.medium,
  },
  groupHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.SM,
  },
  groupInfo: {
    flex: 1,
  },
  groupName: {
    fontSize: FONT_SIZES.LG,
    fontWeight: '600',
    marginBottom: 4,
  },
  groupDescription: {
    fontSize: FONT_SIZES.SM,
  },
  joinedBadge: {
    paddingHorizontal: SPACING.SM,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: SPACING.SM,
  },
  joinedText: {
    fontSize: FONT_SIZES.XS,
    fontWeight: '600',
  },
  groupStats: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: SPACING.MD,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: SPACING.MD,
    marginVertical: 4,
  },
  statText: {
    fontSize: FONT_SIZES.SM,
    marginLeft: 4,
  },
  groupActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  actionButton: {
    paddingHorizontal: SPACING.MD,
    paddingVertical: SPACING.SM,
    borderRadius: 8,
  },
  joinButton: {
    minWidth: 80,
    alignItems: 'center',
  },
  leaveButton: {
    borderWidth: 1,
    borderColor: '#FF4444',
  },
  actionButtonText: {
    fontSize: FONT_SIZES.SM,
    fontWeight: '600',
    textAlign: 'center',
  },
});