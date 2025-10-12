/**
 * 스토리 생성 화면 (NativeWind v4 버전)
 *
 * @screen
 * @description 사용자가 24시간 동안 표시될 이미지 기반 스토리를 생성하는 프리미엄 기능 화면
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  SafeAreaView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  ScrollView,
  Image,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAndroidSafeTranslation } from '@/hooks/useAndroidSafeTranslation';
import * as ImagePicker from 'expo-image-picker';
import { useAuthStore } from '@/store/slices/authSlice';
import Icon from 'react-native-vector-icons/Ionicons';
import { saveStory } from '@/utils/storyData';
import { useTheme } from '@/hooks/useTheme';
import { apiClient } from '@/services/api/config';
import { cn } from '@/lib/utils';
import { ApiResponse } from '@/types';

/**
 * 스토리 생성 컴포넌트
 *
 * @component
 * @returns {JSX.Element} 이미지 선택 및 업로드 UI
 *
 * @description
 * 사용자가 이미지를 선택하여 24시간 동안 표시되는 스토리를 생성하는 화면입니다.
 * - expo-image-picker를 통한 갤러리 이미지 선택
 * - 미디어 라이브러리 권한 요청 및 처리
 * - 9:16 세로 비율 스토리 이미지 (Instagram 스타일)
 * - 이미지 품질 최적화 (0.8 quality)
 * - 선택 후 이미지 미리보기 및 변경 기능
 * - 스토리 작성 가이드라인 표시
 * - 서버 API 연동 및 로컬 저장소 백업
 * - 업로드 중 로딩 상태 표시
 *
 * @navigation
 * - From: HomeScreen (스토리 추가 버튼), ProfileScreen (내 스토리 관리)
 * - To: HomeTab (업로드 완료 후 자동 이동)
 *
 * @example
 * ```tsx
 * // 홈 화면에서 스토리 추가
 * navigation.navigate('CreateStory');
 *
 * // 프로필에서 스토리 재생성
 * navigation.navigate('CreateStory');
 * ```
 *
 * @category Screen
 * @subcategory Premium
 */
export const CreateStoryScreen = () => {
  const { t } = useAndroidSafeTranslation('story');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const navigation = useNavigation();
  const authStore = useAuthStore();
  const { colors } = useTheme();

  const handleImagePicker = async () => {
    try {
      console.log('[CreateStoryScreen] 이미지 선택 시작');
      
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      console.log('[CreateStoryScreen] 권한 상태:', status);
      
      if (status !== 'granted') {
        Alert.alert(t('permissions.required'), t('permissions.mediaLibrary'));
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: false, // 스토리는 하나의 이미지만
        quality: 0.8,
        aspect: [9, 16], // 스토리는 세로 비율
      });

      console.log('[CreateStoryScreen] 이미지 선택 결과:', {
        canceled: result.canceled,
        asset: result.assets?.[0] ? {
          uri: result.assets[0].uri,
          width: result.assets[0].width,
          height: result.assets[0].height
        } : null
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        setSelectedImage(result.assets[0].uri);
        console.log('[CreateStoryScreen] 스토리 이미지 설정:', result.assets[0].uri);
      }
    } catch (error) {
      console.error('[CreateStoryScreen] 이미지 선택 에러:', error);
      Alert.alert(t('create.imageError.title'), t('create.imageError.message'));
    }
  };

  const handleSubmit = async () => {
    if (!selectedImage) {
      Alert.alert(t('create.photoRequired.title'), t('create.photoRequired.message'));
      return;
    }

    setIsSubmitting(true);
    try {
      console.log('[CreateStoryScreen] 스토리 생성 시도:', {
        imageUri: selectedImage,
        userId: authStore.user?.id,
      });

      // 사용자 정보 가져오기
      let userNickname = authStore.user?.nickname;
      let userId = authStore.user?.id;
      
      if (!userNickname || !userId) {
        try {
          console.log('[CreateStoryScreen] 서버에서 사용자 정보 가져오기');
          const userData = await apiClient.get<ApiResponse<any>>('/users/profile');

          if (userData.success && userData.data) {
              userNickname = userData.data.nickname || '테스트유저';
              userId = userData.data.id || 'current_user';

              // authStore 업데이트
              authStore.setUser({
                ...authStore.user,
                id: userId,
                nickname: userNickname,
                ...userData.data
              });
            }
        } catch (error) {
          console.warn('[CreateStoryScreen] 서버 사용자 정보 가져오기 실패:', error);
          userNickname = '테스트유저';
          userId = 'current_user';
        }
      }

      // 스토리 저장
      const savedStory = await saveStory({
        userId: userId,
        authorNickname: userNickname,
        imageUri: selectedImage,
      });
      
      console.log('[CreateStoryScreen] 스토리 생성 완료:', savedStory);
      
      // 성공 시 홈화면으로 이동
      navigation.navigate('HomeTab' as never);
      
      Alert.alert(t('create.uploadSuccess.title'), t('create.uploadSuccess.message'));
    } catch (error: any) {
      console.error('[CreateStoryScreen] 스토리 생성 실패:', error);
      Alert.alert(t('create.uploadError.title'), t('create.uploadError.message'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView className={cn('flex-1 bg-gray-50 dark:bg-gray-950')}>
      <View className={cn(
        "flex-row justify-between items-center px-4 py-3 border-b",
        "bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800"
      )}>
        <TouchableOpacity
          className="px-4 py-2"
          onPress={() => navigation.goBack()}
        >
          <Icon name="close" size={24} color={colors.TEXT.SECONDARY} />
        </TouchableOpacity>
        <Text className={cn(
          "text-lg font-bold",
          "text-gray-900 dark:text-white"
        )}>{t('create.title')}</Text>
        <TouchableOpacity
          className={cn(
            "px-4 py-2 rounded-lg",
            selectedImage ? "bg-primary-500" : "bg-gray-300",
            !selectedImage && "opacity-50"
          )}
          onPress={handleSubmit}
          disabled={isSubmitting || !selectedImage}
        >
          {isSubmitting ? (
            <ActivityIndicator size="small" color="white" />
          ) : (
            <Text className="text-white font-semibold">{t('create.share')}</Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView className={cn("flex-1 p-4 bg-gray-50 dark:bg-gray-950")}>
        {selectedImage ? (
          <View className="items-center mb-5">
            <Image source={{ uri: selectedImage }} className="w-[200px] h-[356px] rounded-2xl" />
            <TouchableOpacity
              className="flex-row items-center px-4 py-2 rounded-full bg-black/50 mt-4"
              onPress={handleImagePicker}
            >
              <Icon name="camera" size={20} color="white" />
              <Text className="text-white font-semibold ml-2">{t('create.changePhoto')}</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View className={cn(
            "flex-1 justify-center items-center min-h-[400px] rounded-2xl",
            "bg-white dark:bg-gray-900"
          )}>
            <TouchableOpacity
              className="items-center justify-center rounded-2xl p-16"
              onPress={handleImagePicker}
            >
              <Icon name="camera" size={48} color={colors.PRIMARY} />
              <Text className={cn(
                "text-lg font-semibold mt-4",
                "text-gray-900 dark:text-white"
              )}>{t('create.addPhoto')}</Text>
              <Text className={cn(
                "text-base text-center mt-2",
                "text-gray-600 dark:text-gray-400"
              )}>
                {t('create.addPhotoSubtext')}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        <View className={cn(
          "p-4 rounded-xl border mt-5",
          "bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800"
        )}>
          <Text className={cn(
            "text-base font-semibold mb-2",
            "text-gray-900 dark:text-white"
          )}>{t('create.guidelines.title')}</Text>
          <Text className={cn(
            "text-sm leading-5",
            "text-gray-600 dark:text-gray-400"
          )}>
            {t('create.guidelines.text')}
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};