import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Modal,
  TouchableWithoutFeedback,
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
  /** 콘텐츠 수정 핸들러 (선택적) */
  onEdit?: (content: Content) => void;
  /** 콘텐츠 삭제 핸들러 (선택적) */
  onDelete?: (contentId: string) => void;
  /** 그룹명 (선택적) */
  groupName?: string;
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
  onEdit,
  onDelete,
  groupName,
}) => {
  const isOwnContent = item.authorId === currentUserId;
  const { getUserDisplayName } = useLikeStore();
  const { t } = useTranslation();
  const [showMenu, setShowMenu] = useState(false);
  
  // 디버깅 로그
  console.log('[ContentItem] 렌더링:', {
    contentId: item.id,
    receivedGroupName: groupName,
    hasGroupName: !!groupName
  });

  // 익명성 시스템: 매칭 상태에 따라 표시명 결정
  const displayName = currentUserId && item.authorId && currentUserId !== item.authorId
    ? getUserDisplayName(item.authorId, currentUserId)
    : item.authorNickname || '테스트유저';

  const handleEdit = () => {
    setShowMenu(false);
    onEdit?.(item);
  };

  const handleDelete = () => {
    setShowMenu(false);
    Alert.alert(
      '게시물 삭제',
      '이 게시물을 삭제하시겠습니까?',
      [
        { text: '취소', style: 'cancel' },
        { 
          text: '삭제', 
          style: 'destructive',
          onPress: () => onDelete?.(item.id)
        }
      ]
    );
  };

  return (
    <View style={styles.contentItem}>
      <View style={styles.contentHeader}>
        <View style={styles.authorInfo}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {displayName?.charAt(0) || '?'}
            </Text>
          </View>
          <View style={styles.authorDetails}>
            <Text style={styles.authorName}>{displayName}</Text>
            {groupName && (
              <View style={styles.groupInfo}>
                <Icon name="people" size={12} color={COLORS.TEXT.SECONDARY} />
                <Text style={styles.groupName}>{groupName}</Text>
              </View>
            )}
            {/* 디버깅용 - 임시로 모든 경우에 그룹명 표시 */}
            {!groupName && (
              <View style={styles.groupInfo}>
                <Icon name="people" size={12} color={COLORS.TEXT.SECONDARY} />
                <Text style={styles.groupName}>그룹명 없음</Text>
              </View>
            )}
            <Text style={styles.timeText}>{formatTimeAgo(new Date(item.createdAt))}</Text>
          </View>
        </View>
        
        {/* 본인 게시물인 경우 수정/삭제 메뉴 표시 */}
        {isOwnContent && (onEdit || onDelete) && (
          <>
            <TouchableOpacity
              style={styles.menuButton}
              onPress={() => setShowMenu(!showMenu)}
              accessibilityLabel="게시물 옵션"
              accessibilityRole="button"
            >
              <Icon name="ellipsis-horizontal" size={20} color={COLORS.TEXT.SECONDARY} />
            </TouchableOpacity>
            
            <Modal
              visible={showMenu}
              transparent={true}
              animationType="fade"
              onRequestClose={() => setShowMenu(false)}
            >
              <TouchableWithoutFeedback onPress={() => setShowMenu(false)}>
                <View style={styles.menuOverlay}>
                  <TouchableWithoutFeedback onPress={() => {}}>
                    <View style={styles.menuPopup}>
                      {onEdit && (
                        <TouchableOpacity style={styles.menuItem} onPress={handleEdit}>
                          <Icon name="create-outline" size={16} color={COLORS.TEXT.PRIMARY} />
                          <Text style={styles.menuText}>수정</Text>
                        </TouchableOpacity>
                      )}
                      {onDelete && (
                        <TouchableOpacity style={styles.menuItem} onPress={handleDelete}>
                          <Icon name="trash-outline" size={16} color={COLORS.ERROR} />
                          <Text style={[styles.menuText, { color: COLORS.ERROR }]}>삭제</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  </TouchableWithoutFeedback>
                </View>
              </TouchableWithoutFeedback>
            </Modal>
          </>
        )}
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
  authorDetails: {
    flex: 1,
  },
  authorName: {
    fontSize: FONT_SIZES.MD,
    fontWeight: '600',
    color: COLORS.TEXT.PRIMARY,
    marginBottom: 2,
  },
  groupInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  groupName: {
    fontSize: FONT_SIZES.XS,
    color: COLORS.TEXT.SECONDARY,
    marginLeft: 4,
    backgroundColor: COLORS.PRIMARY + '15',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    overflow: 'hidden',
  },
  timeText: {
    fontSize: FONT_SIZES.XS,
    color: COLORS.TEXT.SECONDARY,
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
  menuButton: {
    padding: SPACING.XS,
    borderRadius: 20,
    backgroundColor: 'transparent',
  },
  menuOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
    paddingTop: 100,
    paddingRight: 20,
  },
  menuPopup: {
    backgroundColor: COLORS.SURFACE,
    borderRadius: 12,
    paddingVertical: SPACING.SM,
    minWidth: 150,
    elevation: 20,
    shadowColor: COLORS.SHADOW,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.BORDER,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.MD,
    paddingVertical: SPACING.SM,
  },
  menuText: {
    marginLeft: SPACING.SM,
    fontSize: FONT_SIZES.MD,
    color: COLORS.TEXT.PRIMARY,
  },
});