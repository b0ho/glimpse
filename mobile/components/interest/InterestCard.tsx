import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ColorValue,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { IconWrapper as Icon } from '@/components/IconWrapper';
import { useTheme } from '@/hooks/useTheme';
import { InterestType, SearchStatus } from '@/types/interest';

interface InterestCardProps {
  item: any;
  onPress?: () => void;
  onDelete?: () => void;
  onMismatch?: () => void;
  isMatch?: boolean;
  onEdit?: () => void;
  isSecure?: boolean; // 보안 모드 표시 여부
}

/**
 * 관심상대 카드 컴포넌트
 */
export const InterestCard: React.FC<InterestCardProps> = ({
  item,
  onPress,
  onDelete,
  onMismatch,
  isMatch = false,
  onEdit,
  isSecure = false,
}) => {
  const { colors, isDark } = useTheme();

  const getTypeConfig = (type: InterestType) => {
    const configs: Record<InterestType, { icon: string; color: string; gradient: readonly [ColorValue, ColorValue, ...ColorValue[]] }> = {
      [InterestType.PHONE]: {
        icon: 'call-outline',
        color: '#4CAF50',
        gradient: ['#4CAF50', '#45a049'],
      },
      [InterestType.EMAIL]: {
        icon: 'mail-outline',
        color: '#2196F3',
        gradient: ['#2196F3', '#1976D2'],
      },
      [InterestType.SOCIAL_ID]: {
        icon: 'logo-instagram',
        color: '#E91E63',
        gradient: ['#E91E63', '#C2185B'],
      },
      [InterestType.BIRTHDATE]: {
        icon: 'calendar-outline',
        color: '#9C27B0',
        gradient: ['#9C27B0', '#7B1FA2'],
      },
      [InterestType.GROUP]: {
        icon: 'people-outline',
        color: '#9C27B0',
        gradient: ['#9C27B0', '#7B1FA2'],
      },
      [InterestType.LOCATION]: {
        icon: 'location-outline',
        color: '#FF9800',
        gradient: ['#FF9800', '#F57C00'],
      },
      [InterestType.NICKNAME]: {
        icon: 'at-outline',
        color: '#607D8B',
        gradient: ['#607D8B', '#455A64'],
      },
      [InterestType.COMPANY]: {
        icon: 'business-outline',
        color: '#3F51B5',
        gradient: ['#3F51B5', '#303F9F'],
      },
      [InterestType.SCHOOL]: {
        icon: 'school-outline',
        color: '#00BCD4',
        gradient: ['#00BCD4', '#0097A7'],
      },
      [InterestType.PART_TIME_JOB]: {
        icon: 'briefcase-outline',
        color: '#F44336',
        gradient: ['#F44336', '#D32F2F'],
      },
      [InterestType.PLATFORM]: {
        icon: 'globe-outline',
        color: '#9C27B0',
        gradient: ['#9C27B0', '#7B1FA2'],
      },
      [InterestType.GAME_ID]: {
        icon: 'game-controller-outline',
        color: '#673AB7',
        gradient: ['#673AB7', '#512DA8'],
      },
    };
    return configs[type] || configs[InterestType.NICKNAME];
  };

  const typeConfig = getTypeConfig(item.type || item.matchType);
  const isActive = item.status === SearchStatus.ACTIVE;
  const isMatched = item.status === SearchStatus.MATCHED || isMatch;

  // 카드 클릭 핸들러 - 모든 카드는 onPress 실행 (편집 또는 채팅으로 이동)
  const handleCardPress = () => {
    onPress?.();
  };

  return (
    <View className="mb-3">
      <TouchableOpacity
        className="bg-white dark:bg-gray-800 rounded-xl overflow-hidden flex-row"
        onPress={handleCardPress}
        activeOpacity={0.9}
      >
        <LinearGradient
          colors={typeConfig.gradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          className="w-20 items-center justify-center"
        >
          <View className="w-14 h-14 rounded-full bg-white/20 items-center justify-center">
            <Icon name={typeConfig.icon} size={28} color="#FFFFFF" />
          </View>
        </LinearGradient>

        <View className="flex-1 p-3">
          <View className="flex-row items-center justify-between mb-2">
            <Text className="text-sm font-semibold text-gray-900 dark:text-gray-100">
              {getTypeLabel(item.type || item.matchType)}
            </Text>
            {isMatched && (
              <View className="flex-row items-center bg-green-500 px-2 py-1 rounded-full">
                <Icon name="checkmark-circle" size={16} color="#FFFFFF" />
                <Text className="text-xs text-white font-semibold ml-1">매칭됨</Text>
              </View>
            )}
            {!isMatch && isSecure && item.deviceInfo === 'other' && (
              <View className="flex-row items-center bg-blue-500 px-2 py-1 rounded-full">
                <Icon name="phone-portrait-outline" size={14} color="#FFFFFF" />
                <Text className="text-xs text-white font-semibold ml-1">다른 기기</Text>
              </View>
            )}
          </View>

          <View className="mb-2">
            {item.hasLocalData && item.displayValue ? (
              // 로컬 데이터가 있는 경우 - 상세 정보 표시
              <Text className="text-base text-gray-900 dark:text-gray-100 font-medium" numberOfLines={2}>
                {item.displayValue}
              </Text>
            ) : (
              // 로컬 데이터가 없는 경우 - 유형만 표시
              <Text className="text-base text-gray-900 dark:text-gray-100 font-medium" numberOfLines={2}>
                {item.deviceInfo === 'other'
                  ? '다른 기기에서 등록됨'
                  : (item.value || '등록된 정보')}
              </Text>
            )}
            {isSecure && (
              <View className="flex-row items-center mt-1">
                <Icon
                  name={item.hasLocalData ? "lock-closed" : "lock-open"}
                  size={12}
                  color={item.hasLocalData ? colors.SUCCESS : colors.WARNING}
                />
                <Text className="text-xs text-gray-500 dark:text-gray-400 ml-1">
                  {item.hasLocalData ? '암호화' : '원격'}
                </Text>
              </View>
            )}
          </View>

          {item.metadata?.platform && (
            <View className="flex-row items-center mb-1">
              <Icon
                name={item.metadata.platform === 'instagram' ? 'logo-instagram' : 'chatbubble-ellipses-outline'}
                size={14}
                color={colors.TEXT.SECONDARY}
              />
              <Text className="text-xs text-gray-500 dark:text-gray-400 ml-1">
                {item.metadata.platform}
              </Text>
            </View>
          )}

          {item.metadata?.birthdate && (
            <View className="flex-row items-center mb-1">
              <Icon
                name="calendar-outline"
                size={14}
                color={colors.TEXT.SECONDARY}
              />
              <Text className="text-xs text-gray-500 dark:text-gray-400 ml-1">
                생일: {item.metadata.birthdate}
              </Text>
            </View>
          )}

          {/* 회사 추가 정보 */}
          {(item.type === InterestType.COMPANY || item.matchType === InterestType.COMPANY) && (
            <>
              {item.metadata?.employeeName && (
                <View className="flex-row items-center mb-1">
                  <Icon name="person-outline" size={14} color={colors.TEXT.SECONDARY} />
                  <Text className="text-xs text-gray-500 dark:text-gray-400 ml-1">
                    {item.metadata.employeeName}
                  </Text>
                </View>
              )}
              {item.metadata?.department && (
                <View className="flex-row items-center mb-1">
                  <Icon name="briefcase-outline" size={14} color={colors.TEXT.SECONDARY} />
                  <Text className="text-xs text-gray-500 dark:text-gray-400 ml-1">
                    {item.metadata.department}
                  </Text>
                </View>
              )}
            </>
          )}

          {/* 학교 추가 정보 */}
          {(item.type === InterestType.SCHOOL || item.matchType === InterestType.SCHOOL) && (
            <>
              {item.metadata?.studentName && (
                <View className="flex-row items-center mb-1">
                  <Icon name="person-outline" size={14} color={colors.TEXT.SECONDARY} />
                  <Text className="text-xs text-gray-500 dark:text-gray-400 ml-1">
                    {item.metadata.studentName}
                  </Text>
                </View>
              )}
              {item.metadata?.major && (
                <View className="flex-row items-center mb-1">
                  <Icon name="book-outline" size={14} color={colors.TEXT.SECONDARY} />
                  <Text className="text-xs text-gray-500 dark:text-gray-400 ml-1">
                    {item.metadata.major}
                  </Text>
                </View>
              )}
            </>
          )}

          {isMatched && item.matchedUser && (
            <View className="flex-row items-center bg-gray-50 dark:bg-gray-700 rounded-lg p-2 mt-2">
              <View className="w-8 h-8 rounded-full bg-purple-500 items-center justify-center">
                <Text className="text-white font-bold text-sm">
                  {item.matchedUser.nickname?.[0] || '?'}
                </Text>
              </View>
              <Text className="text-sm font-semibold text-gray-900 dark:text-gray-100 ml-2">
                {item.matchedUser.nickname}
              </Text>
              {item.matchedAt && (
                <Text className="text-xs text-gray-500 dark:text-gray-400 ml-1">
                  • {formatRelativeTime(item.matchedAt)}
                </Text>
              )}
            </View>
          )}

          <View className="flex-row items-center justify-between mt-2">
            <View className="flex-row items-center">
              <Text className="text-xs text-gray-500 dark:text-gray-400">
                {formatDate(item.createdAt)}
              </Text>
              {item.expiresAt && !isMatched && (
                <Text className="text-xs text-red-500 ml-2">
                  {new Date(item.expiresAt) < new Date()
                    ? `만료됨 (${formatDate(item.expiresAt)})`
                    : `만료: ${formatDate(item.expiresAt)}`}
                </Text>
              )}
            </View>
            {isMatched && onMismatch && (
              <TouchableOpacity
                className="flex-row items-center px-2 py-1"
                onPress={onMismatch}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Icon name="warning-outline" size={18} color={colors.WARNING} />
                <Text className="text-xs text-orange-500 font-semibold ml-1">미스매치</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </TouchableOpacity>
    </View>
  );
};

function getTypeLabel(type: InterestType): string {
  const labels: Record<InterestType, string> = {
    [InterestType.PHONE]: '전화번호',
    [InterestType.EMAIL]: '이메일',
    [InterestType.SOCIAL_ID]: '소셜 계정',
    [InterestType.BIRTHDATE]: '생년월일',
    [InterestType.GROUP]: '특정 그룹',
    [InterestType.LOCATION]: '장소/인상착의',
    [InterestType.NICKNAME]: '닉네임',
    [InterestType.COMPANY]: '회사',
    [InterestType.SCHOOL]: '학교',
    [InterestType.PART_TIME_JOB]: '알바',
    [InterestType.PLATFORM]: '기타 플랫폼',
    [InterestType.GAME_ID]: '게임',
  };
  return labels[type] || '기타';
}

function formatDate(date: string | Date): string {
  const d = new Date(date);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  // 미래 날짜 처리 (만료 날짜 등)
  if (diff < 0) {
    const futureDays = Math.abs(days);
    if (futureDays === 0) return '오늘';
    if (futureDays === 1) return '내일';
    if (futureDays < 7) return `${futureDays}일 후`;
    if (futureDays < 30) return `${Math.floor(futureDays / 7)}주 후`;
    if (futureDays < 365) return `${Math.floor(futureDays / 30)}개월 후`;
    return `${Math.floor(futureDays / 365)}년 후`;
  }

  // 과거 날짜 처리
  if (days === 0) return '오늘';
  if (days === 1) return '어제';
  if (days < 7) return `${days}일 전`;
  if (days < 30) return `${Math.floor(days / 7)}주 전`;
  if (days < 365) return `${Math.floor(days / 30)}개월 전`;
  return `${Math.floor(days / 365)}년 전`;
}

function formatRelativeTime(date: string | Date): string {
  const d = new Date(date);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  const minutes = Math.floor(diff / (1000 * 60));
  const hours = Math.floor(diff / (1000 * 60 * 60));

  if (minutes < 1) return '방금 전';
  if (minutes < 60) return `${minutes}분 전`;
  if (hours < 24) return `${hours}시간 전`;
  return formatDate(date);
}
