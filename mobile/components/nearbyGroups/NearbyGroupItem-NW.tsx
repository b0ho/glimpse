/**
 * NearbyGroupItem 컴포넌트 (NativeWind v4 버전)
 *
 * @module NearbyGroupItem-NW
 * @description 근처 그룹 목록에서 개별 그룹을 표시하는 카드 컴포넌트 (NativeWind v4 스타일링 적용)
 */

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

/**
 * NearbyGroupItem Props 인터페이스
 *
 * @interface NearbyGroupItemProps
 */
interface NearbyGroupItemProps {
  /** 표시할 그룹 정보 */
  group: LocationGroup;
  /** 그룹 카드 클릭 시 실행될 핸들러 */
  onPress: (group: LocationGroup) => void;
  /** 그룹 가입 버튼 클릭 시 실행될 핸들러 */
  onJoin: (group: LocationGroup) => void;
  /** 그룹 탈퇴 버튼 클릭 시 실행될 핸들러 */
  onLeave: (group: LocationGroup) => void;
  /** 거리를 포맷팅하는 함수 (미터 → 문자열) */
  formatDistance: (meters: number) => string;
  /** 번역 함수 */
  t: (key: string) => string;
}

/**
 * NearbyGroupItem 컴포넌트
 *
 * @component
 * @param {NearbyGroupItemProps} props - 컴포넌트 속성
 * @returns {JSX.Element} 그룹 카드 UI
 *
 * @description
 * 근처 그룹 화면에서 개별 그룹 정보를 카드 형태로 표시합니다. (NativeWind v4 버전)
 * - 그룹 이름, 설명, 가입 상태 표시
 * - 거리, 멤버 수, 만료 시간 표시
 * - 가입/탈퇴 액션 버튼 제공
 * - 다크모드 자동 지원 (dark: prefix 사용)
 *
 * @example
 * ```tsx
 * <NearbyGroupItem
 *   group={locationGroup}
 *   onPress={handleGroupPress}
 *   onJoin={handleJoinGroup}
 *   onLeave={handleLeaveGroup}
 *   formatDistance={(meters) => `${meters}m`}
 *   t={(key) => translate(key)}
 * />
 * ```
 *
 * @category Component
 * @subcategory NearbyGroups
 */
export const NearbyGroupItem: React.FC<NearbyGroupItemProps> = ({
  group,
  onPress,
  onJoin,
  onLeave,
  formatDistance,
  t,
}) => {
  const { colors } = useTheme();

  /**
   * 그룹 만료까지 남은 시간을 계산하고 포맷팅
   * @returns {string | null} 남은 시간 문자열 또는 null
   */
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

