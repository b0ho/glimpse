import React from 'react';
import {
  View,
  Text
  Image,
  TouchableOpacity,
} from 'react-native';
import { useAndroidSafeTranslation } from '@/hooks/useAndroidSafeTranslation';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { COLORS, SPACING, FONT_SIZES } from '@/utils/constants';
import { User } from '../../shared/types';

/**
 * ProfileHeader 컴포넌트 Props
 * @interface ProfileHeaderProps
 */
interface ProfileHeaderProps {
  /** 사용자 정보 */
  user: User;
  /** 통계 정보 */
  stats: {
    /** 받은 좋아요 수 */
    totalLikes: number;
    /** 상호 매칭 수 */
    mutualMatches: number;
    /** 친구 수 */
    friendCount: number;
    /** 소속 그룹 수 */
    groupCount: number;
  };
  /** 배지 목록 */
  badges: Array<{
    /** 배지 ID */
    id: string;
    /** 배지 아이콘 */
    icon: string;
    /** 배지 색상 */
    color: string;
    /** 배지 레이블 */
    label: string;
  }>;
  /** 프로필 수정 핸들러 */
  onEditPress: () => void;
  /** 좋아요 클릭 핸들러 */
  onLikesPress: () => void;
  /** 매칭 클릭 핸들러 */
  onMatchesPress: () => void;
  /** 친구 클릭 핸들러 */
  onFriendsPress: () => void;
  /** 그룹 클릭 핸들러 */
  onGroupsPress: () => void;
}

/**
 * 프로필 헤더 컴포넌트 - 사용자 프로필 정보 표시
 * @component
 * @param {ProfileHeaderProps} props - 컴포넌트 속성
 * @returns {JSX.Element} 프로필 헤더 UI
 * @description 사용자 프로필 이미지, 이름, 통계, 배지 및 자기소개를 표시하는 헤더 컴포넌트
 */
export const ProfileHeader= ({
  user,
  stats,
  badges,
  onEditPress,
  onLikesPress,
  onMatchesPress,
  onFriendsPress,
  onGroupsPress,
}) => {
  const { t } = useAndroidSafeTranslation('common');
  return (
    <View className="container">
      <View className="profileImageContainer">
        <Image
          source={user.profileImage 
            ? { uri: user.profileImage }
            : require('@/assets/default-profile.png')
          }
          className="profileImage"
        />
        {user.isPremium && (
          <View className="premiumBadge">
            <MaterialCommunityIcons name="crown" size={16} color="#FFD700" />
          </View>
        )}
      </View>
      
      <Text className="profileName">{user.nickname || t('common:user.noNickname')}</Text>
      
      {badges.length > 0 && (
        <View className="badgesContainer">
          {badges.map((badge) => (
            <View key={badge.id} className="badge">
              <MaterialCommunityIcons name={badge.icon as any} size={16} color={badge.color} />
              <Text className="badgeText">{badge.label}</Text>
            </View>
          ))}
        </View>
      )}
      
      <Text className="profileBio">{user.bio || t('common:user.noSelfIntroduction')}</Text>
      
      <View className="statsContainer">
        <TouchableOpacity className="statItem" onPress={onLikesPress}>
          <Text className="statNumber">{stats.totalLikes}</Text>
          <Text className="statLabel">{t('profile:stats.likes')}</Text>
          {!user.isPremium && stats.totalLikes > 0 && (
            <MaterialCommunityIcons name="lock" size={12} color="#999" className="lockIcon" />
          )}
        </TouchableOpacity>
        
        <View className="statDivider" />
        
        <TouchableOpacity className="statItem" onPress={onMatchesPress}>
          <Text className="statNumber">{stats.mutualMatches}</Text>
          <Text className="statLabel">{t('profile:stats.matches')}</Text>
        </TouchableOpacity>
        
        <View className="statDivider" />
        
        <TouchableOpacity className="statItem" onPress={onFriendsPress}>
          <Text className="statNumber">{stats.friendCount}</Text>
          <Text className="statLabel">{t('profile:stats.friends')}</Text>
        </TouchableOpacity>
        
        <View className="statDivider" />
        
        <TouchableOpacity className="statItem" onPress={onGroupsPress}>
          <Text className="statNumber">{stats.groupCount}</Text>
          <Text className="statLabel">{t('profile:stats.groups')}</Text>
        </TouchableOpacity>
      </View>
      
      <TouchableOpacity 
        className="editButton"
        onPress={onEditPress}
      >
        <MaterialCommunityIcons name="pencil" size={20} color="#fff" />
        <Text className="editButtonText">{t('common:actions.editProfile')}</Text>
      </TouchableOpacity>
    </View>
  );
};

