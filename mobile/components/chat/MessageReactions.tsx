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
import { COLORS, FONTS, SIZES } from '../../constants/theme';

interface Reaction {
  emoji: string;
  count: number;
  userIds: string[];
  hasReacted: boolean;
}

interface MessageReactionsProps {
  reactions: Reaction[];
  onAddReaction: (emoji: string) => void;
  onRemoveReaction: (emoji: string) => void;
  currentUserId: string;
}

const QUICK_REACTIONS = ['❤️', '👍', '😊', '😂', '😮', '😢', '🙏', '👏'];

const ALL_REACTIONS = [
  { category: '표정', emojis: ['😊', '😂', '🥰', '😍', '😎', '😢', '😭', '😤', '😮', '😱'] },
  { category: '손동작', emojis: ['👍', '👎', '👏', '🙏', '🤝', '✌️', '🤟', '🤙', '💪', '🙌'] },
  { category: '하트', emojis: ['❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '💕', '💖'] },
  { category: '기타', emojis: ['🔥', '💯', '✨', '🎉', '🎊', '🌟', '⭐', '🌈', '☀️', '🌙'] },
];

export const MessageReactions: React.FC<MessageReactionsProps> = ({
  reactions,
  onAddReaction,
  onRemoveReaction,
  currentUserId,
}) => {
  const [showAllReactions, setShowAllReactions] = useState(false);

  const handleReactionPress = (reaction: Reaction) => {
    if (reaction.hasReacted) {
      onRemoveReaction(reaction.emoji);
    } else {
      onAddReaction(reaction.emoji);
    }
  };

  const handleEmojiSelect = (emoji: string) => {
    onAddReaction(emoji);
    setShowAllReactions(false);
  };

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
              <Text style={styles.modalTitle}>반응 추가</Text>
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
                  <Text style={styles.categoryTitle}>{item.category}</Text>
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