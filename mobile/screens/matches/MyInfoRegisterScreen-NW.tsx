/**
 * 내 정보 등록 화면 - NativeWind 버전
 * 
 * 찾기 탭에서 "내 정보"를 간단히 등록/수정하는 화면
 * 복잡한 양식이 아닌 간단한 프로필 수정 형태
 */
import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Text,
  TextInput,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { IconWrapper as Icon } from '@/components/IconWrapper';
import { useAndroidSafeTranslation } from '@/hooks/useAndroidSafeTranslation';
import { ScreenHeader } from '@/components/common';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/slices/authSlice';
import { useInterestStore } from '@/store/slices/interestSlice';

interface ProfileField {
  id: string;
  label: string;
  value: string;
  icon: string;
  placeholder: string;
  editable: boolean;
}

export const MyInfoRegisterScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { t } = useAndroidSafeTranslation();
  const { user } = useAuthStore();
  const { updateMyInfo, getMyInfo } = useInterestStore();
  
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  
  // 프로필 필드 상태
  const [profileFields, setProfileFields] = useState<ProfileField[]>([
    {
      id: 'nickname',
      label: t('profile:nickname'),
      value: user?.nickname || '',
      icon: 'person-outline',
      placeholder: t('profile:nicknamePlaceholder'),
      editable: true,
    },
    {
      id: 'phone',
      label: t('profile:phone'),
      value: user?.phoneNumber || '',
      icon: 'call-outline',
      placeholder: t('profile:phonePlaceholder'),
      editable: false, // 전화번호는 수정 불가
    },
    {
      id: 'company',
      label: t('interest:types.company'),
      value: '',
      icon: 'business-outline',
      placeholder: t('interest:placeholders.company'),
      editable: true,
    },
    {
      id: 'school',
      label: t('interest:types.school'),
      value: '',
      icon: 'school-outline',
      placeholder: t('interest:placeholders.school'),
      editable: true,
    },
    {
      id: 'birthdate',
      label: t('profile:birthdate'),
      value: '',
      icon: 'calendar-outline',
      placeholder: 'YYYY-MM-DD',
      editable: true,
    },
    {
      id: 'bio',
      label: t('profile:bio'),
      value: user?.bio || '',
      icon: 'create-outline',
      placeholder: t('profile:bioPlaceholder'),
      editable: true,
    },
  ]);

  useEffect(() => {
    loadMyInfo();
  }, []);

  const loadMyInfo = async () => {
    setLoading(true);
    try {
      const myInfo = await getMyInfo();
      if (myInfo) {
        setProfileFields(prev => prev.map(field => ({
          ...field,
          value: myInfo[field.id] || field.value || '',
        })));
      }
    } catch (error) {
      console.error('Failed to load my info:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFieldChange = (id: string, value: string) => {
    setProfileFields(prev => prev.map(field => 
      field.id === id ? { ...field, value } : field
    ));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const updatedInfo = profileFields.reduce((acc, field) => ({
        ...acc,
        [field.id]: field.value,
      }), {});
      
      await updateMyInfo(updatedInfo);
      
      Alert.alert(
        t('common:success'),
        t('profile:updateSuccess'),
        [{ text: t('common:ok'), onPress: () => setIsEditing(false) }]
      );
    } catch (error) {
      Alert.alert(
        t('common:error'),
        t('profile:updateError'),
        [{ text: t('common:ok') }]
      );
    } finally {
      setSaving(false);
    }
  };

  const renderField = (field: ProfileField) => {
    const isEditingField = isEditing && field.editable;
    
    return (
      <View 
        key={field.id}
        className="bg-white dark:bg-gray-800 rounded-xl p-4 mb-3"
      >
        <View className="flex-row items-center mb-2">
          <Icon name={field.icon} size={20} color="#6B7280" />
          <Text className="ml-2 text-sm text-gray-600 dark:text-gray-400">
            {field.label}
          </Text>
        </View>
        
        {isEditingField ? (
          <TextInput
            className="text-base text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-1"
            value={field.value}
            onChangeText={(text) => handleFieldChange(field.id, text)}
            placeholder={field.placeholder}
            placeholderTextColor="#9CA3AF"
            editable={field.editable}
            multiline={field.id === 'bio'}
            numberOfLines={field.id === 'bio' ? 3 : 1}
          />
        ) : (
          <Text className={cn(
            "text-base",
            field.value 
              ? "text-gray-900 dark:text-white" 
              : "text-gray-400 dark:text-gray-500"
          )}>
            {field.value || field.placeholder}
          </Text>
        )}
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50 dark:bg-gray-900 items-center justify-center">
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text className="mt-4 text-gray-600 dark:text-gray-400">
          {t('common:loading')}
        </Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50 dark:bg-gray-900">
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        {/* 헤더 */}
        <ScreenHeader 
          title={t('interest:search.registerMyInfo')}
          rightButton={
            isEditing ? (
              <TouchableOpacity 
                onPress={() => setIsEditing(false)}
                className="px-4 py-2"
              >
                <Text className="text-gray-600 dark:text-gray-400">
                  {t('common:cancel')}
                </Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity 
                onPress={() => setIsEditing(true)}
                className="px-4 py-2"
              >
                <Text className="text-blue-500">
                  {t('common:edit')}
                </Text>
              </TouchableOpacity>
            )
          }
        />

        <ScrollView 
          className="px-4 pt-4"
          showsVerticalScrollIndicator={false}
        >
          {/* 안내 메시지 */}
          <View className="bg-blue-50 dark:bg-blue-900/30 rounded-xl p-4 mb-6">
            <View className="flex-row items-center mb-2">
              <Icon name="information-circle-outline" size={24} color="#3B82F6" />
              <Text className="ml-2 text-blue-900 dark:text-blue-200 font-semibold">
                {t('interest:info.title')}
              </Text>
            </View>
            <Text className="text-sm text-blue-800 dark:text-blue-300 leading-5">
              {t('interest:search.privacyInfo')}
            </Text>
          </View>

          {/* 프로필 필드들 */}
          {profileFields.map(renderField)}

          {/* 저장 버튼 (편집 모드일 때만) */}
          {isEditing && (
            <TouchableOpacity
              className={cn(
                "py-4 rounded-xl items-center mt-4 mb-8",
                "bg-blue-500 dark:bg-blue-600",
                saving && "opacity-60"
              )}
              onPress={handleSave}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text className="text-white text-base font-semibold">
                  {t('common:save')}
                </Text>
              )}
            </TouchableOpacity>
          )}

          {/* 프리미엄 안내 */}
          {!user?.isPremium && (
            <TouchableOpacity 
              className="bg-gradient-to-r from-purple-500 to-blue-500 rounded-xl p-4 mb-8 mt-4"
              onPress={() => navigation.navigate('Subscription')}
            >
              <View className="flex-row items-center justify-between">
                <View className="flex-1">
                  <Text className="text-white font-semibold mb-1">
                    {t('subscription:premiumBenefit')}
                  </Text>
                  <Text className="text-white/80 text-sm">
                    {t('interest:alerts.basicLimitMessage')}
                  </Text>
                </View>
                <Icon name="arrow-forward" size={20} color="white" />
              </View>
            </TouchableOpacity>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};