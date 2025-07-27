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
import Icon from 'react-native-vector-icons/Ionicons';
import { Message } from '@/types';
import { COLORS, SPACING, FONT_SIZES } from '@/utils/constants';
import { formatTimeAgo } from '@/utils/dateUtils';
import { STATE_ICONS } from '@/utils/icons';

interface MessageBubbleProps {
  message: Message;
  isOwnMessage: boolean;
  showAvatar?: boolean;
  showTimestamp?: boolean;
  onImagePress?: (imageUrl: string) => void;
  onLongPress?: (message: Message) => void;
}

export const MessageBubble: React.FC<MessageBubbleProps> = React.memo(({
  message,
  isOwnMessage,
  showAvatar = true,
  showTimestamp = true,
  onImagePress,
  onLongPress,
}) => {
  const renderMessageContent = () => {
    switch (message.type) {
      case 'TEXT':
        return (
          <Text 
            style={[
              styles.messageText,
              isOwnMessage ? styles.ownMessageText : styles.otherMessageText,
            ]}
            accessibilityLabel={`메시지: ${message.content}`}
          >
            {message.content}
          </Text>
        );
      
      case 'IMAGE':
        return (
          <TouchableOpacity
            onPress={() => onImagePress?.(message.content)}
            accessibilityRole="button"
            accessibilityLabel="이미지 보기"
            accessibilityHint="탭하면 이미지를 크게 볼 수 있습니다"
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

  const renderAvatar = () => {
    if (!showAvatar || isOwnMessage) return null;
    
    return (
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>👤</Text>
      </View>
    );
  };

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
          accessibilityHint="길게 누르면 메시지 옵션을 볼 수 있습니다"
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