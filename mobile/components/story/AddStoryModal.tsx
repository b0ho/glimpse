import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { IconWrapper as Icon } from '@/components/IconWrapper';
import { useTheme } from '@/hooks/useTheme';
import { useAndroidSafeTranslation } from '@/hooks/useAndroidSafeTranslation';
import * as ImagePicker from 'expo-image-picker';
import { cn } from '@/lib/utils';

interface AddStoryModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (imageUri: string, caption?: string) => Promise<void>;
}

/**
 * 스토리 추가 모달 컴포넌트
 */
export const AddStoryModal: React.FC<AddStoryModalProps> = ({
  visible,
  onClose,
  onSubmit,
}) => {
  const { colors } = useTheme();
  const { t } = useAndroidSafeTranslation('story');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [caption, setCaption] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  /**
   * 이미지 선택 핸들러
   */
  const handleSelectImage = async () => {
    // 권한 요청
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (!permissionResult.granted) {
      Alert.alert(
        t('addStory.permissions.title'),
        t('addStory.permissions.message')
      );
      return;
    }

    // 이미지 선택
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [9, 16], // 스토리 비율
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setSelectedImage(result.assets[0].uri);
    }
  };

  /**
   * 카메라 촬영 핸들러
   */
  const handleTakePhoto = async () => {
    // 권한 요청
    const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
    
    if (!permissionResult.granted) {
      Alert.alert(
        t('addStory.permissions.cameraTitle'),
        t('addStory.permissions.cameraMessage')
      );
      return;
    }

    // 카메라 열기
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [9, 16], // 스토리 비율
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setSelectedImage(result.assets[0].uri);
    }
  };

  /**
   * 스토리 업로드 핸들러
   */
  const handleUpload = async () => {
    if (!selectedImage) {
      Alert.alert(
        t('addStory.errors.noImage.title'),
        t('addStory.errors.noImage.message')
      );
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit(selectedImage, caption);
      
      // 성공 후 초기화
      setSelectedImage(null);
      setCaption('');
      onClose();
      
      Alert.alert(
        t('addStory.success.title'),
        t('addStory.success.message')
      );
    } catch (error) {
      Alert.alert(
        t('addStory.errors.upload.title'),
        t('addStory.errors.upload.message')
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * 모달 닫기 핸들러
   */
  const handleClose = () => {
    if (selectedImage) {
      Alert.alert(
        t('addStory.confirm.title'),
        t('addStory.confirm.message'),
        [
          { text: t('addStory.confirm.cancel'), style: 'cancel' },
          { 
            text: t('addStory.confirm.confirm'),
            onPress: () => {
              setSelectedImage(null);
              setCaption('');
              onClose();
            }
          }
        ]
      );
    } else {
      onClose();
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={handleClose}
    >
      <SafeAreaView className="flex-1 bg-white dark:bg-black">
        {/* 헤더 */}
        <View className="flex-row items-center justify-between px-4 py-2 border-b border-gray-200 dark:border-gray-700">
          <TouchableOpacity onPress={handleClose} className="p-1">
            <Icon name="close" size={24} color={colors.TEXT.PRIMARY} />
          </TouchableOpacity>
          <Text className="text-lg font-semibold text-gray-900 dark:text-white">
            {t('addStory.title') || '스토리 추가'}
          </Text>
          <TouchableOpacity 
            onPress={handleUpload} 
            className="p-1"
            disabled={!selectedImage || isSubmitting}
          >
            {isSubmitting ? (
              <ActivityIndicator size="small" color={colors.PRIMARY} />
            ) : (
              <Text className={cn(
                "text-base font-semibold",
                selectedImage ? "text-blue-500" : "text-gray-400"
              )}>
                {t('addStory.upload') || '올리기'}
              </Text>
            )}
          </TouchableOpacity>
        </View>

        {/* 컨텐츠 */}
        <View className="flex-1 p-4">
          {selectedImage ? (
            // 선택된 이미지 표시
            <View className="flex-1 relative">
              <Image 
                source={{ uri: selectedImage }} 
                className="w-full h-full rounded-lg"
                resizeMode="contain"
              />
              <TouchableOpacity 
                className={cn(
                  "absolute top-4 right-4 p-1 rounded-full",
                  "bg-white dark:bg-gray-800"
                )}
                onPress={() => setSelectedImage(null)}
              >
                <Icon name="close-circle" size={24} color={colors.TEXT.PRIMARY} />
              </TouchableOpacity>
            </View>
          ) : (
            // 이미지 선택 옵션
            <View className="flex-1 justify-center items-center gap-8">
              <TouchableOpacity 
                className={cn(
                  "w-48 h-48 rounded-xl justify-center items-center gap-4",
                  "bg-blue-500 shadow-lg",
                  Platform.select({
                    ios: "shadow-sm",
                    android: "elevation-4",
                    web: "shadow-md"
                  })
                )}
                onPress={handleSelectImage}
              >
                <Icon name="images" size={32} color="#FFFFFF" />
                <Text className="text-white text-base font-semibold">
                  {t('addStory.selectPhoto') || '갤러리에서 선택'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity 
                className={cn(
                  "w-48 h-48 rounded-xl justify-center items-center gap-4",
                  "bg-green-500 shadow-lg",
                  Platform.select({
                    ios: "shadow-sm", 
                    android: "elevation-4",
                    web: "shadow-md"
                  })
                )}
                onPress={handleTakePhoto}
              >
                <Icon name="camera" size={32} color="#FFFFFF" />
                <Text className="text-white text-base font-semibold">
                  {t('addStory.takePhoto') || '사진 촬영'}
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </SafeAreaView>
    </Modal>
  );
};