import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
  SafeAreaView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import { Video, ResizeMode } from 'expo-av';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { COLORS, FONTS, SIZES } from '../constants/theme';
import { API_BASE_URL } from '../services/api/config';
import { useAuthService } from '../services/auth/auth-service';

export const StoryUploadScreen = () => {
  const navigation = useNavigation();
  const authService = useAuthService();
  const [media, setMedia] = useState<{ uri: string; type: 'image' | 'video' } | null>(null);
  const [caption, setCaption] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  // Camera permissions
  const requestCameraPermission = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('권한 필요', '카메라 권한이 필요합니다.');
      return false;
    }
    return true;
  };

  // Media library permissions
  const requestMediaLibraryPermission = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('권한 필요', '사진 라이브러리 접근 권한이 필요합니다.');
      return false;
    }
    return true;
  };

  // Take photo/video with camera
  const takePhotoOrVideo = async () => {
    const hasPermission = await requestCameraPermission();
    if (!hasPermission) return;

    Alert.alert(
      '선택',
      '사진 또는 동영상을 선택하세요',
      [
        {
          text: '사진',
          onPress: async () => {
            const result = await ImagePicker.launchCameraAsync({
              mediaTypes: ImagePicker.MediaTypeOptions.Images,
              allowsEditing: true,
              aspect: [9, 16],
              quality: 0.8,
            });

            if (!result.canceled && result.assets[0]) {
              setMedia({ uri: result.assets[0].uri, type: 'image' });
            }
          },
        },
        {
          text: '동영상',
          onPress: async () => {
            const result = await ImagePicker.launchCameraAsync({
              mediaTypes: ImagePicker.MediaTypeOptions.Videos,
              allowsEditing: true,
              videoMaxDuration: 30, // 30 seconds max
              quality: ImagePicker.UIImagePickerControllerQualityType.Medium,
            });

            if (!result.canceled && result.assets[0]) {
              setMedia({ uri: result.assets[0].uri, type: 'video' });
            }
          },
        },
        { text: '취소', style: 'cancel' },
      ]
    );
  };

  // Pick from gallery
  const pickFromGallery = async () => {
    const hasPermission = await requestMediaLibraryPermission();
    if (!hasPermission) return;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.All,
      allowsEditing: true,
      aspect: [9, 16],
      quality: 0.8,
      videoMaxDuration: 30,
    });

    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      const type = asset.type === 'video' ? 'video' : 'image';
      setMedia({ uri: asset.uri, type });
    }
  };

  // Upload story
  const uploadStory = async () => {
    if (!media) {
      Alert.alert('오류', '업로드할 미디어를 선택해주세요.');
      return;
    }

    setIsUploading(true);

    try {
      // Note: The current auth service doesn't have getAccessToken method
      // This needs to be implemented or replaced with proper Clerk token fetching
      const token = ''; // TODO: Get token from Clerk
      if (!token) {
        throw new Error('인증 토큰이 없습니다.');
      }

      const formData = new FormData();
      formData.append('media', {
        uri: media.uri,
        type: media.type === 'video' ? 'video/mp4' : 'image/jpeg',
        name: media.type === 'video' ? 'story.mp4' : 'story.jpg',
      } as any);

      if (caption.trim()) {
        formData.append('caption', caption.trim());
      }

      const response = await fetch(`${API_BASE_URL}/stories`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || '업로드 실패');
      }

      Alert.alert('성공', '스토리가 업로드되었습니다!', [
        {
          text: '확인',
          onPress: () => navigation.goBack(),
        },
      ]);
    } catch (error: any) {
      console.error('Story upload failed:', error);
      Alert.alert('오류', error.message || '스토리 업로드에 실패했습니다.');
    } finally {
      setIsUploading(false);
    }
  };

  // Clear selected media
  const clearMedia = () => {
    setMedia(null);
    setCaption('');
  };

  if (!media) {
    // Media selection screen
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="close" size={28} color={COLORS.white} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>새 스토리</Text>
          <View style={{ width: 28 }} />
        </View>

        <View style={styles.mediaSelectionContainer}>
          <TouchableOpacity style={styles.mediaOption} onPress={takePhotoOrVideo}>
            <View style={styles.mediaIconContainer}>
              <Ionicons name="camera" size={40} color={COLORS.white} />
            </View>
            <Text style={styles.mediaOptionText}>카메라</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.mediaOption} onPress={pickFromGallery}>
            <View style={styles.mediaIconContainer}>
              <Ionicons name="images" size={40} color={COLORS.white} />
            </View>
            <Text style={styles.mediaOptionText}>갤러리</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // Media preview and upload screen
  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={clearMedia}>
            <Ionicons name="arrow-back" size={28} color={COLORS.white} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>스토리 미리보기</Text>
          <TouchableOpacity
            onPress={uploadStory}
            disabled={isUploading}
            style={[styles.shareButton, isUploading && styles.shareButtonDisabled]}
          >
            {isUploading ? (
              <ActivityIndicator size="small" color={COLORS.white} />
            ) : (
              <Text style={styles.shareButtonText}>공유</Text>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.previewContainer}>
          {media.type === 'image' ? (
            <Image source={{ uri: media.uri }} style={styles.mediaPreview} resizeMode="cover" />
          ) : (
            <Video
              source={{ uri: media.uri }}
              style={styles.mediaPreview}
              resizeMode={ResizeMode.COVER}
              shouldPlay
              isLooping
              isMuted
            />
          )}

          <View style={styles.captionContainer}>
            <TextInput
              style={styles.captionInput}
              placeholder="캡션 추가..."
              placeholderTextColor={COLORS.gray}
              value={caption}
              onChangeText={setCaption}
              multiline
              maxLength={200}
              returnKeyType="done"
            />
            <Text style={styles.captionCount}>{caption.length}/200</Text>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.black,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SIZES.padding,
    paddingVertical: SIZES.padding,
  },
  headerTitle: {
    ...FONTS.h3,
    color: COLORS.white,
  },
  shareButton: {
    paddingHorizontal: SIZES.padding,
    paddingVertical: SIZES.base,
    backgroundColor: COLORS.primary,
    borderRadius: SIZES.radius,
  },
  shareButtonDisabled: {
    opacity: 0.6,
  },
  shareButtonText: {
    ...FONTS.body3,
    color: COLORS.white,
    fontWeight: '600',
  },
  mediaSelectionContainer: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 40,
  },
  mediaOption: {
    alignItems: 'center',
  },
  mediaIconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SIZES.base,
  },
  mediaOptionText: {
    ...FONTS.body3,
    color: COLORS.white,
  },
  previewContainer: {
    flex: 1,
    position: 'relative',
  },
  mediaPreview: {
    flex: 1,
    width: '100%',
  },
  captionContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    padding: SIZES.padding,
  },
  captionInput: {
    ...FONTS.body3,
    color: COLORS.white,
    minHeight: 40,
    maxHeight: 100,
  },
  captionCount: {
    ...FONTS.body5,
    color: COLORS.gray,
    textAlign: 'right',
    marginTop: SIZES.base,
  },
});