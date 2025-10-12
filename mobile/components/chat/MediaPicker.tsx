import React, { useState } from 'react';
import {
  View,
  TouchableOpacity,
  Alert,
  ActionSheetIOS,
  Platform,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import * as ImagePicker from 'expo-image-picker';
import { COLORS, SIZES } from '../../constants/theme';
import { useAndroidSafeTranslation } from '@/hooks/useAndroidSafeTranslation';

/**
 * MediaPicker 컴포넌트 Props
 * @interface MediaPickerProps
 */
interface MediaPickerProps {
  /** 미디어 선택 핸들러 */
  onMediaSelected: (assets: ImagePicker.ImagePickerAsset[]) => void;
  /** 비활성화 여부 */
  disabled?: boolean;
}

/**
 * 미디어 선택기 컴포넌트 - 사진/비디오 선택 및 촬영
 * @component
 * @param {MediaPickerProps} props - 컴포넌트 속성
 * @returns {JSX.Element} 미디어 선택기 UI
 * @description 카메라 촬영 또는 라이브러리에서 사진/비디오를 선택할 수 있는 컴포넌트
 */
export const MediaPicker= ({
  onMediaSelected,
  disabled = false,
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const { t } = useAndroidSafeTranslation(['chat', 'common']);

  /**
   * 카메라 권한 요청
   * @returns {Promise<boolean>} 권한 허용 여부
   */
  const requestCameraPermission = async (): Promise<boolean> => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    return status === 'granted';
  };

  /**
   * 사진 라이브러리 권한 요청
   * @returns {Promise<boolean>} 권한 허용 여부
   */
  const requestLibraryPermission = async (): Promise<boolean> => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    return status === 'granted';
  };

  /**
   * 카메라로 사진 촬영
   * @returns {Promise<void>}
   */
  const takePhoto = async () => {
    const hasPermission = await requestCameraPermission();
    if (!hasPermission) {
      Alert.alert(t('common:notifications.info'), t('chat:media.permissions.cameraRequired'));
      return;
    }

    setIsProcessing(true);
    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets.length > 0) {
        onMediaSelected(result.assets);
      }
    } catch (error) {
      console.error('Failed to take photo:', error);
      Alert.alert(t('common:alerts.error.title'), t('chat:media.errors.cameraFailed'));
    } finally {
      setIsProcessing(false);
    }
  };

  /**
   * 라이브러리에서 미디어 선택
   * @returns {Promise<void>}
   */
  const selectFromLibrary = async () => {
    const hasPermission = await requestLibraryPermission();
    if (!hasPermission) {
      Alert.alert(t('common:notifications.info'), t('chat:media.permissions.libraryRequired'));
      return;
    }

    setIsProcessing(true);
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images', 'videos'],
        allowsMultipleSelection: true,
        selectionLimit: 5,
        quality: 0.8,
        videoMaxDuration: 60, // 최대 60초
      });

      if (!result.canceled && result.assets.length > 0) {
        onMediaSelected(result.assets);
      }
    } catch (error) {
      console.error('Failed to select media:', error);
      Alert.alert(t('common:alerts.error.title'), t('chat:media.errors.selectionFailed'));
    } finally {
      setIsProcessing(false);
    }
  };

  /**
   * 미디어 선택 옵션 표시
   * @returns {void}
   * @description 플랫폼에 따라 적절한 UI로 옵션 표시
   */
  const showMediaOptions = () => {
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: [t('common:buttons.cancel'), t('chat:media.actions.takePhoto'), t('chat:media.actions.selectFromLibrary')],
          cancelButtonIndex: 0,
        },
        (buttonIndex) => {
          if (buttonIndex === 1) {
            takePhoto();
          } else if (buttonIndex === 2) {
            selectFromLibrary();
          }
        }
      );
    } else {
      Alert.alert(
        t('chat:media.title'),
        t('chat:media.description'),
        [
          { text: t('common:buttons.cancel'), style: 'cancel' },
          { text: t('chat:media.actions.takePhoto'), onPress: takePhoto },
          { text: t('chat:media.actions.selectFromLibrary'), onPress: selectFromLibrary },
        ],
        { cancelable: true }
      );
    }
  };

  return (
    <TouchableOpacity
      className="button"
      onPress={showMediaOptions}
      disabled={disabled || isProcessing}
    >
      <Ionicons
        name="attach"
        size={24}
        color={disabled ? COLORS.gray : COLORS.primary}
      />
    </TouchableOpacity>
  );
};

