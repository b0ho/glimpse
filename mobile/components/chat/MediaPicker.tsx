import React, { useState } from 'react';
import {
  View,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActionSheetIOS,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { COLORS, SIZES } from '../../constants/theme';

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
export const MediaPicker: React.FC<MediaPickerProps> = ({
  onMediaSelected,
  disabled = false,
}) => {
  const [isProcessing, setIsProcessing] = useState(false);

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
      Alert.alert('알림', '카메라 권한이 필요합니다.');
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
      Alert.alert('오류', '사진 촬영에 실패했습니다.');
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
      Alert.alert('알림', '사진 라이브러리 권한이 필요합니다.');
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
      Alert.alert('오류', '미디어 선택에 실패했습니다.');
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
          options: ['취소', '사진 촬영', '라이브러리에서 선택'],
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
        '미디어 선택',
        '사진이나 동영상을 선택하세요',
        [
          { text: '취소', style: 'cancel' },
          { text: '사진 촬영', onPress: takePhoto },
          { text: '라이브러리에서 선택', onPress: selectFromLibrary },
        ],
        { cancelable: true }
      );
    }
  };

  return (
    <TouchableOpacity
      style={[styles.button, disabled && styles.buttonDisabled]}
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

const styles = StyleSheet.create({
  button: {
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
});