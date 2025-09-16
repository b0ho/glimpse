import React, { useState } from 'react';
import {
  View,
  Text,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAndroidSafeTranslation } from '@/hooks/useAndroidSafeTranslation';
import { useAuth } from '@/hooks/useAuth';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useTheme } from '@/hooks/useTheme';
import { useAuthStore } from '@/store/slices/authSlice';
import { authService } from '@/services/api/authService';
import { accountDeletionService } from '@/services/api/accountDeletionService';
import { cn } from '@/lib/utils';

export const DeleteAccountScreen = () => {
  const navigation = useNavigation();
  const { signOut } = useAuth();
  const { user, clearAuth } = useAuthStore();
  const { t } = useAndroidSafeTranslation();
  const { colors, isDarkMode } = useTheme();
  
  const [deleteReason, setDeleteReason] = useState('');
  const [confirmText, setConfirmText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  
  const reasons = [
    { id: 'not_useful', text: t('settings:deleteAccount.reason.options.not_useful') },
    { id: 'privacy_concern', text: t('settings:deleteAccount.reason.options.privacy_concern') },
    { id: 'found_partner', text: t('settings:deleteAccount.reason.options.found_partner') },
    { id: 'technical_issues', text: t('settings:deleteAccount.reason.options.technical_issues') },
    { id: 'other', text: t('settings:deleteAccount.reason.options.other') },
  ];
  
  const handleDelete = async () => {
    const requiredText = String(t('settings:deleteAccount.confirm.confirmText'));
    console.log('[DeleteAccount] Comparing:', { confirmText, requiredText, match: confirmText === requiredText });
    
    if (confirmText !== requiredText) {
      const title = String(t('settings:deleteAccount.alerts.confirmRequired.title'));
      const message = String(t('settings:deleteAccount.alerts.confirmRequired.message'));
      if (Platform.OS === 'web') {
        alert(`${title}\n\n${message}`);
      } else {
        Alert.alert(title, message);
      }
      return;
    }
    
    // For web compatibility, use window.confirm instead of Alert.alert
    if (Platform.OS === 'web') {
      const confirmMessage = `${String(t('settings:deleteAccount.alerts.finalConfirm.title'))}\n\n${String(t('settings:deleteAccount.alerts.finalConfirm.message'))}`;
      if (window.confirm(confirmMessage)) {
        handleDeleteConfirmed();
      }
    } else {
      Alert.alert(
        String(t('settings:deleteAccount.alerts.finalConfirm.title')),
        String(t('settings:deleteAccount.alerts.finalConfirm.message')),
        [
          { text: String(t('settings:deleteAccount.alerts.finalConfirm.cancel')), style: 'cancel' },
          {
            text: String(t('settings:deleteAccount.alerts.finalConfirm.delete')),
            style: 'destructive',
            onPress: handleDeleteConfirmed,
          },
        ]
      );
    }
  };
  
  const handleDeleteConfirmed = async () => {
    setIsDeleting(true);
    
    try {
      // 새로운 7일 대기 시스템 API 호출
      const response = await accountDeletionService.requestDeletion({
        reason: deleteReason,
      });
      
      if (response.success) {
        const successMessage = `계정 삭제가 요청되었습니다.\n\n• ${response.daysRemaining}일 후 완전 삭제 예정\n• 삭제 예정일: ${new Date(response.scheduledDeletionAt).toLocaleDateString('ko-KR')}\n• 기간 내 복구 가능`;
        
        if (Platform.OS === 'web') {
          alert(`계정 삭제 요청 완료\n\n${successMessage}`);
          navigation.goBack();
        } else {
          Alert.alert(
            '계정 삭제 요청 완료',
            successMessage,
            [
              {
                text: '확인',
                onPress: () => {
                  navigation.goBack();
                },
              },
            ],
            { cancelable: false }
          );
        }
      } else {
        const errorMessage = response.message || String(t('settings:deleteAccount.alerts.error.message'));
        if (Platform.OS === 'web') {
          alert(`${String(t('settings:deleteAccount.alerts.error.title'))}\n\n${errorMessage}`);
        } else {
          Alert.alert(String(t('settings:deleteAccount.alerts.error.title')), errorMessage);
        }
      }
    } catch (error) {
      console.error('Delete account error:', error);
      const errorMessage = String(t('settings:deleteAccount.alerts.error.message'));
      if (Platform.OS === 'web') {
        alert(`${String(t('settings:deleteAccount.alerts.error.title'))}\n\n${errorMessage}`);
      } else {
        Alert.alert(String(t('settings:deleteAccount.alerts.error.title')), errorMessage);
      }
    } finally {
      setIsDeleting(false);
    }
  };
  
  return (
    <SafeAreaView 
      className={cn(
        "flex-1",
"bg-white dark:bg-gray-900"
      )}
      style={{ backgroundColor: colors.BACKGROUND }}
    >
      <View 
        className={cn(
          "flex-row items-center justify-between px-4 py-3 border-b",
"bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700"
        )}
        style={{ 
          backgroundColor: colors.SURFACE, 
          borderBottomColor: colors.BORDER 
        }}
      >
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          className="p-1"
        >
          <Ionicons name="arrow-back" size={24} color={colors.TEXT.PRIMARY} />
        </TouchableOpacity>
        <Text 
          className="text-xl font-semibold"
          style={{ color: colors.TEXT.PRIMARY }}
        >
          {t('settings:deleteAccount.title')}
        </Text>
        <View className="w-10" />
      </View>
      
      <ScrollView 
        className="flex-1 px-4"
        showsVerticalScrollIndicator={false}
      >
        <View 
          className="rounded-xl p-6 mt-6 items-center border"
          style={{ 
            backgroundColor: colors.ERROR + '10', 
            borderColor: colors.ERROR + '20' 
          }}
        >
          <Ionicons name="warning" size={48} color={colors.ERROR} />
          <Text 
            className="text-xl font-semibold mt-3 mb-2"
            style={{ color: colors.ERROR }}
          >
            {t('settings:deleteAccount.warning.title')}
          </Text>
          <Text 
            className="text-base text-center mb-4"
            style={{ color: colors.TEXT.PRIMARY }}
          >
            {t('settings:deleteAccount.warning.description')}
          </Text>
          
          <View className="w-full">
            <View className="flex-row mb-3">
              <Text 
                className="text-base mr-2"
                style={{ color: colors.ERROR }}
              >
                •
              </Text>
              <Text 
                className="text-base flex-1"
                style={{ color: colors.TEXT.PRIMARY }}
              >
                {t('settings:deleteAccount.warning.items.profile')}
              </Text>
            </View>
            <View className="flex-row mb-3">
              <Text 
                className="text-base mr-2"
                style={{ color: colors.ERROR }}
              >
                •
              </Text>
              <Text 
                className="text-base flex-1"
                style={{ color: colors.TEXT.PRIMARY }}
              >
                {t('settings:deleteAccount.warning.items.matches')}
              </Text>
            </View>
            <View className="flex-row mb-3">
              <Text 
                className="text-base mr-2"
                style={{ color: colors.ERROR }}
              >
                •
              </Text>
              <Text 
                className="text-base flex-1"
                style={{ color: colors.TEXT.PRIMARY }}
              >
                {t('settings:deleteAccount.warning.items.credits')}
              </Text>
            </View>
            <View className="flex-row mb-3">
              <Text 
                className="text-base mr-2"
                style={{ color: colors.ERROR }}
              >
                •
              </Text>
              <Text 
                className="text-base flex-1"
                style={{ color: colors.TEXT.PRIMARY }}
              >
                {t('settings:deleteAccount.warning.items.recovery')}
              </Text>
            </View>
            <View className="flex-row">
              <Text 
                className="text-base mr-2"
                style={{ color: colors.ERROR }}
              >
                •
              </Text>
              <Text 
                className="text-base flex-1"
                style={{ color: colors.TEXT.PRIMARY }}
              >
                {t('settings:deleteAccount.warning.items.permanent')}
              </Text>
            </View>
          </View>
        </View>
        
        <View className="mt-8">
          <Text 
            className="text-lg font-semibold mb-4"
            style={{ color: colors.TEXT.PRIMARY }}
          >
            {t('settings:deleteAccount.reason.title')}
          </Text>
          <View 
            className="rounded-xl p-4"
            style={{ backgroundColor: colors.SURFACE }}
          >
            {reasons.map((reason) => (
              <TouchableOpacity
                key={reason.id}
                className={cn(
                  "flex-row items-center py-3",
                  deleteReason === reason.id && "mx-[-8px] px-2 rounded-lg"
                )}
                style={deleteReason === reason.id ? 
                  { backgroundColor: colors.PRIMARY + '05' } : 
                  undefined
                }
                onPress={() => setDeleteReason(reason.id)}
              >
                <View 
                  className="w-5 h-5 rounded-full border-2 mr-3 items-center justify-center"
                  style={{ 
                    borderColor: deleteReason === reason.id ? colors.PRIMARY : colors.BORDER 
                  }}
                >
                  {deleteReason === reason.id && (
                    <View 
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: colors.PRIMARY }}
                    />
                  )}
                </View>
                <Text 
                  className="text-base"
                  style={{ color: colors.TEXT.PRIMARY }}
                >
                  {reason.text}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
        
        <View className="mt-8">
          <Text 
            className="text-lg font-semibold mb-3"
            style={{ color: colors.TEXT.PRIMARY }}
          >
            {t('settings:deleteAccount.confirm.title')}
          </Text>
          <Text 
            className="text-base mb-3"
            style={{ color: colors.TEXT.PRIMARY }}
          >
            {t('settings:deleteAccount.confirm.description')} 
            <Text 
              className="font-bold"
              style={{ color: colors.ERROR }}
            >
              {t('settings:deleteAccount.confirm.confirmText')}
            </Text>
            {t('settings:deleteAccount.confirm.descriptionEnd')}
          </Text>
          <TextInput
            className="rounded-xl px-4 py-4 border text-base"
            style={{ 
              backgroundColor: colors.SURFACE, 
              borderColor: colors.BORDER, 
              color: colors.TEXT.PRIMARY 
            }}
            value={confirmText}
            onChangeText={setConfirmText}
            placeholder={t('settings:deleteAccount.confirm.placeholder')}
            placeholderTextColor={colors.TEXT.LIGHT}
            autoCapitalize="none"
            autoCorrect={false}
            editable={!isDeleting}
          />
        </View>
        
        <TouchableOpacity
          className={cn(
            "rounded-xl py-4 items-center mt-8 mb-3",
            confirmText !== String(t('settings:deleteAccount.confirm.confirmText')) && "opacity-50"
          )}
          style={{
            backgroundColor: confirmText !== String(t('settings:deleteAccount.confirm.confirmText')) 
              ? colors.TEXT.LIGHT 
              : colors.ERROR
          }}
          onPress={handleDelete}
          disabled={confirmText !== String(t('settings:deleteAccount.confirm.confirmText')) || isDeleting}
        >
          {isDeleting ? (
            <ActivityIndicator size="small" color={colors.TEXT.WHITE} />
          ) : (
            <Text 
              className="text-base font-bold"
              style={{ color: colors.TEXT.WHITE }}
            >
              {t('settings:deleteAccount.confirm.button')}
            </Text>
          )}
        </TouchableOpacity>
        
        <TouchableOpacity
          className="rounded-xl py-4 items-center mb-8 border"
          style={{ 
            backgroundColor: colors.SURFACE, 
            borderColor: colors.BORDER 
          }}
          onPress={() => navigation.goBack()}
          disabled={isDeleting}
        >
          <Text 
            className="text-base font-semibold"
            style={{ color: colors.TEXT.PRIMARY }}
          >
            {t('common:buttons.cancel')}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};