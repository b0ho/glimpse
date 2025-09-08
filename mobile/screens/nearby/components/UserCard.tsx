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
import { shadowStyles } from '@/utils/shadowStyles';
import { useAndroidSafeTranslation } from '@/hooks/useAndroidSafeTranslation';

interface UserCardProps {
  user: NearbyUser;
  currentUserId: string;
  hasLiked: boolean;
  onLike: () => void;
  onMessage: () => void;
}

export const UserCard= ({
  user,
  currentUserId,
  hasLiked,
  onLike,
  onMessage,
}) => {
  const { t } = useAndroidSafeTranslation();
  const isMatch = false; // TODO: Check if user is matched with current user
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
          {user.isVerified && (
            <Icon name="checkmark-circle" size={16} color={COLORS.PRIMARY} />
          )}
          {user.isPremium && (
            <Icon name="star" size={16} color={COLORS.premium} style={styles.premiumIcon} />
          )}
        </View>
        
        <View style={styles.details}>
          <Text style={styles.detailText}>{t('nearbyusers:user.age', { age: user.age || '??' })}</Text>
          <Text style={styles.separator}>•</Text>
          <Text style={styles.detailText}>{formatDistance(user.distance)}</Text>
          {user.commonGroups && user.commonGroups.length > 0 && (
            <>
              <Text style={styles.separator}>•</Text>
              <Text style={styles.detailText}>{t('nearbyusers:user.commonGroups', { count: user.commonGroups.length })}</Text>
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
            <Icon name="chatbubble-ellipses" size={20} color={COLORS.WHITE} />
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
              color={hasLiked ? COLORS.WHITE : COLORS.PRIMARY}
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
    backgroundColor: COLORS.WHITE,
    padding: SPACING.md,
    marginHorizontal: SPACING.lg,
    marginVertical: SPACING.sm,
    borderRadius: 12,
    ...shadowStyles.card,
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
    fontSize: FONT_SIZES.LG,
    fontWeight: '600',
    color: COLORS.TEXT.PRIMARY,
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
    fontSize: FONT_SIZES.SM,
    color: COLORS.TEXT.SECONDARY,
  },
  separator: {
    marginHorizontal: SPACING.xs,
    color: COLORS.TEXT.LIGHT,
  },
  bio: {
    fontSize: FONT_SIZES.SM,
    color: COLORS.TEXT.SECONDARY,
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
    backgroundColor: COLORS.PRIMARY + '20',
    justifyContent: 'center',
    alignItems: 'center',
  },
  likeButtonActive: {
    backgroundColor: COLORS.PRIMARY,
  },
  messageButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.PRIMARY,
    justifyContent: 'center',
    alignItems: 'center',
  },
});