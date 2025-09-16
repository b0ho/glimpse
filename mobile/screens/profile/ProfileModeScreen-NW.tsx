import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  Alert,
  TextInput,
  Image,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useAuthStore } from '@/store/slices/authSlice';
import { apiClient } from '@/services/api/config';
import { useAndroidSafeTranslation } from '@/hooks/useAndroidSafeTranslation';

interface PersonaProfile {
  nickname?: string;
  age?: number;
  bio?: string;
  profileImage?: string;
}

export const ProfileModeScreen = React.memo(() => {
  const navigation = useNavigation();
  const { user, updateUser } = useAuthStore();
  const { t } = useAndroidSafeTranslation();
  
  const [profileMode, setProfileMode] = useState<'real' | 'persona'>('real');
  const [personaProfile, setPersonaProfile] = useState<PersonaProfile>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    loadProfileMode();
  }, []);

  const loadProfileMode = async () => {
    if (!user) return;

    try {
      setIsLoading(true);
      const data = await apiClient.get('/location/profile-mode');
      
      setProfileMode(data.mode || 'real');
      if (data.personaProfile) {
        setPersonaProfile(data.personaProfile);
      }
    } catch (error) {
      console.error('Load profile mode error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleModeChange = async (mode: 'real' | 'persona') => {
    if (mode === 'persona' && !personaProfile.nickname) {
      setIsEditing(true);
      setProfileMode(mode);
      return;
    }

    try {
      setIsLoading(true);
      await apiClient.post('/location/profile-mode', {
        mode,
        personaData: mode === 'persona' ? personaProfile : undefined,
      });
      
      setProfileMode(mode);
      Alert.alert(
        t('profilemode:alerts.modeChanged'),
        mode === 'real' 
          ? t('profilemode:alerts.realModeMessage')
          : t('profilemode:alerts.personaModeMessage')
      );
    } catch (error) {
      console.error('Change profile mode error:', error);
      Alert.alert(t('profilemode:alerts.error'), t('profilemode:alerts.modeChangeError'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleSavePersona = async () => {
    if (!personaProfile.nickname) {
      Alert.alert(t('profilemode:alerts.enterNickname'), t('profilemode:alerts.enterNickname'));
      return;
    }

    try {
      setIsLoading(true);
      await apiClient.post('/location/profile-mode', {
        mode: 'persona',
        personaData: personaProfile,
      });
      
      setIsEditing(false);
      Alert.alert(t('profilemode:alerts.success'), t('profilemode:alerts.personaSaved'));
    } catch (error) {
      console.error('Save persona error:', error);
      Alert.alert(t('profilemode:alerts.error'), t('profilemode:alerts.personaSaveError'));
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading && !personaProfile.nickname) {
    return (
      <SafeAreaView className="flex-1 bg-white dark:bg-gray-900">
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" className="text-blue-500" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-gray-900">
      <View className="flex-row items-center justify-between px-4 py-3 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <TouchableOpacity
          className="p-2"
          onPress={() => navigation.goBack()}
        >
          <Icon name="arrow-back" size={24} className="text-gray-900 dark:text-white" />
        </TouchableOpacity>
        <Text className="text-gray-900 dark:text-white text-lg font-semibold">{t('profilemode:title')}</Text>
        <View className="w-10" />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        <View className="p-4">
          {/* 모드 선택 섹션 */}
          <View className="mb-6">
            <Text className="text-gray-900 dark:text-white text-lg font-semibold mb-2">
              {t('profilemode:profileDisplayMode')}
            </Text>
            <Text className="text-gray-600 dark:text-gray-400 text-sm mb-4">
              {t('profilemode:selectProfileDescription')}
            </Text>

            <TouchableOpacity
              className={`bg-white dark:bg-gray-800 rounded-xl p-4 mb-4 border-2 relative ${
                profileMode === 'real' 
                  ? 'border-blue-500 dark:border-blue-400' 
                  : 'border-gray-200 dark:border-gray-700'
              }`}
              onPress={() => handleModeChange('real')}
              disabled={isLoading}
            >
              <View className="flex-row items-center">
                <Icon 
                  name="person-circle" 
                  size={48} 
                  className={`${
                    profileMode === 'real' 
                      ? 'text-blue-500 dark:text-blue-400' 
                      : 'text-gray-600 dark:text-gray-400'
                  }`}
                />
                <View className="flex-1 ml-4">
                  <Text className="text-gray-900 dark:text-white text-base font-semibold mb-1">
                    {t('profilemode:realProfile.title')}
                  </Text>
                  <Text className="text-gray-600 dark:text-gray-400 text-sm">
                    {t('profilemode:realProfile.description')}
                  </Text>
                </View>
              </View>
              {profileMode === 'real' && (
                <View className="absolute top-3 right-3 w-6 h-6 bg-blue-500 dark:bg-blue-600 rounded-full items-center justify-center">
                  <Icon name="checkmark" size={16} className="text-white" />
                </View>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              className={`bg-white dark:bg-gray-800 rounded-xl p-4 mb-4 border-2 relative ${
                profileMode === 'persona' 
                  ? 'border-blue-500 dark:border-blue-400' 
                  : 'border-gray-200 dark:border-gray-700'
              }`}
              onPress={() => handleModeChange('persona')}
              disabled={isLoading}
            >
              <View className="flex-row items-center">
                <Icon 
                  name="mask" 
                  size={48} 
                  className={`${
                    profileMode === 'persona' 
                      ? 'text-blue-500 dark:text-blue-400' 
                      : 'text-gray-600 dark:text-gray-400'
                  }`}
                />
                <View className="flex-1 ml-4">
                  <Text className="text-gray-900 dark:text-white text-base font-semibold mb-1">
                    {t('profilemode:personaProfile.title')}
                  </Text>
                  <Text className="text-gray-600 dark:text-gray-400 text-sm">
                    {t('profilemode:personaProfile.description')}
                  </Text>
                </View>
              </View>
              {profileMode === 'persona' && (
                <View className="absolute top-3 right-3 w-6 h-6 bg-blue-500 dark:bg-blue-600 rounded-full items-center justify-center">
                  <Icon name="checkmark" size={16} className="text-white" />
                </View>
              )}
            </TouchableOpacity>
          </View>

          {/* 페르소나 프로필 편집 섹션 */}
          {profileMode === 'persona' && (
            <View className="mb-6">
              <View className="flex-row items-center justify-between mb-3">
                <Text className="text-gray-900 dark:text-white text-lg font-semibold">
                  {t('profilemode:personaProfile.title')}
                </Text>
                {!isEditing && (
                  <TouchableOpacity
                    onPress={() => setIsEditing(true)}
                    className="flex-row items-center bg-blue-500 dark:bg-blue-600 px-3 py-1.5 rounded-lg"
                  >
                    <Icon name="pencil" size={16} className="text-white mr-1" />
                    <Text className="text-white text-sm font-semibold">
                      {t('profilemode:buttons.edit')}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>

              <View className="bg-white dark:bg-gray-800 rounded-xl p-4 items-center">
                {isEditing ? (
                  <>
                    <View className="w-full mb-4">
                      <Text className="text-gray-600 dark:text-gray-400 text-sm mb-2">
                        {t('profilemode:labels.nickname')}
                      </Text>
                      <TextInput
                        className="bg-white dark:bg-gray-900 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2.5 text-base"
                        value={personaProfile.nickname}
                        onChangeText={(text) => setPersonaProfile({ ...personaProfile, nickname: text })}
                        placeholder={t('profilemode:placeholders.nickname')}
                        placeholderTextColor="#9CA3AF"
                      />
                    </View>

                    <View className="w-full mb-4">
                      <Text className="text-gray-600 dark:text-gray-400 text-sm mb-2">
                        {t('profilemode:labels.age')}
                      </Text>
                      <TextInput
                        className="bg-white dark:bg-gray-900 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2.5 text-base"
                        value={personaProfile.age?.toString()}
                        onChangeText={(text) => setPersonaProfile({ ...personaProfile, age: parseInt(text) || undefined })}
                        placeholder={t('profilemode:placeholders.age')}
                        placeholderTextColor="#9CA3AF"
                        keyboardType="numeric"
                      />
                    </View>

                    <View className="w-full mb-4">
                      <Text className="text-gray-600 dark:text-gray-400 text-sm mb-2">
                        {t('profilemode:labels.bio')}
                      </Text>
                      <TextInput
                        className="bg-white dark:bg-gray-900 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2.5 text-base min-h-20 text-start"
                        value={personaProfile.bio}
                        onChangeText={(text) => setPersonaProfile({ ...personaProfile, bio: text })}
                        placeholder={t('profilemode:placeholders.bio')}
                        placeholderTextColor="#9CA3AF"
                        multiline
                        numberOfLines={3}
                      />
                    </View>

                    <View className="flex-row mt-4">
                      <TouchableOpacity
                        className="flex-1 border border-gray-200 dark:border-gray-700 rounded-lg py-4 items-center mr-2"
                        onPress={() => {
                          setIsEditing(false);
                          loadProfileMode();
                        }}
                      >
                        <Text className="text-gray-600 dark:text-gray-400 text-base font-semibold">
                          {t('profilemode:buttons.cancel')}
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        className="flex-1 bg-blue-500 dark:bg-blue-600 rounded-lg py-4 items-center ml-2"
                        onPress={handleSavePersona}
                        disabled={isLoading}
                      >
                        {isLoading ? (
                          <ActivityIndicator size="small" color="white" />
                        ) : (
                          <Text className="text-white text-base font-semibold">
                            {t('profilemode:buttons.save')}
                          </Text>
                        )}
                      </TouchableOpacity>
                    </View>
                  </>
                ) : (
                  <>
                    <View className="w-20 h-20 bg-blue-500 dark:bg-blue-600 rounded-full items-center justify-center mb-4">
                      <Icon name="mask" size={32} className="text-white" />
                    </View>
                    <Text className="text-gray-900 dark:text-white text-lg font-semibold mb-2">
                      {personaProfile.nickname || t('profilemode:personaProfile.notSet')}
                    </Text>
                    {personaProfile.age && (
                      <Text className="text-gray-600 dark:text-gray-400 text-base mb-3">
                        {t('profilemode:age', { age: personaProfile.age })}
                      </Text>
                    )}
                    {personaProfile.bio && (
                      <Text className="text-gray-600 dark:text-gray-400 text-sm text-center leading-5">
                        {personaProfile.bio}
                      </Text>
                    )}
                  </>
                )}
              </View>
            </View>
          )}

          {/* 안내 섹션 */}
          <View className="flex-row bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 mt-4">
            <Icon name="information-circle" size={20} className="text-blue-500 dark:text-blue-400 mr-3 mt-0.5" />
            <Text className="text-gray-600 dark:text-gray-400 text-sm flex-1 leading-5">
              {t('profilemode:info.description')}
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
});