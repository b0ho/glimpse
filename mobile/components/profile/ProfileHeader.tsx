import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, SPACING, FONT_SIZES } from '@/utils/constants';
import { User } from '@shared/types';

interface ProfileHeaderProps {
  user: User;
  stats: {
    totalLikes: number;
    mutualMatches: number;
    friendCount: number;
    groupCount: number;
  };
  badges: Array<{
    id: string;
    icon: string;
    color: string;
    label: string;
  }>;
  onEditPress: () => void;
  onLikesPress: () => void;
  onMatchesPress: () => void;
  onFriendsPress: () => void;
  onGroupsPress: () => void;
}

export const ProfileHeader: React.FC<ProfileHeaderProps> = ({
  user,
  stats,
  badges,
  onEditPress,
  onLikesPress,
  onMatchesPress,
  onFriendsPress,
  onGroupsPress,
}) => {
  return (
    <View style={styles.container}>
      <View style={styles.profileImageContainer}>
        <Image
          source={user.profileImage 
            ? { uri: user.profileImage }
            : require('@/assets/default-profile.png')
          }
          style={styles.profileImage}
        />
        {user.isPremium && (
          <View style={styles.premiumBadge}>
            <MaterialCommunityIcons name="crown" size={16} color="#FFD700" />
          </View>
        )}
      </View>
      
      <Text style={styles.profileName}>{user.nickname || '닉네임'}</Text>
      
      {badges.length > 0 && (
        <View style={styles.badgesContainer}>
          {badges.map((badge) => (
            <View key={badge.id} style={[styles.badge, { backgroundColor: badge.color + '20' }]}>
              <MaterialCommunityIcons name={badge.icon as any} size={16} color={badge.color} />
              <Text style={[styles.badgeText, { color: badge.color }]}>{badge.label}</Text>
            </View>
          ))}
        </View>
      )}
      
      <Text style={styles.profileBio}>{user.bio || '자기소개가 없습니다'}</Text>
      
      <View style={styles.statsContainer}>
        <TouchableOpacity style={styles.statItem} onPress={onLikesPress}>
          <Text style={styles.statNumber}>{stats.totalLikes}</Text>
          <Text style={styles.statLabel}>좋아요</Text>
          {!user.isPremium && stats.totalLikes > 0 && (
            <MaterialCommunityIcons name="lock" size={12} color="#999" style={styles.lockIcon} />
          )}
        </TouchableOpacity>
        
        <View style={styles.statDivider} />
        
        <TouchableOpacity style={styles.statItem} onPress={onMatchesPress}>
          <Text style={styles.statNumber}>{stats.mutualMatches}</Text>
          <Text style={styles.statLabel}>매칭</Text>
        </TouchableOpacity>
        
        <View style={styles.statDivider} />
        
        <TouchableOpacity style={styles.statItem} onPress={onFriendsPress}>
          <Text style={styles.statNumber}>{stats.friendCount}</Text>
          <Text style={styles.statLabel}>친구</Text>
        </TouchableOpacity>
        
        <View style={styles.statDivider} />
        
        <TouchableOpacity style={styles.statItem} onPress={onGroupsPress}>
          <Text style={styles.statNumber}>{stats.groupCount}</Text>
          <Text style={styles.statLabel}>그룹</Text>
        </TouchableOpacity>
      </View>
      
      <TouchableOpacity 
        style={styles.editButton}
        onPress={onEditPress}
      >
        <MaterialCommunityIcons name="pencil" size={20} color="#fff" />
        <Text style={styles.editButtonText}>프로필 수정</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.SURFACE,
    padding: SPACING.LG,
    alignItems: 'center',
  },
  profileImageContainer: {
    marginBottom: SPACING.MD,
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: COLORS.PRIMARY,
  },
  premiumBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: COLORS.SURFACE,
    borderRadius: 16,
    padding: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  profileName: {
    fontSize: FONT_SIZES.XXL,
    fontWeight: 'bold',
    color: COLORS.TEXT.PRIMARY,
    marginBottom: SPACING.SM,
  },
  badgesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.XS,
    marginBottom: SPACING.SM,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.SM,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  badgeText: {
    fontSize: FONT_SIZES.XS,
    fontWeight: '600',
  },
  profileBio: {
    fontSize: FONT_SIZES.MD,
    color: COLORS.TEXT.SECONDARY,
    textAlign: 'center',
    marginBottom: SPACING.LG,
    paddingHorizontal: SPACING.LG,
  },
  statsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.BACKGROUND,
    borderRadius: 12,
    padding: SPACING.MD,
    marginBottom: SPACING.LG,
    width: '100%',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    position: 'relative',
  },
  statNumber: {
    fontSize: FONT_SIZES.XL,
    fontWeight: 'bold',
    color: COLORS.PRIMARY,
    marginBottom: 2,
  },
  statLabel: {
    fontSize: FONT_SIZES.SM,
    color: COLORS.TEXT.SECONDARY,
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: COLORS.BORDER,
    marginHorizontal: SPACING.SM,
  },
  lockIcon: {
    position: 'absolute',
    top: 0,
    right: 0,
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.PRIMARY,
    paddingHorizontal: SPACING.LG,
    paddingVertical: SPACING.SM,
    borderRadius: 24,
    gap: SPACING.XS,
  },
  editButtonText: {
    color: COLORS.TEXT.WHITE,
    fontSize: FONT_SIZES.MD,
    fontWeight: '600',
  },
});