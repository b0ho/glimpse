import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity
  Modal,
  FlatList,
  Dimensions,
} from 'react-native';
import { useAndroidSafeTranslation } from '@/hooks/useAndroidSafeTranslation';
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
export const MessageReactions: React.FC<MessageReactionsProps> = ({
  reactions,
  onAddReaction,
  onRemoveReaction,
  currentUserId,
}) => {
  const [showAllReactions, setShowAllReactions] = useState(false);
  const { t } = useAndroidSafeTranslation('chat');

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
      className="reactionBubble"
      onPress={() => handleReactionPress(reaction)}
    >
      <Text className="reactionEmoji">{reaction.emoji}</Text>
      {reaction.count > 1 && (
        <Text className="reactionCount">
          {reaction.count}
        </Text>
      )}
    </TouchableOpacity>
  );

  return (
    <>
      <View className="container">
        {reactions.map(renderReaction)}
        
        <TouchableOpacity
          className="addReactionButton"
          onPress={() => setShowAllReactions(true)}
        >
          <Text className="addReactionText">+</Text>
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
          className="modalOverlay"
          activeOpacity={1}
          onPress={() => setShowAllReactions(false)}
        >
          <View className="modalContent">
            <View className="modalHeader">
              <Text className="modalTitle">{t('common:reactions.addReaction')}</Text>
            </View>

            {/* 빠른 선택 */}
            <View className="quickReactionsContainer">
              {QUICK_REACTIONS.map((emoji) => (
                <TouchableOpacity
                  key={emoji}
                  className="quickReactionButton"
                  onPress={() => handleEmojiSelect(emoji)}
                >
                  <Text className="quickReactionEmoji">{emoji}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* 카테고리별 이모지 */}
            <FlatList
              data={ALL_REACTIONS}
              keyExtractor={(item) => item.category}
              renderItem={({ item }) => (
                <View className="categoryContainer">
                  <Text className="categoryTitle">{t(`reactions.categories.${item.category}`)}</Text>
                  <View className="emojiGrid">
                    {item.emojis.map((emoji) => (
                      <TouchableOpacity
                        key={emoji}
                        className="emojiButton"
                        onPress={() => handleEmojiSelect(emoji)}
                      >
                        <Text className="emoji">{emoji}</Text>
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

