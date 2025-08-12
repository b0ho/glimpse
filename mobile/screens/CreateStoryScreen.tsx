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
import { useTranslation } from 'react-i18next';
import * as ImagePicker from 'expo-image-picker';
import { useAuthStore } from '@/store/slices/authSlice';
import { COLORS, SPACING, FONT_SIZES } from '@/utils/constants';
import Icon from 'react-native-vector-icons/Ionicons';
import { saveStory } from '@/utils/storyData';

export const CreateStoryScreen = () => {
  const { t } = useTranslation(['common', 'story']);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const navigation = useNavigation();
  const authStore = useAuthStore();

  const handleImagePicker = async () => {
    try {
      console.log('[CreateStoryScreen] 이미지 선택 시작');
      
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      console.log('[CreateStoryScreen] 권한 상태:', status);
      
      if (status !== 'granted') {
        Alert.alert('권한 필요', '갤러리 접근 권한이 필요합니다.');
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
      Alert.alert('오류', '이미지 선택 중 오류가 발생했습니다.');
    }
  };

  const handleSubmit = async () => {
    if (!selectedImage) {
      Alert.alert('사진 필요', '스토리에 올릴 사진을 선택해주세요.');
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
      
      Alert.alert('스토리 업로드 완료', '스토리가 성공적으로 업로드되었습니다!');
    } catch (error: any) {
      console.error('[CreateStoryScreen] 스토리 생성 실패:', error);
      Alert.alert('오류', '스토리 업로드에 실패했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.headerButton}
          onPress={() => navigation.goBack()}
        >
          <Icon name="close" size={24} color={COLORS.TEXT.SECONDARY} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>스토리 만들기</Text>
        <TouchableOpacity
          style={[
            styles.headerButton,
            styles.submitButton,
            !selectedImage && styles.submitButtonDisabled,
          ]}
          onPress={handleSubmit}
          disabled={isSubmitting || !selectedImage}
        >
          {isSubmitting ? (
            <ActivityIndicator size="small" color={COLORS.TEXT.WHITE} />
          ) : (
            <Text style={styles.submitButtonText}>공유</Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {selectedImage ? (
          <View style={styles.imagePreviewContainer}>
            <Image source={{ uri: selectedImage }} style={styles.storyPreview} />
            <TouchableOpacity
              style={styles.changeImageButton}
              onPress={handleImagePicker}
            >
              <Icon name="camera" size={20} color={COLORS.TEXT.WHITE} />
              <Text style={styles.changeImageText}>사진 바꾸기</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.emptyState}>
            <TouchableOpacity
              style={styles.addPhotoButton}
              onPress={handleImagePicker}
            >
              <Icon name="camera" size={48} color={COLORS.PRIMARY} />
              <Text style={styles.addPhotoText}>사진 추가</Text>
              <Text style={styles.addPhotoSubtext}>
                스토리에 공유할 사진을 선택해주세요
              </Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.guidelines}>
          <Text style={styles.guidelinesTitle}>📖 스토리 가이드라인</Text>
          <Text style={styles.guidelinesText}>
            • 스토리는 24시간 후 자동으로 사라집니다{'\n'}
            • 본인만의 순간을 자연스럽게 공유해보세요{'\n'}
            • 부적절한 내용은 신고될 수 있습니다{'\n'}
            • 타인의 프라이버시를 존중해주세요
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.BACKGROUND,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.MD,
    paddingVertical: SPACING.SM,
    backgroundColor: COLORS.SURFACE,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.BORDER,
  },
  headerButton: {
    paddingHorizontal: SPACING.MD,
    paddingVertical: SPACING.SM,
  },
  headerTitle: {
    fontSize: FONT_SIZES.LG,
    fontWeight: 'bold',
    color: COLORS.TEXT.PRIMARY,
  },
  submitButton: {
    backgroundColor: COLORS.PRIMARY,
    borderRadius: 8,
  },
  submitButtonDisabled: {
    backgroundColor: COLORS.TEXT.LIGHT,
  },
  submitButtonText: {
    color: COLORS.TEXT.WHITE,
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
    backgroundColor: COLORS.SURFACE,
    borderRadius: 20,
    padding: SPACING.XL * 2,
    borderWidth: 2,
    borderColor: COLORS.PRIMARY,
    borderStyle: 'dashed',
  },
  addPhotoText: {
    fontSize: FONT_SIZES.LG,
    fontWeight: '600',
    color: COLORS.TEXT.PRIMARY,
    marginTop: SPACING.MD,
  },
  addPhotoSubtext: {
    fontSize: FONT_SIZES.MD,
    color: COLORS.TEXT.SECONDARY,
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
    backgroundColor: COLORS.SURFACE,
  },
  changeImageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.PRIMARY,
    paddingHorizontal: SPACING.MD,
    paddingVertical: SPACING.SM,
    borderRadius: 20,
    marginTop: SPACING.MD,
  },
  changeImageText: {
    color: COLORS.TEXT.WHITE,
    fontWeight: '600',
    marginLeft: SPACING.SM,
  },
  guidelines: {
    backgroundColor: COLORS.SURFACE,
    padding: SPACING.MD,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.BORDER,
    marginTop: SPACING.LG,
  },
  guidelinesTitle: {
    fontSize: FONT_SIZES.MD,
    fontWeight: '600',
    color: COLORS.TEXT.PRIMARY,
    marginBottom: SPACING.SM,
  },
  guidelinesText: {
    fontSize: FONT_SIZES.SM,
    color: COLORS.TEXT.SECONDARY,
    lineHeight: 20,
  },
});