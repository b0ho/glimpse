import React from 'react';
import {
  View,
  Text,
  TouchableOpacity
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
      className="groupCard"
      onPress={() => onPress(group)}
      activeOpacity={0.7}
    >
      <View className="groupHeader">
        <View className="groupInfo">
          <Text className="groupName">
            {group.name}
          </Text>
          <Text className="groupDescription">
            {group.description}
          </Text>
        </View>
        {group.isJoined && (
          <View className="joinedBadge">
            <Text className="joinedText">
              {t('nearbygroups:joined')}
            </Text>
          </View>
        )}
      </View>

      <View className="groupStats">
        <View className="statItem">
          <Icon name="location-outline" size={16} color={colors.TEXT.SECONDARY} />
          <Text className="statText">
            {formatDistance(group.distance || 0)}
          </Text>
        </View>
        
        <View className="statItem">
          <Icon name="people-outline" size={16} color={colors.TEXT.SECONDARY} />
          <Text className="statText">
            {t('nearbygroups:memberCount', { 
              count: group.activeMembers,
              total: group.memberCount 
            })}
          </Text>
        </View>
        
        {group.expiresAt && (
          <View className="statItem">
            <Icon name="time-outline" size={16} color={colors.TEXT.SECONDARY} />
            <Text className="statText">
              {getRemainingTime()}
            </Text>
          </View>
        )}
      </View>

      <View className="groupActions">
        {group.isJoined ? (
          <TouchableOpacity
            className="actionButton leaveButton"
            onPress={() => onLeave(group)}
          >
            <Text className="actionButtonText">
              {t('nearbygroups:leave')}
            </Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            className="actionButton joinButton"
            onPress={() => onJoin(group)}
          >
            <Text className="actionButtonText">
              {t('nearbygroups:join')}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  );
};

