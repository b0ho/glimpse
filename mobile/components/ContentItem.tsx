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
import { useAndroidSafeTranslation } from '@/hooks/useAndroidSafeTranslation';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Ionicons';
import { Content } from '@/types';
import { COLORS, SPACING, FONT_SIZES } from '@/utils/constants';
import { formatTimeAgo } from '@/utils/dateUtils';
import { STATE_ICONS } from '@/utils/icons';
import { useLikeStore } from '@/store/slices/likeSlice';
import { useTheme } from '@/hooks/useTheme';
import { shadowPresets } from '@/utils/styles/platformStyles';

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
  const { colors } = useTheme();
  const { t } = useAndroidSafeTranslation();
  const navigation = useNavigation();
  const [showMenu, setShowMenu] = useState(false);
  
  // 디버깅 로그
  console.log('[ContentItem] 렌더링:', {
    contentId: item.id,
    receivedGroupName: groupName,
    hasGroupName: !!groupName
  });

  // 익명성 시스템: 매칭 상태에 따라 표시명 결정
  // 프로덕션에서는 매칭 전까지 익명, 개발 중에는 실제 닉네임 표시
  const displayName = item.authorNickname || getUserDisplayName(item.authorId || '', currentUserId || '') || t('common:user.defaultName');

  const handleEdit = () => {
    setShowMenu(false);
    onEdit?.(item);
  };

  const handleDelete = () => {
    setShowMenu(false);
    Alert.alert(
      t('common:actions.delete'),
      t('post:deleteConfirmMessage'),
      [
        { text: t('common:actions.cancel'), style: 'cancel' },
        { 
          text: t('common:actions.delete'), 
          style: 'destructive',
          onPress: () => onDelete?.(item.id)
        }
      ]
    );
  };

  const handlePostPress = () => {
    navigation.navigate('PostDetail' as never, { postId: item.id } as never);
  };

  return (
    <View style={[styles.contentItem, { backgroundColor: colors.SURFACE, borderBottomColor: colors.BORDER }]}>
      <View style={styles.contentHeader}>
        <View style={styles.authorInfo}>
          <View style={[styles.avatar, { backgroundColor: colors.PRIMARY }]}>
            <Text style={[styles.avatarText, { color: colors.TEXT.WHITE }]}>
              {displayName?.charAt(0) || '?'}
            </Text>
          </View>
          <View style={styles.authorDetails}>
            <Text style={[styles.authorName, { color: colors.TEXT.PRIMARY }]}>{displayName}</Text>
            {groupName && (
              <View style={styles.groupInfo}>
                <Icon name="people" size={12} color={colors.TEXT.SECONDARY} />
                <Text style={[styles.groupName, { color: colors.TEXT.SECONDARY }]}>{groupName}</Text>
              </View>
            )}
            {/* 디버깅용 - 임시로 모든 경우에 그룹명 표시 */}
            {!groupName && (
              <View style={styles.groupInfo}>
                <Icon name="people" size={12} color={colors.TEXT.SECONDARY} />
                <Text style={[styles.groupName, { color: colors.TEXT.SECONDARY }]}>그룹명 없음</Text>
              </View>
            )}
            <Text style={[styles.timeText, { color: colors.TEXT.SECONDARY }]}>{formatTimeAgo(new Date(item.createdAt))}</Text>
          </View>
        </View>
        
        {/* 본인 게시물인 경우 수정/삭제 메뉴 표시 */}
        {isOwnContent && (onEdit || onDelete) && (
          <>
            <TouchableOpacity
              style={styles.menuButton}
              onPress={() => setShowMenu(!showMenu)}
              accessibilityLabel={t('post:postOptions')}
              accessibilityRole="button"
            >
              <Icon name="ellipsis-horizontal" size={20} color={colors.TEXT.SECONDARY} />
            </TouchableOpacity>
            
            <Modal
              visible={showMenu}
              transparent={true}
              animationType="fade"
              onRequestClose={() => setShowMenu(false)}
            >
              <TouchableWithoutFeedback onPress={() => setShowMenu(false)}>
                <View style={[styles.menuOverlay, { backgroundColor: colors.OVERLAY }]}>
                  <TouchableWithoutFeedback onPress={() => {}}>
                    <View style={[styles.menuPopup, { backgroundColor: colors.SURFACE, borderColor: colors.BORDER }]}>
                      {onEdit && (
                        <TouchableOpacity style={[styles.menuItem, { borderBottomColor: colors.BORDER }]} onPress={handleEdit}>
                          <Icon name="create-outline" size={16} color={colors.TEXT.PRIMARY} />
                          <Text style={[styles.menuText, { color: colors.TEXT.PRIMARY }]}>수정</Text>
                        </TouchableOpacity>
                      )}
                      {onDelete && (
                        <TouchableOpacity style={[styles.menuItem, { borderBottomColor: colors.BORDER }]} onPress={handleDelete}>
                          <Icon name="trash-outline" size={16} color={colors.ERROR} />
                          <Text style={[styles.menuText, { color: colors.ERROR }]}>삭제</Text>
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

      <TouchableOpacity style={styles.contentBody} onPress={handlePostPress} activeOpacity={0.7}>
        {item.text && <Text style={[styles.contentText, { color: colors.TEXT.PRIMARY }]}>{item.text}</Text>}
        {item.type === 'image' && item.imageUrls && (
          <View style={[styles.imageContainer, { backgroundColor: colors.BACKGROUND, borderColor: colors.BORDER }]}>
            <Text style={[styles.imagePlaceholder, { color: colors.TEXT.SECONDARY }]}>
              📷 {t('common:content.imagesCount', { count: item.imageUrls.length })}
            </Text>
          </View>
        )}
      </TouchableOpacity>

      <View style={styles.contentFooter}>
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={styles.likeButtonContainer}
            onPress={() => item.authorId && onLikeToggle(item.id, item.authorId)}
            disabled={item.isLikedByUser || isOwnContent || !item.authorId || remainingLikes === 0}
            accessibilityLabel={t('common:accessibility.likePost', { name: item.authorNickname })}
            accessibilityHint={
              isOwnContent
                ? t('common:accessibility.cannotLikeOwnPost')
                : item.isLikedByUser
                ? t('common:accessibility.alreadyLiked')
                : remainingLikes === 0
                ? t('matching:like.insufficientCredits')
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
                    ? colors.PRIMARY
                    : isOwnContent
                    ? colors.TEXT.LIGHT
                    : colors.TEXT.SECONDARY
                }
              />
              <Text
                style={[
                  styles.likeButtonText,
                  { color: colors.TEXT.SECONDARY },
                  item.isLikedByUser && { color: colors.PRIMARY },
                  isOwnContent && { color: colors.TEXT.LIGHT },
                ]}
              >
                {item.likeCount}
              </Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.commentButtonContainer}
            onPress={handlePostPress}
            accessibilityLabel={t('post:comment')}
            accessibilityRole="button"
          >
            <View style={styles.commentButton}>
              <Icon
                name="chatbubble-outline"
                size={20}
                color={colors.TEXT.SECONDARY}
              />
              <Text
                style={[
                  styles.commentButtonText,
                  { color: colors.TEXT.SECONDARY },
                ]}
              >
                {item.commentCount || 0}
              </Text>
            </View>
          </TouchableOpacity>

          <View style={styles.actionInfo}>
            <Text style={[styles.remainingLikes, { color: colors.TEXT.SECONDARY }]}>
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
    marginTop: SPACING.MD,
    marginBottom: SPACING.XS,
    marginHorizontal: SPACING.MD,
    borderRadius: 12,
    padding: SPACING.MD,
    ...shadowPresets.small,
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
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.SM,
  },
  avatarText: {
    fontSize: FONT_SIZES.MD,
    fontWeight: 'bold',
  },
  authorDetails: {
    flex: 1,
  },
  authorName: {
    fontSize: FONT_SIZES.MD,
    fontWeight: '600',
    marginBottom: 2,
  },
  groupInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  groupName: {
    fontSize: FONT_SIZES.XS,
    marginLeft: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    overflow: 'hidden',
  },
  timeText: {
    fontSize: FONT_SIZES.XS,
  },
  contentBody: {
    marginBottom: SPACING.MD,
  },
  contentText: {
    fontSize: FONT_SIZES.MD,
    lineHeight: 22,
  },
  imageContainer: {
    marginTop: SPACING.SM,
    padding: SPACING.LG,
    borderRadius: 8,
    alignItems: 'center',
  },
  imagePlaceholder: {
    fontSize: FONT_SIZES.MD,
  },
  contentFooter: {
    borderTopWidth: 1,
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
  },
  likeButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  likeButtonText: {
    fontSize: FONT_SIZES.MD,
    fontWeight: '500',
    marginLeft: SPACING.XS,
  },
  likeButtonTextActive: {
    fontWeight: '600',
  },
  likeButtonTextDisabled: {
    opacity: 0.6,
  },
  commentButtonContainer: {
    paddingVertical: SPACING.XS,
    paddingHorizontal: SPACING.SM,
    borderRadius: 20,
  },
  commentButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  commentButtonText: {
    fontSize: FONT_SIZES.MD,
    fontWeight: '500',
    marginLeft: SPACING.XS,
  },
  actionInfo: {
    alignItems: 'flex-end',
  },
  remainingLikes: {
    fontSize: FONT_SIZES.XS,
    fontWeight: '500',
  },
  menuButton: {
    padding: SPACING.XS,
    borderRadius: 20,
    backgroundColor: 'transparent',
  },
  menuOverlay: {
    flex: 1,
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
    paddingTop: 100,
    paddingRight: 20,
  },
  menuPopup: {
    borderRadius: 12,
    paddingVertical: SPACING.SM,
    minWidth: 150,
    borderWidth: 1,
    ...shadowPresets.extraLarge,
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
  },
});