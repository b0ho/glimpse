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
import { useAndroidSafeTranslation } from '@/hooks/useAndroidSafeTranslation';
import Icon from 'react-native-vector-icons/Ionicons';
import { useTheme } from '@/hooks/useTheme';
import { Message } from '@/types';
import { SPACING, FONT_SIZES } from '@/utils/constants';
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
  const { t } = useAndroidSafeTranslation('chat');
  const { colors } = useTheme();
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
              {
                color: isOwnMessage ? colors.TEXT.WHITE : colors.TEXT.PRIMARY,
              },
            ]}
            accessibilityLabel={`${t('common:accessibility.messageText')} ${message.content}`}
          >
            {message.content}
          </Text>
        );
      
      case 'IMAGE':
        return (
          <TouchableOpacity
            onPress={() => onImagePress?.(message.content)}
            accessibilityRole="button"
            accessibilityLabel={t('common:accessibility.viewImage')}
            accessibilityHint={t('accessibility:accessibility.viewImageHint')}
          >
            <Image
              source={{ uri: message.content }}
              style={styles.messageImage}
              resizeMode="cover"
            />
            <View style={[styles.imageOverlay, { backgroundColor: colors.OVERLAY }]}>
              <Icon
                name="expand"
                size={20}
                color={colors.TEXT.WHITE}
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
              color={isOwnMessage ? colors.TEXT.WHITE : colors.PRIMARY}
            />
            <Text
              style={[
                styles.fileName,
                {
                  color: isOwnMessage ? colors.TEXT.WHITE : colors.TEXT.PRIMARY,
                },
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
          color={message.isRead ? colors.SUCCESS : colors.TEXT.LIGHT}
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
          { color: colors.TEXT.LIGHT },
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
            {
              backgroundColor: isOwnMessage ? colors.PRIMARY : colors.SURFACE,
            },
            message.type === 'IMAGE' && styles.imageMessageBubble,
          ]}
          onLongPress={() => onLongPress?.(message)}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityHint={t('common:accessibility.messageOptions')}
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
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  imageMessageBubble: {
    padding: 4,
  },
  messageText: {
    fontSize: FONT_SIZES.MD,
    lineHeight: 20,
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