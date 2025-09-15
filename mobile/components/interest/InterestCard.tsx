import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
  ColorValue,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { IconWrapper as Icon } from '@/components/IconWrapper';
import { useTheme } from '@/hooks/useTheme';
import { InterestType, SearchStatus } from '@/types/interest';
import Swipeable from 'react-native-gesture-handler/Swipeable';
import { shadowStyles } from '@/utils/shadowStyles';

const { width } = Dimensions.get('window');

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

  const renderRightActions = (progress: Animated.AnimatedInterpolation<number>) => {
    if (!onDelete || isMatch) return null;

    const translateX = progress.interpolate({
      inputRange: [0, 1],
      outputRange: [100, 0],
    });

    return (
      <Animated.View style={[styles.deleteAction, { transform: [{ translateX }] }]}>
        <TouchableOpacity
          style={[styles.deleteButton, { backgroundColor: colors.ERROR }]}
          onPress={onDelete}
        >
          <Icon name="trash-outline" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </Animated.View>
    );
  };

  // 카드 클릭 핸들러 - 모든 카드는 onPress 실행 (편집 또는 채팅으로 이동)
  const handleCardPress = () => {
    onPress?.();
  };

  const content = (
    <View style={[styles.card, { backgroundColor: colors.SURFACE }]}>
      <TouchableOpacity
        style={styles.cardContent}
        onPress={handleCardPress}
        activeOpacity={0.9}
      >
        <LinearGradient
          colors={typeConfig.gradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradient}
        >
          <View style={styles.iconContainer}>
            <Icon name={typeConfig.icon} size={28} color="#FFFFFF" />
          </View>
        </LinearGradient>

        <View style={styles.content}>
          <View style={styles.header}>
            <Text style={[styles.type, { color: typeConfig.color }]}>
              {getTypeLabel(item.type || item.matchType)}
            </Text>
            {isMatched && (
              <View style={[styles.badge, { backgroundColor: colors.SUCCESS }]}>
                <Icon name="checkmark-circle" size={16} color="#FFFFFF" />
                <Text style={styles.badgeText}>매칭됨</Text>
              </View>
            )}
            {!isMatch && isSecure && item.deviceInfo === 'other' && (
              <View style={[styles.badge, { backgroundColor: colors.INFO + '20' }]}>
                <Icon name="phone-portrait-outline" size={14} color={colors.INFO} />
                <Text style={[styles.badgeText, { color: colors.INFO }]}>다른 기기</Text>
              </View>
            )}
          </View>

          <View style={styles.valueContainer}>
            {item.hasLocalData && item.displayValue ? (
              // 로컬 데이터가 있는 경우 - 상세 정보 표시
              <Text style={[styles.value, { color: colors.TEXT.PRIMARY }]} numberOfLines={2}>
                {item.displayValue}
              </Text>
            ) : (
              // 로컬 데이터가 없는 경우 - 유형만 표시
              <Text style={[styles.value, { color: colors.TEXT.SECONDARY, fontStyle: 'italic' }]} numberOfLines={2}>
                {item.deviceInfo === 'other' 
                  ? '다른 기기에서 등록됨' 
                  : (item.value || '등록된 정보')}
              </Text>
            )}
            {isSecure && (
              <View style={[styles.secureIndicator, { 
                backgroundColor: item.hasLocalData ? colors.SUCCESS + '20' : colors.WARNING + '20' 
              }]}>
                <Icon 
                  name={item.hasLocalData ? "lock-closed" : "lock-open"} 
                  size={12} 
                  color={item.hasLocalData ? colors.SUCCESS : colors.WARNING} 
                />
                <Text style={[styles.secureText, { 
                  color: item.hasLocalData ? colors.SUCCESS : colors.WARNING 
                }]}>
                  {item.hasLocalData ? '암호화' : '원격'}
                </Text>
              </View>
            )}
          </View>

          {item.metadata?.platform && (
            <View style={styles.metadata}>
              <Icon
                name={item.metadata.platform === 'instagram' ? 'logo-instagram' : 'chatbubble-ellipses-outline'}
                size={14}
                color={colors.TEXT.SECONDARY}
              />
              <Text style={[styles.metadataText, { color: colors.TEXT.SECONDARY }]}>
                {item.metadata.platform}
              </Text>
            </View>
          )}

          {item.metadata?.birthdate && (
            <View style={styles.metadata}>
              <Icon
                name="calendar-outline"
                size={14}
                color={colors.TEXT.SECONDARY}
              />
              <Text style={[styles.metadataText, { color: colors.TEXT.SECONDARY }]}>
                생일: {item.metadata.birthdate}
              </Text>
            </View>
          )}

          {/* 회사 추가 정보 */}
          {(item.type === InterestType.COMPANY || item.matchType === InterestType.COMPANY) && (
            <>
              {item.metadata?.employeeName && (
                <View style={styles.metadata}>
                  <Icon name="person-outline" size={14} color={colors.TEXT.SECONDARY} />
                  <Text style={[styles.metadataText, { color: colors.TEXT.SECONDARY }]}>
                    {item.metadata.employeeName}
                  </Text>
                </View>
              )}
              {item.metadata?.department && (
                <View style={styles.metadata}>
                  <Icon name="briefcase-outline" size={14} color={colors.TEXT.SECONDARY} />
                  <Text style={[styles.metadataText, { color: colors.TEXT.SECONDARY }]}>
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
                <View style={styles.metadata}>
                  <Icon name="person-outline" size={14} color={colors.TEXT.SECONDARY} />
                  <Text style={[styles.metadataText, { color: colors.TEXT.SECONDARY }]}>
                    {item.metadata.studentName}
                  </Text>
                </View>
              )}
              {item.metadata?.major && (
                <View style={styles.metadata}>
                  <Icon name="book-outline" size={14} color={colors.TEXT.SECONDARY} />
                  <Text style={[styles.metadataText, { color: colors.TEXT.SECONDARY }]}>
                    {item.metadata.major}
                  </Text>
                </View>
              )}
            </>
          )}

          {isMatched && item.matchedUser && (
            <View style={styles.matchInfo}>
              <View style={[styles.avatar, { backgroundColor: typeConfig.color + '20' }]}>
                <Text style={[styles.avatarText, { color: typeConfig.color }]}>
                  {item.matchedUser.nickname?.[0] || '?'}
                </Text>
              </View>
              <Text style={[styles.matchedName, { color: colors.TEXT.PRIMARY }]}>
                {item.matchedUser.nickname}
              </Text>
              {item.matchedAt && (
                <Text style={[styles.matchedTime, { color: colors.TEXT.TERTIARY }]}>
                  • {formatRelativeTime(item.matchedAt)}
                </Text>
              )}
            </View>
          )}

          <View style={styles.footer}>
            <View style={styles.footerLeft}>
              <Text style={[styles.date, { color: colors.TEXT.TERTIARY }]}>
                {formatDate(item.createdAt)}
              </Text>
              {item.expiresAt && !isMatched && (
                <Text style={[styles.expires, { 
                  color: new Date(item.expiresAt) < new Date() ? colors.ERROR : colors.WARNING 
                }]}>
                  {new Date(item.expiresAt) < new Date() 
                    ? `만료됨 (${formatDate(item.expiresAt)})` 
                    : `만료: ${formatDate(item.expiresAt)}`}
                </Text>
              )}
            </View>
            {isMatched && onMismatch && (
              <View style={styles.footerRight}>
                <TouchableOpacity 
                  style={[styles.mismatchButton, { backgroundColor: colors.WARNING + '20' }]}
                  onPress={onMismatch}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Icon name="warning-outline" size={20} color={colors.WARNING} />
                  <Text style={[styles.mismatchText, { color: colors.WARNING }]}>미스매치</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    </View>
  );

  return content;
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

const styles = StyleSheet.create({
  card: {
    marginBottom: 10,
    borderRadius: 12,
    overflow: 'hidden',
    flexDirection: 'row',
    ...shadowStyles.card,
    minHeight: 100,
    position: 'relative',
  },
  cardContent: {
    flex: 1,
    flexDirection: 'row',
  },
  gradient: {
    width: 70,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    padding: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  type: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    marginLeft: 8,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '600',
    marginLeft: 4,
  },
  valueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  value: {
    fontSize: 15,
    fontWeight: '600',
    lineHeight: 20,
    flex: 1,
  },
  secureIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    marginLeft: 8,
  },
  secureText: {
    fontSize: 10,
    fontWeight: '600',
    marginLeft: 3,
  },
  metadata: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  metadataText: {
    fontSize: 12,
    marginLeft: 5,
  },
  matchInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
  },
  avatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 14,
    fontWeight: '700',
  },
  matchedName: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  matchedTime: {
    fontSize: 12,
    marginLeft: 5,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 5,
  },
  footerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  moreButton: {
    padding: 5,
    marginLeft: 10,
  },
  date: {
    fontSize: 12,
  },
  expires: {
    fontSize: 12,
    fontWeight: '600',
  },
  deleteAction: {
    justifyContent: 'center',
    alignItems: 'center',
    width: 80,
  },
  deleteButton: {
    position: 'absolute',
    right: 10,
    bottom: 10,
    padding: 5,
  },
  footerRight: {
    marginLeft: 'auto',
  },
  mismatchButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 15,
  },
  mismatchText: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
});