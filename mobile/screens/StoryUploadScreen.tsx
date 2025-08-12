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
import { useTranslation } from 'react-i18next';
import * as ImagePicker from 'expo-image-picker';
import { Video, ResizeMode } from 'expo-av';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useTheme } from '@/hooks/useTheme';
import { COLORS, FONTS, SIZES } from '../constants/theme';
import { API_BASE_URL } from '../services/api/config';
import { useAuthService } from '../services/auth/auth-service';

export const StoryUploadScreen = () => {
  const { t } = useTranslation('story');
  const navigation = useNavigation();
  const authService = useAuthService();
  const { colors } = useTheme();
  const [media, setMedia] = useState<{ uri: string; type: 'image' | 'video' } | null>(null);
  const [caption, setCaption] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  // Camera permissions
  const requestCameraPermission = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(t('permissions.required'), t('permissions.camera'));
      return false;
    }
    return true;
  };

  // Media library permissions
  const requestMediaLibraryPermission = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(t('permissions.required'), t('permissions.mediaLibrary'));
      return false;
    }
    return true;
  };

  // Take photo/video with camera
  const takePhotoOrVideo = async () => {
    const hasPermission = await requestCameraPermission();
    if (!hasPermission) return;

    Alert.alert(
      t('camera.selectTitle'),
      t('camera.selectMessage'),
      [
        {
          text: t('camera.photo'),
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
          text: t('camera.video'),
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
        { text: t('camera.cancel'), style: 'cancel' },
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
      Alert.alert(t('upload.error'), t('upload.selectMedia'));
      return;
    }

    setIsUploading(true);

    try {
      // Note: The current auth service doesn't have getAccessToken method
      // This needs to be implemented or replaced with proper Clerk token fetching
      const token = ''; // TODO: Get token from Clerk
      if (!token) {
        throw new Error(t('upload.noToken'));
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
        throw new Error(error.message || t('upload.failed'));
      }

      Alert.alert(t('upload.success'), t('upload.successMessage'), [
        {
          text: t('upload.confirm'),
          onPress: () => navigation.goBack(),
        },
      ]);
    } catch (error: any) {
      console.error('Story upload failed:', error);
      Alert.alert(t('upload.error'), error.message || t('upload.failed'));
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
      <SafeAreaView style={[styles.container, { backgroundColor: colors.BACKGROUND }]}>
        <View style={[styles.header, { backgroundColor: colors.BACKGROUND }]}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="close" size={28} color={colors.TEXT.PRIMARY} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.TEXT.PRIMARY }]}>{t('newStory')}</Text>
          <View style={{ width: 28 }} />
        </View>

        <View style={styles.mediaSelectionContainer}>
          <TouchableOpacity style={styles.mediaOption} onPress={takePhotoOrVideo}>
            <View style={[styles.mediaIconContainer, { backgroundColor: colors.PRIMARY + '20' }]}>
              <Ionicons name="camera" size={40} color={colors.PRIMARY} />
            </View>
            <Text style={[styles.mediaOptionText, { color: colors.TEXT.PRIMARY }]}>{t('camera.title')}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.mediaOption} onPress={pickFromGallery}>
            <View style={[styles.mediaIconContainer, { backgroundColor: colors.PRIMARY + '20' }]}>
              <Ionicons name="images" size={40} color={colors.PRIMARY} />
            </View>
            <Text style={[styles.mediaOptionText, { color: colors.TEXT.PRIMARY }]}>{t('gallery')}</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // Media preview and upload screen
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.BACKGROUND }]}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={[styles.header, { backgroundColor: colors.BACKGROUND }]}>
          <TouchableOpacity onPress={clearMedia}>
            <Ionicons name="arrow-back" size={28} color={colors.TEXT.PRIMARY} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.TEXT.PRIMARY }]}>{t('preview.title')}</Text>
          <TouchableOpacity
            onPress={uploadStory}
            disabled={isUploading}
            style={[styles.shareButton, { backgroundColor: colors.PRIMARY }, isUploading && styles.shareButtonDisabled]}
          >
            {isUploading ? (
              <ActivityIndicator size="small" color={colors.TEXT.WHITE} />
            ) : (
              <Text style={[styles.shareButtonText, { color: colors.TEXT.WHITE }]}>{t('preview.share')}</Text>
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

          <View style={[styles.captionContainer, { backgroundColor: colors.BACKGROUND + 'B3' }]}>
            <TextInput
              style={[styles.captionInput, { color: colors.TEXT.PRIMARY }]}
              placeholder={t('preview.captionPlaceholder')}
              placeholderTextColor={colors.TEXT.LIGHT}
              value={caption}
              onChangeText={setCaption}
              multiline
              maxLength={200}
              returnKeyType="done"
            />
            <Text style={[styles.captionCount, { color: colors.TEXT.LIGHT }]}>{caption.length}/200</Text>
          </View>
        </View>
      </KeyboardAvoidingView>
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
    paddingHorizontal: SIZES.padding,
    paddingVertical: SIZES.padding,
  },
  headerTitle: {
    ...FONTS.h3,
  },
  shareButton: {
    paddingHorizontal: SIZES.padding,
    paddingVertical: SIZES.base,
    borderRadius: SIZES.radius,
  },
  shareButtonDisabled: {
    opacity: 0.6,
  },
  shareButtonText: {
    ...FONTS.body3,
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
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SIZES.base,
  },
  mediaOptionText: {
    ...FONTS.body3,
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
    padding: SIZES.padding,
  },
  captionInput: {
    ...FONTS.body3,
    minHeight: 40,
    maxHeight: 100,
  },
  captionCount: {
    ...FONTS.body5,
    textAlign: 'right',
    marginTop: SIZES.base,
  },
});