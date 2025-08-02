import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, TYPOGRAPHY } from '@/utils/constants';
import { useAuthStore } from '@/store/slices/authSlice';
import { authService } from '@/services/api/authService';

/**
 * EditNicknameModal 컴포넌트 Props
 * @interface EditNicknameModalProps
 */
interface EditNicknameModalProps {
  /** 모달 표시 여부 */
  visible: boolean;
  /** 닫기 핸들러 */
  onClose: () => void;
  /** 성공 후 콜백 */
  onSuccess?: () => void;
}

/**
 * 닉네임 수정 모달 컴포넌트 - 사용자 닉네임 변경
 * @component
 * @param {EditNicknameModalProps} props - 컴포넌트 속성
 * @returns {JSX.Element} 닉네임 수정 모달 UI
 * @description 사용자가 자신의 닉네임을 수정할 수 있는 모달 컴포넌트
 */
export const EditNicknameModal: React.FC<EditNicknameModalProps> = ({
  visible,
  onClose,
  onSuccess,
}) => {
  const { user, updateUserProfile } = useAuthStore();
  const [nickname, setNickname] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [charCount, setCharCount] = useState(0);

  useEffect(() => {
    if (visible && user?.nickname) {
      setNickname(user.nickname);
      setCharCount(user.nickname.length);
    }
  }, [visible, user]);

  /**
   * 닉네임 저장 핸들러
   * @returns {Promise<void>}
   */
  const handleSave = async () => {
    const trimmedNickname = nickname.trim();
    
    // 유효성 검사
    if (trimmedNickname.length < 1) {
      Alert.alert('알림', '닉네임은 최소 1자 이상이어야 합니다.');
      return;
    }
    
    if (trimmedNickname.length > 40) {
      Alert.alert('알림', '닉네임은 최대 40자까지 가능합니다.');
      return;
    }
    
    // 기존 닉네임과 동일한지 확인
    if (trimmedNickname === user?.nickname) {
      Alert.alert('알림', '동일한 닉네임입니다.');
      return;
    }
    
    setIsLoading(true);
    
    try {
      // API 호출
      const response = await authService.updateProfile({
        nickname: trimmedNickname,
      });
      
      if (response.success) {
        // 스토어 업데이트
        updateUserProfile({ nickname: trimmedNickname });
        
        Alert.alert(
          '성공',
          '닉네임이 변경되었습니다.',
          [
            {
              text: '확인',
              onPress: () => {
                onSuccess?.();
                onClose();
              },
            },
          ]
        );
      } else {
        Alert.alert('오류', response.message || '닉네임 변경에 실패했습니다.');
      }
    } catch (error) {
      console.error('Nickname update error:', error);
      Alert.alert('오류', '닉네임 변경 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * 텍스트 변경 핸들러
   * @param {string} text - 입력된 텍스트
   * @returns {void}
   */
  const handleTextChange = (text: string) => {
    // 최대 40자 제한
    if (text.length <= 40) {
      setNickname(text);
      setCharCount(text.length);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={onClose}
        />
        
        <View style={styles.modalContent}>
          <View style={styles.header}>
            <Text style={styles.title}>닉네임 수정</Text>
            <TouchableOpacity
              onPress={onClose}
              style={styles.closeButton}
            >
              <Ionicons name="close" size={24} color={COLORS.text} />
            </TouchableOpacity>
          </View>
          
          <View style={styles.body}>
            <Text style={styles.label}>새 닉네임</Text>
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                value={nickname}
                onChangeText={handleTextChange}
                placeholder="닉네임을 입력하세요"
                placeholderTextColor={COLORS.textSecondary}
                autoFocus
                maxLength={40}
                editable={!isLoading}
              />
              <Text style={[
                styles.charCount,
                charCount > 35 && styles.charCountWarning
              ]}>
                {charCount}/40
              </Text>
            </View>
            
            <View style={styles.infoContainer}>
              <Ionicons 
                name="information-circle" 
                size={16} 
                color={COLORS.textSecondary} 
              />
              <Text style={styles.infoText}>
                • 닉네임은 1자 이상 40자 이하로 입력 가능합니다{`\n`}
                • 다른 사용자와 중복된 닉네임도 사용 가능합니다{`\n`}
                • 각 사용자는 고유 ID로 구별됩니다
              </Text>
            </View>
          </View>
          
          <View style={styles.footer}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={onClose}
              disabled={isLoading}
            >
              <Text style={styles.cancelButtonText}>취소</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[
                styles.saveButton,
                (isLoading || nickname.trim().length === 0) && styles.saveButtonDisabled
              ]}
              onPress={handleSave}
              disabled={isLoading || nickname.trim().length === 0}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color={COLORS.white} />
              ) : (
                <Text style={styles.saveButtonText}>저장</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: SPACING.md,
    paddingBottom: Platform.OS === 'ios' ? SPACING.xl : SPACING.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.lg,
  },
  title: {
    ...TYPOGRAPHY.h2,
    color: COLORS.text,
  },
  closeButton: {
    padding: SPACING.xs,
  },
  body: {
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.lg,
  },
  label: {
    ...TYPOGRAPHY.body,
    color: COLORS.text,
    fontWeight: '600',
    marginBottom: SPACING.sm,
  },
  inputContainer: {
    position: 'relative',
    marginBottom: SPACING.md,
  },
  input: {
    ...TYPOGRAPHY.body,
    backgroundColor: COLORS.gray50,
    borderRadius: 12,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    paddingRight: 60,
    color: COLORS.text,
    borderWidth: 1,
    borderColor: COLORS.gray200,
  },
  charCount: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    position: 'absolute',
    right: SPACING.md,
    top: '50%',
    transform: [{ translateY: -8 }],
  },
  charCountWarning: {
    color: COLORS.WARNING,
  },
  infoContainer: {
    flexDirection: 'row',
    backgroundColor: COLORS.gray50,
    borderRadius: 8,
    padding: SPACING.sm,
    gap: SPACING.xs,
  },
  infoText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    flex: 1,
    lineHeight: 18,
  },
  footer: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.lg,
    gap: SPACING.sm,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: COLORS.gray200,
    borderRadius: 12,
    paddingVertical: SPACING.md,
    alignItems: 'center',
  },
  cancelButtonText: {
    ...TYPOGRAPHY.body,
    color: COLORS.text,
    fontWeight: '600',
  },
  saveButton: {
    flex: 1,
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingVertical: SPACING.md,
    alignItems: 'center',
  },
  saveButtonDisabled: {
    backgroundColor: COLORS.gray300,
  },
  saveButtonText: {
    ...TYPOGRAPHY.body,
    color: COLORS.white,
    fontWeight: '600',
  },
});