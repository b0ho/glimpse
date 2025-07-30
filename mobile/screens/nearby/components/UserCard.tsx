import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { NearbyUser } from '@/types';
import { COLORS, SPACING, FONT_SIZES } from '@/utils/constants';

interface UserCardProps {
  user: NearbyUser;
  currentUserId: string;
  hasLiked: boolean;
  onLike: () => void;
  onMessage: () => void;
}

export const UserCard: React.FC<UserCardProps> = ({
  user,
  currentUserId,
  hasLiked,
  onLike,
  onMessage,
}) => {
  const isMatch = user.matchedAt != null;
  const formatDistance = (meters: number) => {
    if (meters < 1000) {
      return `${Math.round(meters)}m`;
    }
    return `${(meters / 1000).toFixed(1)}km`;
  };

  return (
    <View style={styles.userCard}>
      <Image
        source={{ uri: user.profileImage || 'https://via.placeholder.com/150' }}
        style={styles.profileImage}
      />
      
      <View style={styles.userInfo}>
        <View style={styles.nameRow}>
          <Text style={styles.nickname}>{user.nickname}</Text>
          {user.verificationLevel === 'VERIFIED' && (
            <Icon name="checkmark-circle" size={16} color={COLORS.primary} />
          )}
          {user.isPremium && (
            <Icon name="star" size={16} color={COLORS.gold} style={styles.premiumIcon} />
          )}
        </View>
        
        <View style={styles.details}>
          <Text style={styles.detailText}>{user.age}세</Text>
          <Text style={styles.separator}>•</Text>
          <Text style={styles.detailText}>{formatDistance(user.distance)}</Text>
          {user.groupCount > 0 && (
            <>
              <Text style={styles.separator}>•</Text>
              <Text style={styles.detailText}>공통 그룹 {user.groupCount}개</Text>
            </>
          )}
        </View>
        
        {user.bio && (
          <Text style={styles.bio} numberOfLines={2}>
            {user.bio}
          </Text>
        )}
      </View>
      
      <View style={styles.actions}>
        {isMatch ? (
          <TouchableOpacity style={styles.messageButton} onPress={onMessage}>
            <Icon name="chatbubble-ellipses" size={20} color={COLORS.white} />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[
              styles.likeButton,
              hasLiked && styles.likeButtonActive,
            ]}
            onPress={onLike}
            disabled={hasLiked}
          >
            <Icon
              name={hasLiked ? "heart" : "heart-outline"}
              size={24}
              color={hasLiked ? COLORS.white : COLORS.primary}
            />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  userCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    padding: SPACING.md,
    marginHorizontal: SPACING.lg,
    marginVertical: SPACING.sm,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  profileImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.gray200,
  },
  userInfo: {
    flex: 1,
    marginLeft: SPACING.md,
    justifyContent: 'center',
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  nickname: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    color: COLORS.text,
    marginRight: SPACING.xs,
  },
  premiumIcon: {
    marginLeft: SPACING.xs,
  },
  details: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  detailText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
  },
  separator: {
    marginHorizontal: SPACING.xs,
    color: COLORS.textLight,
  },
  bio: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },
  actions: {
    justifyContent: 'center',
    paddingLeft: SPACING.md,
  },
  likeButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  likeButtonActive: {
    backgroundColor: COLORS.primary,
  },
  messageButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
});