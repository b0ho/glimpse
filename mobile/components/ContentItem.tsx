import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import Icon from 'react-native-vector-icons/Ionicons';
import { Content } from '@/types';
import { COLORS, SPACING, FONT_SIZES } from '@/utils/constants';
import { formatTimeAgo } from '@/utils/dateUtils';
import { STATE_ICONS } from '@/utils/icons';
import { useLikeStore } from '@/store/slices/likeSlice';

/**
 * ContentItem 컴포넌트 Props
 * @interface ContentItemProps
 */
interface ContentItemProps {
  /** 컨텐츠 아이템 데이터 */
  item: Content;
  /** 현재 사용자 ID */
  currentUserId?: string;
  /** 남은 좋아요 수 */
  remainingLikes: number;
  /** 좋아요 토글 핸들러 */
  onLikeToggle: (contentId: string, authorId: string) => void;
}

/**
 * 컨텐츠 아이템 컴포넌트 - 피드의 각 컨텐츠 표시
 * @component
 * @param {ContentItemProps} props - 컴포넌트 속성
 * @returns {JSX.Element} 컨텐츠 아이템 UI
 * @description 사용자 게시물을 표시하고 좋아요 기능 제공. 익명성 시스템에 따라 작성자 표시
 */
export const ContentItem: React.FC<ContentItemProps> = React.memo(({
  item,
  currentUserId,
  remainingLikes,
  onLikeToggle,
}) => {
  const isOwnContent = item.authorId === currentUserId;
  const { getUserDisplayName } = useLikeStore();
  const { t } = useTranslation();

  // 익명성 시스템: 매칭 상태에 따라 표시명 결정
  const displayName = currentUserId && item.authorId
    ? getUserDisplayName(item.authorId, currentUserId)
    : item.authorNickname || t('common:user.anonymous');

  return (
    <View style={styles.contentItem}>
      <View style={styles.contentHeader}>
        <View style={styles.authorInfo}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {displayName?.charAt(0) || '?'}
            </Text>
          </View>
          <View>
            <Text style={styles.authorName}>{displayName}</Text>
            <Text style={styles.timeText}>{formatTimeAgo(new Date(item.createdAt))}</Text>
          </View>
        </View>
      </View>

      <View style={styles.contentBody}>
        {item.text && <Text style={styles.contentText}>{item.text}</Text>}
        {item.type === 'image' && item.imageUrls && (
          <View style={styles.imageContainer}>
            <Text style={styles.imagePlaceholder}>
              📷 {t('common:content.imagesCount', { count: item.imageUrls.length })}
            </Text>
          </View>
        )}
      </View>

      <View style={styles.contentFooter}>
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={styles.likeButtonContainer}
            onPress={() => item.authorId && onLikeToggle(item.id, item.authorId)}
            disabled={item.isLikedByUser || isOwnContent || !item.authorId}
            accessibilityLabel={t('common:accessibility.likePost', { name: item.authorNickname })}
            accessibilityHint={
              isOwnContent
                ? t('common:accessibility.cannotLikeOwnPost')
                : item.isLikedByUser
                ? t('common:accessibility.alreadyLiked')
                : t('common:accessibility.canLike')
            }
            accessibilityRole="button"
          >
            <View style={styles.likeButton}>
              <Icon
                name={item.isLikedByUser ? STATE_ICONS.LIKED : STATE_ICONS.UNLIKED}
                size={20}
                color={
                  item.isLikedByUser
                    ? COLORS.PRIMARY
                    : isOwnContent
                    ? COLORS.TEXT.LIGHT
                    : COLORS.TEXT.SECONDARY
                }
              />
              <Text
                style={[
                  styles.likeButtonText,
                  item.isLikedByUser && styles.likeButtonTextActive,
                  isOwnContent && styles.likeButtonTextDisabled,
                ]}
              >
                {item.likeCount}
              </Text>
            </View>
          </TouchableOpacity>

          <View style={styles.actionInfo}>
            <Text style={styles.remainingLikes}>
              {t('matching:like.remainingLikes', { count: remainingLikes })}
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  contentItem: {
    backgroundColor: COLORS.SURFACE,
    marginVertical: SPACING.XS,
    marginHorizontal: SPACING.MD,
    borderRadius: 12,
    padding: SPACING.MD,
    elevation: 2,
    shadowColor: COLORS.SHADOW,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  contentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.MD,
  },
  authorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.PRIMARY,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.SM,
  },
  avatarText: {
    color: COLORS.TEXT.WHITE,
    fontSize: FONT_SIZES.MD,
    fontWeight: 'bold',
  },
  authorName: {
    fontSize: FONT_SIZES.MD,
    fontWeight: '600',
    color: COLORS.TEXT.PRIMARY,
  },
  timeText: {
    fontSize: FONT_SIZES.XS,
    color: COLORS.TEXT.SECONDARY,
    marginTop: 2,
  },
  contentBody: {
    marginBottom: SPACING.MD,
  },
  contentText: {
    fontSize: FONT_SIZES.MD,
    color: COLORS.TEXT.PRIMARY,
    lineHeight: 22,
  },
  imageContainer: {
    marginTop: SPACING.SM,
    padding: SPACING.LG,
    backgroundColor: COLORS.BACKGROUND,
    borderRadius: 8,
    alignItems: 'center',
  },
  imagePlaceholder: {
    fontSize: FONT_SIZES.MD,
    color: COLORS.TEXT.SECONDARY,
  },
  contentFooter: {
    borderTopWidth: 1,
    borderTopColor: COLORS.BORDER,
    paddingTop: SPACING.SM,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  likeButtonContainer: {
    paddingVertical: SPACING.XS,
    paddingHorizontal: SPACING.SM,
    borderRadius: 20,
    backgroundColor: COLORS.BACKGROUND,
  },
  likeButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  likeButtonText: {
    fontSize: FONT_SIZES.MD,
    color: COLORS.TEXT.SECONDARY,
    fontWeight: '500',
    marginLeft: SPACING.XS,
  },
  likeButtonTextActive: {
    color: COLORS.PRIMARY,
    fontWeight: '600',
  },
  likeButtonTextDisabled: {
    color: COLORS.TEXT.LIGHT,
    opacity: 0.6,
  },
  actionInfo: {
    alignItems: 'flex-end',
  },
  remainingLikes: {
    fontSize: FONT_SIZES.XS,
    color: COLORS.TEXT.LIGHT,
    fontWeight: '500',
  },
});