import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
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
import { COLORS, SPACING, FONT_SIZES } from '@/utils/constants';

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
      <SafeAreaView style={[styles.container, { backgroundColor: colors.BACKGROUND }]}>
        {/* 헤더 */}
        <View style={[styles.header, { borderBottomColor: colors.BORDER }]}>
          <TouchableOpacity onPress={handleClose} style={styles.headerButton}>
            <Icon name="close" size={24} color={colors.TEXT.PRIMARY} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.TEXT.PRIMARY }]}>
            {t('addStory.title') || '스토리 추가'}
          </Text>
          <TouchableOpacity 
            onPress={handleUpload} 
            style={styles.headerButton}
            disabled={!selectedImage || isSubmitting}
          >
            {isSubmitting ? (
              <ActivityIndicator size="small" color={colors.PRIMARY} />
            ) : (
              <Text style={[
                styles.uploadButton,
                { color: selectedImage ? colors.PRIMARY : colors.TEXT.DISABLED }
              ]}>
                {t('addStory.upload') || '올리기'}
              </Text>
            )}
          </TouchableOpacity>
        </View>

        {/* 컨텐츠 */}
        <View style={styles.content}>
          {selectedImage ? (
            // 선택된 이미지 표시
            <View style={styles.previewContainer}>
              <Image source={{ uri: selectedImage }} style={styles.previewImage} />
              <TouchableOpacity 
                style={[styles.changeButton, { backgroundColor: colors.SURFACE }]}
                onPress={() => setSelectedImage(null)}
              >
                <Icon name="close-circle" size={24} color={colors.TEXT.PRIMARY} />
              </TouchableOpacity>
            </View>
          ) : (
            // 이미지 선택 옵션
            <View style={styles.optionsContainer}>
              <TouchableOpacity 
                style={[styles.optionButton, { backgroundColor: colors.PRIMARY }]}
                onPress={handleSelectImage}
              >
                <Icon name="images" size={32} color={COLORS.WHITE} />
                <Text style={styles.optionText}>
                  {t('addStory.selectPhoto') || '갤러리에서 선택'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.optionButton, { backgroundColor: colors.SECONDARY || colors.PRIMARY }]}
                onPress={handleTakePhoto}
              >
                <Icon name="camera" size={32} color={COLORS.WHITE} />
                <Text style={styles.optionText}>
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.MD,
    paddingVertical: SPACING.SM,
    borderBottomWidth: 1,
  },
  headerButton: {
    padding: SPACING.XS,
  },
  headerTitle: {
    fontSize: FONT_SIZES.LG,
    fontWeight: '600',
  },
  uploadButton: {
    fontSize: FONT_SIZES.MD,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    padding: SPACING.MD,
  },
  optionsContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: SPACING.XL,
  },
  optionButton: {
    width: 200,
    height: 200,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    gap: SPACING.MD,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 4,
      },
      web: {
        boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.1)',
      },
    }),
  },
  optionText: {
    color: COLORS.WHITE,
    fontSize: FONT_SIZES.MD,
    fontWeight: '600',
  },
  previewContainer: {
    flex: 1,
    position: 'relative',
  },
  previewImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'contain',
    borderRadius: 10,
  },
  changeButton: {
    position: 'absolute',
    top: SPACING.MD,
    right: SPACING.MD,
    borderRadius: 20,
    padding: SPACING.XS,
  },
});