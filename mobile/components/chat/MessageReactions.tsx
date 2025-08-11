import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  FlatList,
  Dimensions,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { COLORS, FONTS, SIZES } from '../../constants/theme';

/**
 * 리액션 인터페이스
 * @interface Reaction
 */
interface Reaction {
  /** 이모지 */
  emoji: string;
  /** 리액션 수 */
  count: number;
  /** 리액션한 사용자 ID 목록 */
  userIds: string[];
  /** 현재 사용자가 리액션했는지 여부 */
  hasReacted: boolean;
}

/**
 * MessageReactions 컴포넌트 Props
 * @interface MessageReactionsProps
 */
interface MessageReactionsProps {
  /** 리액션 목록 */
  reactions: Reaction[];
  /** 리액션 추가 핸들러 */
  onAddReaction: (emoji: string) => void;
  /** 리액션 제거 핸들러 */
  onRemoveReaction: (emoji: string) => void;
  /** 현재 사용자 ID */
  currentUserId: string;
}

const QUICK_REACTIONS = ['❤️', '👍', '😊', '😂', '😮', '😢', '🙏', '👏'];

const ALL_REACTIONS = [
  { category: 'expressions', emojis: ['😊', '😂', '🥰', '😍', '😎', '😢', '😭', '😤', '😮', '😱'] },
  { category: 'gestures', emojis: ['👍', '👎', '👏', '🙏', '🤝', '✌️', '🤟', '🤙', '💪', '🙌'] },
  { category: 'hearts', emojis: ['❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '💕', '💖'] },
  { category: 'others', emojis: ['🔥', '💯', '✨', '🎉', '🎊', '🌟', '⭐', '🌈', '☀️', '🌙'] },
];

/**
 * 메시지 리액션 컴포넌트 - 메시지에 대한 이모지 리액션 관리
 * @component
 * @param {MessageReactionsProps} props - 컴포넌트 속성
 * @returns {JSX.Element} 메시지 리액션 UI
 * @description 메시지에 이모지 리액션을 추가/제거하고 표시하는 컴포넌트
 */
export const MessageReactions= ({
  reactions,
  onAddReaction,
  onRemoveReaction,
  currentUserId,
}) => {
  const [showAllReactions, setShowAllReactions] = useState(false);
  const { t } = useTranslation(['chat']);

  /**
   * 리액션 터치 핸들러
   * @param {Reaction} reaction - 리액션 객체
   * @returns {void}
   */
  const handleReactionPress = (reaction: Reaction) => {
    if (reaction.hasReacted) {
      onRemoveReaction(reaction.emoji);
    } else {
      onAddReaction(reaction.emoji);
    }
  };

  /**
   * 이모지 선택 핸들러
   * @param {string} emoji - 선택한 이모지
   * @returns {void}
   */
  const handleEmojiSelect = (emoji: string) => {
    onAddReaction(emoji);
    setShowAllReactions(false);
  };

  /**
   * 개별 리액션 렌더링
   * @param {Reaction} reaction - 리액션 객체
   * @returns {JSX.Element} 리액션 버튼 UI
   */
  const renderReaction = (reaction: Reaction) => (
    <TouchableOpacity
      key={reaction.emoji}
      style={[
        styles.reactionBubble,
        reaction.hasReacted && styles.reactionBubbleActive,
      ]}
      onPress={() => handleReactionPress(reaction)}
    >
      <Text style={styles.reactionEmoji}>{reaction.emoji}</Text>
      {reaction.count > 1 && (
        <Text style={[
          styles.reactionCount,
          reaction.hasReacted && styles.reactionCountActive,
        ]}>
          {reaction.count}
        </Text>
      )}
    </TouchableOpacity>
  );

  return (
    <>
      <View style={styles.container}>
        {reactions.map(renderReaction)}
        
        <TouchableOpacity
          style={styles.addReactionButton}
          onPress={() => setShowAllReactions(true)}
        >
          <Text style={styles.addReactionText}>+</Text>
        </TouchableOpacity>
      </View>

      {/* 전체 이모지 선택 모달 */}
      <Modal
        visible={showAllReactions}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowAllReactions(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowAllReactions(false)}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t('reactions.addReaction')}</Text>
            </View>

            {/* 빠른 선택 */}
            <View style={styles.quickReactionsContainer}>
              {QUICK_REACTIONS.map((emoji) => (
                <TouchableOpacity
                  key={emoji}
                  style={styles.quickReactionButton}
                  onPress={() => handleEmojiSelect(emoji)}
                >
                  <Text style={styles.quickReactionEmoji}>{emoji}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* 카테고리별 이모지 */}
            <FlatList
              data={ALL_REACTIONS}
              keyExtractor={(item) => item.category}
              renderItem={({ item }) => (
                <View style={styles.categoryContainer}>
                  <Text style={styles.categoryTitle}>{t(`reactions.categories.${item.category}`)}</Text>
                  <View style={styles.emojiGrid}>
                    {item.emojis.map((emoji) => (
                      <TouchableOpacity
                        key={emoji}
                        style={styles.emojiButton}
                        onPress={() => handleEmojiSelect(emoji)}
                      >
                        <Text style={styles.emoji}>{emoji}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              )}
            />
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  );
};

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: SIZES.base / 2,
    marginHorizontal: -2,
  },
  reactionBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.lightGray,
    paddingHorizontal: SIZES.base,
    paddingVertical: 4,
    borderRadius: 12,
    marginHorizontal: 2,
    marginVertical: 2,
  },
  reactionBubbleActive: {
    backgroundColor: COLORS.primaryLight,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  reactionEmoji: {
    fontSize: 14,
  },
  reactionCount: {
    ...FONTS.body5,
    color: COLORS.gray,
    marginLeft: 4,
  },
  reactionCountActive: {
    color: COLORS.primary,
    fontWeight: '600',
  },
  addReactionButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.lightGray,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 2,
    marginVertical: 2,
  },
  addReactionText: {
    fontSize: 16,
    color: COLORS.gray,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: SIZES.radius * 2,
    borderTopRightRadius: SIZES.radius * 2,
    maxHeight: '70%',
    paddingBottom: 20,
  },
  modalHeader: {
    alignItems: 'center',
    paddingVertical: SIZES.padding,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
  },
  modalTitle: {
    ...FONTS.h3,
    color: COLORS.black,
  },
  quickReactionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: SIZES.padding,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
  },
  quickReactionButton: {
    padding: SIZES.base,
  },
  quickReactionEmoji: {
    fontSize: 28,
  },
  categoryContainer: {
    paddingHorizontal: SIZES.padding,
    paddingVertical: SIZES.padding,
  },
  categoryTitle: {
    ...FONTS.body3,
    color: COLORS.gray,
    marginBottom: SIZES.base,
  },
  emojiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  emojiButton: {
    width: (width - SIZES.padding * 2) / 8,
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emoji: {
    fontSize: 24,
  },
});