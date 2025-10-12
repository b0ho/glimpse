/**
 * 채팅 메시지 버블 컴포넌트
 */

import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  Platform,
} from 'react-native';
import { useAndroidSafeTranslation } from '@/hooks/useAndroidSafeTranslation';
import Icon from 'react-native-vector-icons/Ionicons';
import { useTheme } from '@/hooks/useTheme';
import { Message } from '@/types';
import { formatTimeAgo } from '@/utils/dateUtils';
import { STATE_ICONS } from '@/utils/icons';
import { cn } from '@/lib/utils';

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
      case 'text':
        return (
          <Text 
            className={cn(
              "text-base leading-5",
              isOwnMessage ? "text-white" : "text-gray-900 dark:text-white"
            )}
            accessibilityLabel={`${t('common:accessibility.messageText')} ${message.content}`}
          >
            {message.content}
          </Text>
        );
      
      case 'image':
        return (
          <TouchableOpacity
            onPress={() => onImagePress?.(message.content)}
            accessibilityRole="button"
            accessibilityLabel={t('common:accessibility.viewImage')}
            accessibilityHint={t('accessibility:accessibility.viewImageHint')}
          >
            <Image
              source={{ uri: message.content }}
              className="w-50 h-37.5 rounded-lg"
              resizeMode="cover"
            />
            <View className="absolute top-1 right-1 bg-black/50 rounded-lg p-1">
              <Icon
                name="expand"
                size={20}
                color="#FFFFFF"
                style={{ opacity: 0.8 }}
              />
            </View>
          </TouchableOpacity>
        );
      
      case 'voice':
        return (
          <View className="flex-row items-center min-w-32">
            <Icon
              name="document-attach"
              size={24}
              color={isOwnMessage ? "#FFFFFF" : colors.PRIMARY}
            />
            <Text
              className={cn(
                "ml-2 text-sm flex-1",
                isOwnMessage ? "text-white" : "text-gray-900 dark:text-white"
              )}
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
      <View className="w-8 h-8 rounded-full justify-center items-center mr-2 self-end">
        <Text className="text-sm">👤</Text>
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
      <View className="ml-1">
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
      <Text className="text-xs text-gray-500 dark:text-gray-400">
        {formatTimeAgo(message.createdAt)}
      </Text>
    );
  };

  return (
    <View
      className={cn(
        "flex-row my-1 px-4",
        isOwnMessage ? "justify-end" : "justify-start"
      )}
    >
      {/* 상대방 메시지의 아바타 */}
      {renderAvatar()}
      
      <View className="max-w-3/4">
        {/* 메시지 버블 */}
        <TouchableOpacity
          className={cn(
            "px-4 py-2 rounded-2xl",
            isOwnMessage 
              ? "bg-blue-500" 
              : "bg-gray-100 dark:bg-gray-700",
            message.type === 'image' && "p-1",
            Platform.select({
              ios: "shadow-sm",
              android: "elevation-1",
              web: "shadow-sm"
            })
          )}
          onLongPress={() => onLongPress?.(message)}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityHint={t('common:accessibility.messageOptions')}
        >
          {renderMessageContent()}
        </TouchableOpacity>
        
        {/* 시간 및 읽음 상태 */}
        <View
          className={cn(
            "flex-row items-center mt-1",
            isOwnMessage ? "justify-end" : "justify-start"
          )}
        >
          {renderTimestamp()}
          {renderReadStatus()}
        </View>
      </View>
    </View>
  );
});