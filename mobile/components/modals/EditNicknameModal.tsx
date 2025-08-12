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
import { useTranslation } from 'react-i18next';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { COLORS, SPACING, TYPOGRAPHY } from '@/utils/constants';
import { useAuthStore } from '@/store/slices/authSlice';
import { useTheme } from '@/hooks/useTheme';
import { authService } from '@/services/api/authService';
import apiClient from '@/services/api/config';

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
export const EditNicknameModal = ({
  visible,
  onClose,
  onSuccess,
}) => {
  const { t } = useTranslation(['common', 'profile']);
  const { user, updateUserProfile } = useAuthStore();
  const { colors } = useTheme();
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
      Alert.alert(t('common:status.info'), t('common:modals.editNickname.minLength'));
      return;
    }
    
    if (trimmedNickname.length > 40) {
      Alert.alert(t('common:status.info'), t('common:modals.editNickname.maxLength'));
      return;
    }
    
    // 기존 닉네임과 동일한지 확인
    if (trimmedNickname === user?.nickname) {
      Alert.alert(t('common:status.info'), t('common:modals.editNickname.sameNickname'));
      return;
    }
    
    setIsLoading(true);
    
    try {
      // API 호출
      const response = await authService.updateProfile({
        nickname: trimmedNickname,
      });
      
      if (response.success) {
        // API에서 최신 프로필 다시 가져오기
        try {
          const profileResponse = await apiClient.get<{ success: boolean; data: any }>('/users/profile');
          if (profileResponse.success && profileResponse.data) {
            // 전체 사용자 정보 업데이트
            const currentUser = useAuthStore.getState().user;
            if (currentUser) {
              updateUserProfile({
                ...currentUser,
                nickname: profileResponse.data.nickname,
                bio: profileResponse.data.bio,
                profileImage: profileResponse.data.profileImage,
              });
            }
          }
        } catch (error) {
          console.error('Failed to fetch updated profile:', error);
          // 실패해도 로컬 업데이트는 진행
          updateUserProfile({ nickname: trimmedNickname });
        }
        
        Alert.alert(
          t('common:status.success'),
          t('common:modals.editNickname.changeSuccess'),
          [
            {
              text: t('common:actions.confirm'),
              onPress: () => {
                onSuccess?.();
                onClose();
              },
            },
          ]
        );
      } else {
        Alert.alert(t('common:status.error'), response.message || t('common:modals.editNickname.changeFailed'));
      }
    } catch (error) {
      console.error('Nickname update error:', error);
      Alert.alert(t('common:status.error'), t('common:modals.editNickname.changeError'));
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
          style={[styles.backdrop, { backgroundColor: colors.OVERLAY || 'rgba(0, 0, 0, 0.5)' }]}
          activeOpacity={1}
          onPress={onClose}
        />
        
        <View style={[styles.modalContent, { backgroundColor: colors.BACKGROUND }]}>
          <View style={styles.header}>
            <Text style={[styles.title, { color: colors.TEXT.PRIMARY }]}>{t('common:modals.editNickname.title')}</Text>
            <TouchableOpacity
              onPress={onClose}
              style={styles.closeButton}
            >
              <Ionicons name="close" size={24} color={colors.TEXT.PRIMARY} />
            </TouchableOpacity>
          </View>
          
          <View style={styles.body}>
            <Text style={[styles.label, { color: colors.TEXT.PRIMARY }]}>{t('common:modals.editNickname.newNickname')}</Text>
            <View style={styles.inputContainer}>
              <TextInput
                style={[styles.input, { 
                  backgroundColor: colors.SURFACE, 
                  color: colors.TEXT.PRIMARY,
                  borderColor: colors.BORDER
                }]}
                value={nickname}
                onChangeText={handleTextChange}
                placeholder={t('common:modals.editNickname.placeholder')}
                placeholderTextColor={colors.TEXT.LIGHT}
                autoFocus
                maxLength={40}
                editable={!isLoading}
              />
              <Text style={[
                styles.charCount,
                { color: colors.TEXT.SECONDARY },
                charCount > 35 && { color: colors.WARNING }
              ]}>
                {charCount}/40
              </Text>
            </View>
            
            <View style={[styles.infoContainer, { backgroundColor: colors.SURFACE }]}>
              <Ionicons 
                name="information-circle" 
                size={16} 
                color={colors.TEXT.SECONDARY} 
              />
              <Text style={[styles.infoText, { color: colors.TEXT.SECONDARY }]}>
                {t('common:modals.editNickname.info.line1')}{`\n`}
                {t('common:modals.editNickname.info.line2')}{`\n`}
                {t('common:modals.editNickname.info.line3')}
              </Text>
            </View>
          </View>
          
          <View style={styles.footer}>
            <TouchableOpacity
              style={[styles.cancelButton, { backgroundColor: colors.TEXT.LIGHT }]}
              onPress={onClose}
              disabled={isLoading}
            >
              <Text style={[styles.cancelButtonText, { color: colors.TEXT.PRIMARY }]}>{t('common:actions.cancel')}</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[
                styles.saveButton,
                { backgroundColor: colors.PRIMARY },
                (isLoading || nickname.trim().length === 0) && [styles.saveButtonDisabled, { backgroundColor: colors.TEXT.LIGHT }]
              ]}
              onPress={handleSave}
              disabled={isLoading || nickname.trim().length === 0}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color={colors.TEXT.WHITE} />
              ) : (
                <Text style={[styles.saveButtonText, { color: colors.TEXT.WHITE }]}>{t('common:actions.save')}</Text>
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
  },
  modalContent: {
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
    fontWeight: '600',
    marginBottom: SPACING.sm,
  },
  inputContainer: {
    position: 'relative',
    marginBottom: SPACING.md,
  },
  input: {
    ...TYPOGRAPHY.body,
    borderRadius: 12,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    paddingRight: 60,
    borderWidth: 1,
  },
  charCount: {
    ...TYPOGRAPHY.caption,
    position: 'absolute',
    right: SPACING.md,
    top: '50%',
    transform: [{ translateY: -8 }],
  },
  charCountWarning: {
    // Applied dynamically in component
  },
  infoContainer: {
    flexDirection: 'row',
    borderRadius: 8,
    padding: SPACING.sm,
    gap: SPACING.xs,
  },
  infoText: {
    ...TYPOGRAPHY.caption,
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
    borderRadius: 12,
    paddingVertical: SPACING.md,
    alignItems: 'center',
  },
  cancelButtonText: {
    ...TYPOGRAPHY.body,
    fontWeight: '600',
  },
  saveButton: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: SPACING.md,
    alignItems: 'center',
  },
  saveButtonDisabled: {
    // Applied dynamically in component
  },
  saveButtonText: {
    ...TYPOGRAPHY.body,
    fontWeight: '600',
  },
});