/**
 * 채팅 메시지 버블 컴포넌트
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import Icon from 'react-native-vector-icons/Ionicons';
import { Message } from '@/types';
import { COLORS, SPACING, FONT_SIZES } from '@/utils/constants';
import { formatTimeAgo } from '@/utils/dateUtils';
import { STATE_ICONS } from '@/utils/icons';

/**
 * MessageBubble 컴포넌트 Props
 * @interface MessageBubbleProps
 */
interface MessageBubbleProps {
  /** 메시지 데이터 */
  message: Message;
  /** 내 메시지 여부 */
  isOwnMessage: boolean;
  /** 아바타 표시 여부 */
  showAvatar?: boolean;
  /** 타임스탬프 표시 여부 */
  showTimestamp?: boolean;
  /** 이미지 클릭 핸들러 */
  onImagePress?: (imageUrl: string) => void;
  /** 길게 누르기 핸들러 */
  onLongPress?: (message: Message) => void;
}

/**
 * 메시지 버블 컴포넌트 - 채팅 메시지 표시
 * @component
 * @param {MessageBubbleProps} props - 컴포넌트 속성
 * @returns {JSX.Element} 메시지 버블 UI
 * @description 텍스트, 이미지, 음성 등 다양한 타입의 메시지를 버블 형태로 표시
 */
export const MessageBubble: React.FC<MessageBubbleProps> = React.memo(({
  message,
  isOwnMessage,
  showAvatar = true,
  showTimestamp = true,
  onImagePress,
  onLongPress,
}) => {
  const { t } = useTranslation('chat');
  /**
   * 메시지 컨텐츠 렌더링
   * @returns {JSX.Element | null} 메시지 타입에 따른 컨텐츠
   */
  const renderMessageContent = () => {
    switch (message.type) {
      case 'TEXT':
        return (
          <Text 
            style={[
              styles.messageText,
              isOwnMessage ? styles.ownMessageText : styles.otherMessageText,
            ]}
            accessibilityLabel={`${t('accessibility.messageText')} ${message.content}`}
          >
            {message.content}
          </Text>
        );
      
      case 'IMAGE':
        return (
          <TouchableOpacity
            onPress={() => onImagePress?.(message.content)}
            accessibilityRole="button"
            accessibilityLabel={t('accessibility.viewImage')}
            accessibilityHint={t('accessibility.viewImageHint')}
          >
            <Image
              source={{ uri: message.content }}
              style={styles.messageImage}
              resizeMode="cover"
            />
            <View style={styles.imageOverlay}>
              <Icon
                name="expand"
                size={20}
                color={COLORS.TEXT.WHITE}
                style={styles.expandIcon}
              />
            </View>
          </TouchableOpacity>
        );
      
      case 'VOICE':
        return (
          <View style={styles.fileMessage}>
            <Icon
              name="document-attach"
              size={24}
              color={isOwnMessage ? COLORS.TEXT.WHITE : COLORS.PRIMARY}
            />
            <Text
              style={[
                styles.fileName,
                isOwnMessage ? styles.ownMessageText : styles.otherMessageText,
              ]}
            >
              {message.content}
            </Text>
          </View>
        );
      
      default:
        return null;
    }
  };

  /**
   * 아바타 렌더링
   * @returns {JSX.Element | null} 상대방 아바타
   */
  const renderAvatar = () => {
    if (!showAvatar || isOwnMessage) return null;
    
    return (
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>👤</Text>
      </View>
    );
  };

  /**
   * 읽음 상태 렌더링
   * @returns {JSX.Element | null} 읽음 상태 아이콘
   */
  const renderReadStatus = () => {
    if (!isOwnMessage) return null;

    return (
      <View style={styles.readStatus}>
        <Icon
          name={message.isRead ? STATE_ICONS.LIKED : STATE_ICONS.UNLIKED}
          size={12}
          color={message.isRead ? COLORS.SUCCESS : COLORS.TEXT.LIGHT}
        />
      </View>
    );
  };

  /**
   * 타임스탬프 렌더링
   * @returns {JSX.Element | null} 시간 표시
   */
  const renderTimestamp = () => {
    if (!showTimestamp) return null;

    return (
      <Text
        style={[
          styles.timestamp,
          isOwnMessage ? styles.ownTimestamp : styles.otherTimestamp,
        ]}
      >
        {formatTimeAgo(message.createdAt)}
      </Text>
    );
  };

  return (
    <View
      style={[
        styles.messageContainer,
        isOwnMessage ? styles.ownMessageContainer : styles.otherMessageContainer,
      ]}
    >
      {/* 상대방 메시지의 아바타 */}
      {renderAvatar()}
      
      <View style={styles.messageWrapper}>
        {/* 메시지 버블 */}
        <TouchableOpacity
          style={[
            styles.messageBubble,
            isOwnMessage ? styles.ownMessageBubble : styles.otherMessageBubble,
            message.type === 'IMAGE' && styles.imageMessageBubble,
          ]}
          onLongPress={() => onLongPress?.(message)}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityHint={t('accessibility.messageOptions')}
        >
          {renderMessageContent()}
        </TouchableOpacity>
        
        {/* 시간 및 읽음 상태 */}
        <View
          style={[
            styles.messageInfo,
            isOwnMessage ? styles.ownMessageInfo : styles.otherMessageInfo,
          ]}
        >
          {renderTimestamp()}
          {renderReadStatus()}
        </View>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  messageContainer: {
    flexDirection: 'row',
    marginVertical: SPACING.XS,
    paddingHorizontal: SPACING.MD,
  },
  ownMessageContainer: {
    justifyContent: 'flex-end',
  },
  otherMessageContainer: {
    justifyContent: 'flex-start',
  },
  messageWrapper: {
    maxWidth: '75%',
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.PRIMARY,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.SM,
    alignSelf: 'flex-end',
  },
  avatarText: {
    fontSize: FONT_SIZES.SM,
  },
  messageBubble: {
    paddingHorizontal: SPACING.MD,
    paddingVertical: SPACING.SM,
    borderRadius: 18,
    elevation: 1,
    shadowColor: COLORS.SHADOW,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  ownMessageBubble: {
    backgroundColor: COLORS.PRIMARY,
    borderBottomRightRadius: 6,
  },
  otherMessageBubble: {
    backgroundColor: COLORS.SURFACE,
    borderBottomLeftRadius: 6,
  },
  imageMessageBubble: {
    padding: 4,
  },
  messageText: {
    fontSize: FONT_SIZES.MD,
    lineHeight: 20,
  },
  ownMessageText: {
    color: COLORS.TEXT.WHITE,
  },
  otherMessageText: {
    color: COLORS.TEXT.PRIMARY,
  },
  messageImage: {
    width: 200,
    height: 150,
    borderRadius: 12,
  },
  imageOverlay: {
    position: 'absolute',
    top: SPACING.XS,
    right: SPACING.XS,
    backgroundColor: COLORS.OVERLAY,
    borderRadius: 12,
    padding: 4,
  },
  expandIcon: {
    opacity: 0.8,
  },
  fileMessage: {
    flexDirection: 'row',
    alignItems: 'center',
    minWidth: 120,
  },
  fileName: {
    marginLeft: SPACING.SM,
    fontSize: FONT_SIZES.SM,
    flex: 1,
  },
  messageInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  ownMessageInfo: {
    justifyContent: 'flex-end',
  },
  otherMessageInfo: {
    justifyContent: 'flex-start',
  },
  timestamp: {
    fontSize: FONT_SIZES.XS,
    color: COLORS.TEXT.LIGHT,
  },
  ownTimestamp: {
    marginRight: SPACING.XS,
  },
  otherTimestamp: {
    marginLeft: SPACING.XS,
  },
  readStatus: {
    marginLeft: 2,
  },
});