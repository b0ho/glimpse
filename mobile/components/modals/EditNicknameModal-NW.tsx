import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useAndroidSafeTranslation } from '@/hooks/useAndroidSafeTranslation';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useAuthStore } from '@/store/slices/authSlice';
import { useTheme } from '@/hooks/useTheme';
import { authService } from '@/services/api/authService';
import apiClient from '@/services/api/config';
import { cn } from '@/lib/utils';

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
 * 닉네임 수정 모달 컴포넌트 - 사용자 닉네임 변경 (NativeWind v4)
 * @component
 * @param {EditNicknameModalProps} props - 컴포넌트 속성
 * @returns {JSX.Element} 닉네임 수정 모달 UI
 * @description 사용자가 자신의 닉네임을 수정할 수 있는 모달 컴포넌트
 */
export const EditNicknameModal = ({
  visible,
  onClose,
  onSuccess,
}: EditNicknameModalProps) => {
  const { t } = useAndroidSafeTranslation('common');
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
        className="flex-1 justify-end"
      >
        <TouchableOpacity
          className="absolute inset-0 bg-black/50 dark:bg-black/60"
          activeOpacity={1}
          onPress={onClose}
        />
        
        <View className="bg-white dark:bg-gray-900 rounded-t-[20px] pt-4 pb-6 ios:pb-8">
          {/* Header */}
          <View className="flex-row items-center justify-between px-6 mb-6">
            <Text className="text-xl font-bold text-gray-900 dark:text-white">
              {t('common:modals.editNickname.title')}
            </Text>
            <TouchableOpacity
              onPress={onClose}
              className="w-8 h-8 items-center justify-center"
            >
              <Ionicons name="close" size={24} color={colors.TEXT.PRIMARY} />
            </TouchableOpacity>
          </View>
          
          {/* Body */}
          <View className="px-6 mb-6">
            <Text className="text-base font-semibold text-gray-900 dark:text-white mb-3">
              {t('common:modals.editNickname.newNickname')}
            </Text>
            
            {/* Input Container */}
            <View className="relative mb-4">
              <TextInput
                className={cn(
                  "text-base border border-gray-200 dark:border-gray-700 rounded-xl",
                  "px-4 py-4 pr-16 bg-gray-50 dark:bg-gray-800",
                  "text-gray-900 dark:text-white"
                )}
                value={nickname}
                onChangeText={handleTextChange}
                placeholder={t('common:modals.editNickname.placeholder')}
                placeholderTextColor={colors.TEXT.LIGHT}
                autoFocus
                maxLength={40}
                editable={!isLoading}
              />
              
              <Text className={cn(
                "absolute right-4 top-1/2 -translate-y-1/2 text-xs",
                charCount > 35 
                  ? "text-orange-500 dark:text-orange-400" 
                  : "text-gray-500 dark:text-gray-400"
              )}>
                {charCount}/40
              </Text>
            </View>
            
            {/* Info Container */}
            <View className="flex-row bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
              <Ionicons 
                name="information-circle" 
                size={16} 
                color={colors.TEXT.SECONDARY}
                style={{ marginTop: 2 }}
              />
              <Text className="text-sm text-gray-600 dark:text-gray-400 ml-2 flex-1 leading-5">
                {t('common:modals.editNickname.info.line1')}{`\n`}
                {t('common:modals.editNickname.info.line2')}{`\n`}
                {t('common:modals.editNickname.info.line3')}
              </Text>
            </View>
          </View>
          
          {/* Footer */}
          <View className="flex-row px-6 gap-3">
            {/* Cancel Button */}
            <TouchableOpacity
              className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-xl py-4 items-center"
              onPress={onClose}
              disabled={isLoading}
            >
              <Text className="text-base font-semibold text-gray-900 dark:text-white">
                {t('common:actions.cancel')}
              </Text>
            </TouchableOpacity>
            
            {/* Save Button */}
            <TouchableOpacity
              className={cn(
                "flex-1 rounded-xl py-4 items-center",
                (isLoading || nickname.trim().length === 0)
                  ? "bg-gray-300 dark:bg-gray-600"
                  : "bg-teal-400 dark:bg-teal-500"
              )}
              onPress={handleSave}
              disabled={isLoading || nickname.trim().length === 0}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <Text className="text-base font-semibold text-white">
                  {t('common:actions.save')}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};