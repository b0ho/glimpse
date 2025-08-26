import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
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
import { COLORS, SPACING, FONT_SIZES } from '@/utils/constants';
import Icon from 'react-native-vector-icons/Ionicons';
import { saveStory } from '@/utils/storyData';
import { useTheme } from '@/hooks/useTheme';

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
          const userResponse = await fetch('http://localhost:3002/api/v1/users/profile', {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              'x-dev-auth': 'true',
            },
          });
          
          if (userResponse.ok) {
            const userData = await userResponse.json();
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
    <SafeAreaView style={[styles.container, { backgroundColor: colors.BACKGROUND }]}>
      <View style={[styles.header, { backgroundColor: colors.SURFACE, borderBottomColor: colors.BORDER }]}>
        <TouchableOpacity
          style={styles.headerButton}
          onPress={() => navigation.goBack()}
        >
          <Icon name="close" size={24} color={colors.TEXT.SECONDARY} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.TEXT.PRIMARY }]}>{t('create.title')}</Text>
        <TouchableOpacity
          style={[
            styles.headerButton,
            styles.submitButton,
            { backgroundColor: selectedImage ? colors.PRIMARY : colors.TEXT.LIGHT },
            !selectedImage && styles.submitButtonDisabled,
          ]}
          onPress={handleSubmit}
          disabled={isSubmitting || !selectedImage}
        >
          {isSubmitting ? (
            <ActivityIndicator size="small" color={colors.TEXT.WHITE} />
          ) : (
            <Text style={[styles.submitButtonText, { color: colors.TEXT.WHITE }]}>{t('create.share')}</Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView style={[styles.content, { backgroundColor: colors.BACKGROUND }]}>
        {selectedImage ? (
          <View style={styles.imagePreviewContainer}>
            <Image source={{ uri: selectedImage }} style={styles.storyPreview} />
            <TouchableOpacity
              style={[styles.changeImageButton, { backgroundColor: colors.OVERLAY }]}
              onPress={handleImagePicker}
            >
              <Icon name="camera" size={20} color={colors.TEXT.WHITE} />
              <Text style={[styles.changeImageText, { color: colors.TEXT.WHITE }]}>{t('create.changePhoto')}</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={[styles.emptyState, { backgroundColor: colors.SURFACE }]}>
            <TouchableOpacity
              style={styles.addPhotoButton}
              onPress={handleImagePicker}
            >
              <Icon name="camera" size={48} color={colors.PRIMARY} />
              <Text style={[styles.addPhotoText, { color: colors.TEXT.PRIMARY }]}>{t('create.addPhoto')}</Text>
              <Text style={[styles.addPhotoSubtext, { color: colors.TEXT.SECONDARY }]}>
                {t('create.addPhotoSubtext')}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={[styles.guidelines, { backgroundColor: colors.SURFACE }]}>
          <Text style={[styles.guidelinesTitle, { color: colors.TEXT.PRIMARY }]}>{t('create.guidelines.title')}</Text>
          <Text style={[styles.guidelinesText, { color: colors.TEXT.SECONDARY }]}>
            {t('create.guidelines.text')}
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.MD,
    paddingVertical: SPACING.SM,
    borderBottomWidth: 1,
  },
  headerButton: {
    paddingHorizontal: SPACING.MD,
    paddingVertical: SPACING.SM,
  },
  headerTitle: {
    fontSize: FONT_SIZES.LG,
    fontWeight: 'bold',
  },
  submitButton: {
    borderRadius: 8,
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitButtonText: {
    fontWeight: '600',
  },
  content: {
    flex: 1,
    padding: SPACING.MD,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 400,
  },
  addPhotoButton: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
    padding: SPACING.XL * 2,
  },
  addPhotoText: {
    fontSize: FONT_SIZES.LG,
    fontWeight: '600',
    marginTop: SPACING.MD,
  },
  addPhotoSubtext: {
    fontSize: FONT_SIZES.MD,
    textAlign: 'center',
    marginTop: SPACING.SM,
  },
  imagePreviewContainer: {
    position: 'relative',
    alignItems: 'center',
    marginBottom: SPACING.LG,
  },
  storyPreview: {
    width: 200,
    height: 356, // 9:16 비율
    borderRadius: 16,
      },
  changeImageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.MD,
    paddingVertical: SPACING.SM,
    borderRadius: 20,
    marginTop: SPACING.MD,
  },
  changeImageText: {
    fontWeight: '600',
    marginLeft: SPACING.SM,
  },
  guidelines: {
        padding: SPACING.MD,
    borderRadius: 12,
    borderWidth: 1,
    marginTop: SPACING.LG,
  },
  guidelinesTitle: {
    fontSize: FONT_SIZES.MD,
    fontWeight: '600',
    marginBottom: SPACING.SM,
  },
  guidelinesText: {
    fontSize: FONT_SIZES.SM,
    lineHeight: 20,
  },
});