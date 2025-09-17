import React, { useState } from 'react';
import {
  View,
  Text,
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
import { useAndroidSafeTranslation } from '@/hooks/useAndroidSafeTranslation';
import * as ImagePicker from 'expo-image-picker';
import { Video, ResizeMode } from 'expo-av';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { API_BASE_URL } from '@/services/api/config';
import { useAuthService } from '@/services/auth/auth-service';

export const StoryUploadScreen = () => {
  const { t } = useAndroidSafeTranslation('story');
  const navigation = useNavigation();
  const authService = useAuthService();
  const [media, setMedia] = useState<{ uri: string; type: 'image' | 'video' } | null>(null);
  const [caption, setCaption] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  // Camera permissions
  const requestCameraPermission = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(t('common:permissions.required'), t('common:permissions.camera'));
      return false;
    }
    return true;
  };

  // Media library permissions
  const requestMediaLibraryPermission = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(t('common:permissions.required'), t('common:permissions.mediaLibrary'));
      return false;
    }
    return true;
  };

  // Take photo/video with camera
  const takePhotoOrVideo = async () => {
    const hasPermission = await requestCameraPermission();
    if (!hasPermission) return;

    Alert.alert(
      t('camera:camera.selectTitle'),
      t('camera:camera.selectMessage'),
      [
        {
          text: t('storyupload:camera.photo'),
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
          text: t('storyupload:camera.video'),
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
        { text: t('storyupload:camera.cancel'), style: 'cancel' },
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
      Alert.alert(t('storyupload:upload.error'), t('upload:upload.selectMedia'));
      return;
    }

    setIsUploading(true);

    try {
      // Note: The current auth service doesn't have getAccessToken method
      // This needs to be implemented or replaced with proper Clerk token fetching
      const token = ''; // TODO: Get token from Clerk
      if (!token) {
        throw new Error(t('storyupload:upload.noToken'));
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
        throw new Error(error.message || t('storyupload:upload.failed'));
      }

      Alert.alert(t('upload:upload.success'), t('upload:upload.successMessage'), [
        {
          text: t('storyupload:upload.confirm'),
          onPress: () => navigation.goBack(),
        },
      ]);
    } catch (error: any) {
      console.error('Story upload failed:', error);
      Alert.alert(t('storyupload:upload.error'), error.message || t('upload:upload.failed'));
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
      <SafeAreaView className="flex-1 bg-white dark:bg-gray-900">
        <View className="flex-row justify-between items-center px-4 py-4 bg-white dark:bg-gray-900">
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="close" size={28} className="text-gray-900 dark:text-white" />
          </TouchableOpacity>
          <Text className="text-gray-900 dark:text-white text-lg font-semibold">{t('newStory')}</Text>
          <View className="w-7" />
        </View>

        <View className="flex-1 flex-row justify-center items-center gap-10">
          <TouchableOpacity className="items-center" onPress={takePhotoOrVideo}>
            <View className="w-25 h-25 rounded-full bg-blue-100 dark:bg-blue-900/30 justify-center items-center mb-3">
              <Ionicons name="camera" size={40} className="text-blue-500 dark:text-blue-400" />
            </View>
            <Text className="text-gray-900 dark:text-white text-base">{t('storyupload:camera.title')}</Text>
          </TouchableOpacity>

          <TouchableOpacity className="items-center" onPress={pickFromGallery}>
            <View className="w-25 h-25 rounded-full bg-blue-100 dark:bg-blue-900/30 justify-center items-center mb-3">
              <Ionicons name="images" size={40} className="text-blue-500 dark:text-blue-400" />
            </View>
            <Text className="text-gray-900 dark:text-white text-base">{t('gallery')}</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // Media preview and upload screen
  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-gray-900">
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View className="flex-row justify-between items-center px-4 py-4 bg-white dark:bg-gray-900">
          <TouchableOpacity onPress={clearMedia}>
            <Ionicons name="arrow-back" size={28} className="text-gray-900 dark:text-white" />
          </TouchableOpacity>
          <Text className="text-gray-900 dark:text-white text-lg font-semibold">{t('storyupload:preview.title')}</Text>
          <TouchableOpacity
            onPress={uploadStory}
            disabled={isUploading}
            className={`px-4 py-2 rounded-lg ${isUploading ? 'opacity-60' : ''} bg-blue-500 dark:bg-blue-600`}
          >
            {isUploading ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <Text className="text-white text-base font-semibold">{t('storyupload:preview.share')}</Text>
            )}
          </TouchableOpacity>
        </View>

        <View className="flex-1 relative">
          {media.type === 'image' ? (
            <Image source={{ uri: media.uri }} className="flex-1 w-full" resizeMode="cover" />
          ) : (
            <Video
              source={{ uri: media.uri }}
              className="flex-1 w-full"
              resizeMode={ResizeMode.COVER}
              shouldPlay
              isLooping
              isMuted
            />
          )}

          <View className="absolute bottom-0 left-0 right-0 bg-black/70 p-4">
            <TextInput
              className="text-white text-base min-h-[40px] max-h-[100px]"
              placeholder={t('storyupload:preview.captionPlaceholder')}
              placeholderTextColor="#9CA3AF"
              value={caption}
              onChangeText={setCaption}
              multiline
              maxLength={200}
              returnKeyType="done"
            />
            <Text className="text-gray-400 text-sm text-right mt-2">{caption.length}/200</Text>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};