/**
 * 채팅 메시지 입력 컴포넌트
 */

import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Keyboard,
  Platform,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import * as ImagePicker from 'expo-image-picker';
import { COLORS, SPACING, FONT_SIZES } from '@/utils/constants';
import { ACTION_ICONS, UI_ICONS } from '@/utils/icons';

/**
 * MessageInput 컴포넌트 Props
 * @interface MessageInputProps
 */
interface MessageInputProps {
  /** 메시지 전송 핸들러 */
  onSendMessage: (content: string, type?: 'TEXT' | 'IMAGE' | 'VOICE' | 'LOCATION' | 'STORY_REPLY') => Promise<void>;
  /** 타이핑 상태 변경 핸들러 */
  onTypingStatusChange?: (isTyping: boolean) => void;
  /** 비활성화 여부 */
  disabled?: boolean;
  /** 플레이스홀더 텍스트 */
  placeholder?: string;
}

/**
 * 메시지 입력 컴포넌트 - 채팅 메시지 입력 및 전송
 * @component
 * @param {MessageInputProps} props - 컴포넌트 속성
 * @returns {JSX.Element} 메시지 입력 UI
 * @description 텍스트 입력, 이미지 첨부, 타이핑 상태 관리 등 채팅 입력 기능 제공
 */
export const MessageInput: React.FC<MessageInputProps> = React.memo(({
  onSendMessage,
  onTypingStatusChange,
  disabled = false,
  placeholder = '메시지를 입력하세요...',
}) => {
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [showAttachmentOptions, setShowAttachmentOptions] = useState(false);
  
  const textInputRef = useRef<TextInput>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 컴포넌트 언마운트 시 타이머 정리 (메모리 누수 방지)
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = null;
      }
    };
  }, []);

  /**
   * 텍스트 변경 핸들러
   * @param {string} text - 입력된 텍스트
   * @returns {void}
   */
  const handleTextChange = useCallback((text: string) => {
    setMessage(text);
    
    // 타이핑 상태 전송
    if (onTypingStatusChange) {
      onTypingStatusChange(text.length > 0);
      
      // 타이핑 중지 타이머
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      
      typingTimeoutRef.current = setTimeout(() => {
        onTypingStatusChange(false);
      }, 1000);
    }
  }, [onTypingStatusChange]);

  /**
   * 메시지 전송 처리
   * @returns {Promise<void>}
   */
  const handleSendMessage = useCallback(async () => {
    const trimmedMessage = message.trim();
    if (!trimmedMessage || isSending || disabled) return;

    setIsSending(true);
    
    try {
      await onSendMessage(trimmedMessage, 'TEXT');
      setMessage('');
      
      // 타이핑 상태 중지
      if (onTypingStatusChange) {
        onTypingStatusChange(false);
      }
      
      // 포커스 유지
      textInputRef.current?.focus();
    } catch (error) {
      console.error('Failed to send message:', error);
      Alert.alert('오류', '메시지 전송에 실패했습니다.');
    } finally {
      setIsSending(false);
    }
  }, [message, isSending, disabled, onSendMessage, onTypingStatusChange]);

  /**
   * 갤러리에서 이미지 선택 및 전송
   * @returns {Promise<void>}
   */
  const handleImagePicker = useCallback(async () => {
    setShowAttachmentOptions(false);
    
    try {
      // 권한 요청
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('권한 필요', '사진을 선택하려면 갤러리 접근 권한이 필요합니다.');
        return;
      }

      // 이미지 선택
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
        base64: false,
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        setIsSending(true);
        
        try {
          // 실제 구현에서는 이미지를 서버에 업로드하고 URL을 받아와야 함
          await onSendMessage(asset.uri, 'IMAGE');
        } catch (error) {
          console.error('Failed to send image:', error);
          Alert.alert('오류', '이미지 전송에 실패했습니다.');
        } finally {
          setIsSending(false);
        }
      }
    } catch (error) {
      console.error('Image picker error:', error);
      Alert.alert('오류', '이미지를 선택하는 중 오류가 발생했습니다.');
    }
  }, [onSendMessage]);

  /**
   * 카메라로 사진 촬영 및 전송
   * @returns {Promise<void>}
   */
  const handleCamera = useCallback(async () => {
    setShowAttachmentOptions(false);
    
    try {
      // 권한 요청
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('권한 필요', '사진을 촬영하려면 카메라 접근 권한이 필요합니다.');
        return;
      }

      // 카메라 실행
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
        base64: false,
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        setIsSending(true);
        
        try {
          await onSendMessage(asset.uri, 'IMAGE');
        } catch (error) {
          console.error('Failed to send camera image:', error);
          Alert.alert('오류', '사진 전송에 실패했습니다.');
        } finally {
          setIsSending(false);
        }
      }
    } catch (error) {
      console.error('Camera error:', error);
      Alert.alert('오류', '카메라를 실행하는 중 오류가 발생했습니다.');
    }
  }, [onSendMessage]);

  /**
   * 첨부파일 옵션 토글
   * @returns {void}
   */
  const toggleAttachmentOptions = useCallback(() => {
    setShowAttachmentOptions(!showAttachmentOptions);
    Keyboard.dismiss();
  }, [showAttachmentOptions]);

  // Enter 키로 전송 (Android)
  const handleSubmitEditing = useCallback(() => {
    if (Platform.OS === 'android') {
      handleSendMessage();
    }
  }, [handleSendMessage]);

  /**
   * 첨부파일 옵션 렌더링
   * @returns {JSX.Element | null} 첨부파일 옵션 UI
   */
  const renderAttachmentOptions = () => {
    if (!showAttachmentOptions) return null;

    return (
      <View style={styles.attachmentOptions}>
        <TouchableOpacity
          style={styles.attachmentOption}
          onPress={handleCamera}
          accessibilityRole="button"
          accessibilityLabel="카메라로 사진 촬영"
        >
          <Icon name={UI_ICONS.CAMERA} size={24} color={COLORS.PRIMARY} />
          <Text style={styles.attachmentOptionText}>카메라</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.attachmentOption}
          onPress={handleImagePicker}
          accessibilityRole="button"
          accessibilityLabel="갤러리에서 사진 선택"
        >
          <Icon name={UI_ICONS.IMAGE} size={24} color={COLORS.PRIMARY} />
          <Text style={styles.attachmentOptionText}>갤러리</Text>
        </TouchableOpacity>
      </View>
    );
  };

  const canSend = message.trim().length > 0 && !isSending && !disabled;

  return (
    <View style={styles.container}>
      {renderAttachmentOptions()}
      
      <View style={styles.inputContainer}>
        {/* 첨부파일 버튼 */}
        <TouchableOpacity
          style={styles.attachmentButton}
          onPress={toggleAttachmentOptions}
          disabled={disabled}
          accessibilityRole="button"
          accessibilityLabel="첨부파일"
          accessibilityHint="이미지를 첨부할 수 있습니다"
        >
          <Icon
            name={showAttachmentOptions ? UI_ICONS.CLOSE : ACTION_ICONS.ADD}
            size={24}
            color={disabled ? COLORS.TEXT.LIGHT : COLORS.PRIMARY}
          />
        </TouchableOpacity>

        {/* 텍스트 입력 */}
        <TextInput
          ref={textInputRef}
          style={[styles.textInput, disabled && styles.disabledInput]}
          value={message}
          onChangeText={handleTextChange}
          placeholder={placeholder}
          placeholderTextColor={COLORS.TEXT.LIGHT}
          multiline
          maxLength={1000}
          editable={!disabled}
          returnKeyType="send"
          onSubmitEditing={handleSubmitEditing}
          accessibilityLabel="메시지 입력"
          accessibilityHint="여기에 보낼 메시지를 입력하세요"
        />

        {/* 전송 버튼 */}
        <TouchableOpacity
          style={[
            styles.sendButton,
            canSend ? styles.sendButtonActive : styles.sendButtonInactive,
          ]}
          onPress={handleSendMessage}
          disabled={!canSend}
          accessibilityRole="button"
          accessibilityLabel="메시지 전송"
          accessibilityHint={canSend ? '메시지를 전송합니다' : '메시지를 입력한 후 전송할 수 있습니다'}
        >
          <Icon
            name={isSending ? 'hourglass' : UI_ICONS.SEND}
            size={20}
            color={canSend ? COLORS.TEXT.WHITE : COLORS.TEXT.LIGHT}
          />
        </TouchableOpacity>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.SURFACE,
    paddingBottom: SPACING.SM,
  },
  attachmentOptions: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.MD,
    paddingVertical: SPACING.SM,
    backgroundColor: COLORS.BACKGROUND,
    borderTopWidth: 1,
    borderTopColor: COLORS.BORDER,
  },
  attachmentOption: {
    alignItems: 'center',
    marginRight: SPACING.XL,
  },
  attachmentOptionText: {
    fontSize: FONT_SIZES.XS,
    color: COLORS.TEXT.SECONDARY,
    marginTop: SPACING.XS,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: SPACING.MD,
    paddingVertical: SPACING.SM,
  },
  attachmentButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.BACKGROUND,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.SM,
  },
  textInput: {
    flex: 1,
    minHeight: 40,
    maxHeight: 100,
    borderWidth: 1,
    borderColor: COLORS.BORDER,
    borderRadius: 20,
    paddingHorizontal: SPACING.MD,
    paddingVertical: SPACING.SM,
    fontSize: FONT_SIZES.MD,
    color: COLORS.TEXT.PRIMARY,
    backgroundColor: COLORS.BACKGROUND,
    marginRight: SPACING.SM,
    textAlignVertical: 'center',
  },
  disabledInput: {
    opacity: 0.6,
    backgroundColor: COLORS.TEXT.LIGHT,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonActive: {
    backgroundColor: COLORS.PRIMARY,
  },
  sendButtonInactive: {
    backgroundColor: COLORS.BORDER,
  },
});