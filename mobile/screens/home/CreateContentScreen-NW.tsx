/**
 * 콘텐츠 생성 화면 - NativeWind 버전
 * 
 * 데이팅 앱의 스토리/포스트 작성 화면
 * 이미지와 텍스트로 자신을 표현하고 매력을 어필하는 공간
 */
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  SafeAreaView,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  ScrollView,
  Image,
  Animated,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAndroidSafeTranslation } from '@/hooks/useAndroidSafeTranslation';
import * as ImagePicker from 'expo-image-picker';
import { useAuthStore } from '@/store/slices/authSlice';
import { useGroupStore } from '@/store/slices/groupSlice';
import { useTheme } from '@/hooks/useTheme';
import { Group, Content } from '@/types';
import { groupApi } from '@/services/api/groupApi';
import { contentApi } from '@/services/api/contentApi';
import { apiClient } from '@/services/api/config';
import { LinearGradient } from 'expo-linear-gradient';
import { cn } from '@/lib/utils';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

const { width: screenWidth } = Dimensions.get('window');
const IMAGE_SIZE = (screenWidth - 48) / 3;

export const CreateContentScreen = ({ route }: any) => {
  const { t } = useAndroidSafeTranslation(['common', 'post']);
  const { colors, isDarkMode } = useTheme();
  const editingContent = route?.params?.editingContent as Content | undefined;
  const isEditMode = !!editingContent;
  
  const [contentText, setContentText] = useState(editingContent?.text || '');
  const [selectedImages, setSelectedImages] = useState<string[]>(editingContent?.imageUrls || []);
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showGroupPicker, setShowGroupPicker] = useState(false);
  const [textHeight, setTextHeight] = useState(120);
  
  const navigation = useNavigation();
  const authStore = useAuthStore();
  const groupStore = useGroupStore();
  
  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const groupPickerAnim = useRef(new Animated.Value(0)).current;
  const imageAnimations = useRef<Animated.Value[]>([]).current;
  
  // Initialize animations for images
  useEffect(() => {
    selectedImages.forEach((_, index) => {
      if (!imageAnimations[index]) {
        imageAnimations[index] = new Animated.Value(0);
        Animated.spring(imageAnimations[index], {
          toValue: 1,
          friction: 4,
          useNativeDriver: true,
        }).start();
      }
    });
  }, [selectedImages]);
  
  // Entry animations
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 4,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);
  
  // Group picker animation
  useEffect(() => {
    Animated.timing(groupPickerAnim, {
      toValue: showGroupPicker ? 1 : 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [showGroupPicker]);
  
  // Load groups
  useEffect(() => {
    const loadGroups = async () => {
      try {
        const groups = await groupApi.getGroups();
        groupStore.setGroups(groups);
        
        if (__DEV__) {
          const joinedIds = new Set(groupStore.joinedGroups.map(g => g.id));
          groups.forEach(async group => {
            if (!joinedIds.has(group.id)) {
              try {
                await groupStore.joinGroup(group.id);
              } catch (error) {
                console.log(`Group ${group.name} auto-join skipped`);
              }
            }
          });
        }
        
        if (isEditMode && editingContent?.groupId) {
          const existingGroup = groups.find(g => g.id === editingContent.groupId);
          if (existingGroup) {
            setSelectedGroup(existingGroup);
          }
        }
      } catch (error) {
        console.error('Failed to load groups:', error);
      }
    };

    if (groupStore.groups.length === 0) {
      loadGroups();
    } else if (isEditMode && editingContent?.groupId && !selectedGroup) {
      const existingGroup = groupStore.groups.find(g => g.id === editingContent.groupId);
      if (existingGroup) {
        setSelectedGroup(existingGroup);
      }
    }
  }, [isEditMode, editingContent, selectedGroup]);

  const handleImagePicker = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert(t('post:errors.permissionDenied'), t('post:errors.permissionMessage'));
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: true,
        quality: 0.8,
        selectionLimit: 5 - selectedImages.length,
      });

      if (!result.canceled && result.assets) {
        const newImages = result.assets.map(asset => asset.uri);
        setSelectedImages(prev => [...prev, ...newImages].slice(0, 5));
      }
    } catch (error) {
      console.error('Image picker error:', error);
      Alert.alert(t('post:errors.imageError'), t('post:errors.imageErrorMessage'));
    }
  };

  const handleRemoveImage = (index: number) => {
    Animated.timing(imageAnimations[index], {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      setSelectedImages(prev => prev.filter((_, i) => i !== index));
    });
  };

  const handleGroupSelect = (group: Group) => {
    setSelectedGroup(group);
    setShowGroupPicker(false);
  };

  const handleSubmit = async () => {
    if (!contentText.trim() && selectedImages.length === 0) {
      Alert.alert(t('common:errors.invalid'), t('common:content.validation.contentRequired'));
      return;
    }

    if (!selectedGroup) {
      Alert.alert(t('common:errors.required'), t('common:content.validation.groupRequired'));
      return;
    }

    setIsSubmitting(true);
    try {
      let userNickname = authStore.user?.nickname;
      let userId = authStore.user?.id;
      
      if (!userNickname || !userId) {
        try {
          const userData = await apiClient.get('/users/profile');
          if (userData.success && userData.data) {
            userNickname = userData.data.nickname || '테스트유저';
            userId = userData.data.id || 'current_user';
            
            authStore.setUser({
              ...authStore.user,
              id: userId,
              nickname: userNickname,
              ...userData.data
            });
          }
        } catch (error) {
          console.warn('Failed to fetch user info:', error);
          userNickname = '테스트유저';
          userId = 'current_user';
        }
      }

      const contentData: Partial<Content> = {
        text: contentText.trim() || undefined,
        type: selectedImages.length > 0 ? 'image' : 'text',
        imageUrls: selectedImages.length > 0 ? selectedImages : undefined,
        groupId: selectedGroup.id,
        userId: userId,
        authorId: userId,
        authorNickname: userNickname,
      };

      let result: Content;
      if (isEditMode && editingContent) {
        result = await contentApi.updateContent(editingContent.id, contentData);
      } else {
        result = await contentApi.createContent(contentData);
      }

      navigation.navigate('HomeTab' as never);
      
      setTimeout(() => {
        Alert.alert(
          t('common:content.success.title'),
          t('common:content.success.message', { groupName: selectedGroup.name })
        );
      }, 500);
    } catch (error: any) {
      console.error('Content creation failed:', error);
      const errorMessage = error?.message || t('common:errors.unknown');
      Alert.alert(t('common:errors.error'), errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderGroupPicker = () => {
    const availableGroups = groupStore.joinedGroups;

    return (
      <Animated.View
        pointerEvents={showGroupPicker ? 'auto' : 'none'}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          opacity: groupPickerAnim,
          zIndex: 999,
        }}
      >
        <TouchableOpacity 
          className="flex-1 justify-end"
          activeOpacity={1}
          onPress={() => setShowGroupPicker(false)}
        >
          <Animated.View
            style={{
              transform: [
                {
                  translateY: groupPickerAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [300, 0],
                  }),
                },
              ],
            }}
            className="rounded-t-3xl max-h-[70%] bg-white dark:bg-gray-900"
          >
            <View className="p-4 border-b border-gray-200 dark:border-gray-800">
              <View className="w-12 h-1 bg-gray-300 dark:bg-gray-700 rounded-full mx-auto mb-4" />
              <Text className="text-xl font-bold text-center text-gray-900 dark:text-white">
                {t('group:picker.title')}
              </Text>
            </View>
            
            <ScrollView className="px-4">
              {availableGroups.length > 0 ? (
                availableGroups.map(group => (
                  <TouchableOpacity
                    key={group.id}
                    onPress={() => handleGroupSelect(group)}
                    className="py-4 border-b flex-row items-center justify-between border-gray-200 dark:border-gray-800"
                  >
                    <View className="flex-row items-center flex-1">
                      <LinearGradient
                        colors={['#FF6B6B', '#FF8E53']}
                        className="w-10 h-10 rounded-full items-center justify-center mr-3"
                      >
                        <Ionicons name="people" size={20} color="white" />
                      </LinearGradient>
                      <View className="flex-1">
                        <Text className="text-lg font-semibold text-gray-900 dark:text-white">
                          {group.name}
                        </Text>
                        <Text className="text-sm text-gray-600 dark:text-gray-400">
                          {group.type}
                        </Text>
                      </View>
                    </View>
                    <Ionicons 
                      name="chevron-forward" 
                      size={20} 
                      color={colors.TEXT.SECONDARY} 
                    />
                  </TouchableOpacity>
                ))
              ) : (
                <View className="py-12 items-center">
                  <Text className="text-center text-gray-600 dark:text-gray-400">
                    {__DEV__ ? t('post:create.loading') : t('post:create.noGroups')}
                  </Text>
                </View>
              )}
            </ScrollView>
          </Animated.View>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50 dark:bg-gray-950">
      {/* Header */}
      <View className="flex-row items-center justify-between px-4 py-3 border-b bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800">
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          className="px-3 py-2"
        >
          <Text className="text-base text-gray-600 dark:text-gray-400">
            {t('common:content.create.cancel')}
          </Text>
        </TouchableOpacity>
        
        <Text className="text-lg font-bold text-gray-900 dark:text-white">
          {isEditMode ? t('post:create.editStory') : t('common:content.create.title')}
        </Text>
        
        <TouchableOpacity
          onPress={handleSubmit}
          disabled={isSubmitting || (!contentText.trim() && selectedImages.length === 0)}
          className={cn(
            "px-4 py-2 rounded-full",
            (!contentText.trim() && selectedImages.length === 0) || isSubmitting
              ? "bg-gray-300"
              : "bg-gradient-to-r from-primary-500 to-primary-400"
          )}
        >
          {isSubmitting ? (
            <ActivityIndicator size="small" color="white" />
          ) : (
            <Text className="text-white font-semibold">
              {isEditMode ? t('post:create.updateComplete') : t('common:content.create.publish')}
            </Text>
          )}
        </TouchableOpacity>
      </View>
      
      <KeyboardAvoidingView 
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
          <Animated.View
            style={{
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            }}
            className="p-4"
          >
            {/* Group Selector */}
            <TouchableOpacity
              onPress={() => setShowGroupPicker(true)}
              className={cn(
                "mb-4 p-4 rounded-2xl border-2 border-dashed",
                selectedGroup 
                  ? "border-primary-500 bg-primary-50 dark:bg-primary-900/20"
                  : "border-gray-300 dark:border-gray-700"
              )}
            >
              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center flex-1">
                  <Ionicons 
                    name="people-circle" 
                    size={24} 
                    color={selectedGroup ? colors.PRIMARY : colors.TEXT.DISABLED} 
                  />
                  <Text className={cn(
                    "ml-3 text-base",
                    selectedGroup
                      ? "text-gray-900 dark:text-white font-semibold"
                      : "text-gray-600 dark:text-gray-400"
                  )}>
                    {selectedGroup ? selectedGroup.name : t('post:create.selectGroup')}
                  </Text>
                </View>
                <Ionicons 
                  name="chevron-down" 
                  size={20} 
                  color={colors.TEXT.SECONDARY} 
                />
              </View>
            </TouchableOpacity>
            
            {/* Text Input */}
            <View className={cn(
              "mb-4 p-4 rounded-2xl",
              "bg-white dark:bg-gray-900"
            )}>
              <TextInput
                value={contentText}
                onChangeText={setContentText}
                placeholder={t('post:create.placeholder')}
                placeholderTextColor={colors.TEXT.SECONDARY}
                multiline
                style={{ minHeight: textHeight }}
                onContentSizeChange={(event) => {
                  setTextHeight(Math.max(120, event.nativeEvent.contentSize.height));
                }}
                className={cn(
                  "text-base",
                  "text-gray-900 dark:text-white"
                )}
              />
              
              <View className="flex-row items-center justify-between mt-3 pt-3 border-t border-gray-200 dark:border-gray-800">
                <TouchableOpacity
                  onPress={handleImagePicker}
                  disabled={selectedImages.length >= 5}
                  className="flex-row items-center"
                >
                  <Ionicons 
                    name="image" 
                    size={24} 
                    color={selectedImages.length >= 5 ? '#9CA3AF' : colors.PRIMARY} 
                  />
                  <Text className={cn(
                    "ml-2",
                    selectedImages.length >= 5
                      ? "text-gray-400"
                      : "text-secondary-500 dark:text-secondary-400"
                  )}>
                    {t('post:create.addPhoto')} ({selectedImages.length}/5)
                  </Text>
                </TouchableOpacity>
                
                <Text className={cn(
                  "text-sm",
                  "text-gray-400 dark:text-gray-500"
                )}>
                  {contentText.length}/500
                </Text>
              </View>
            </View>
            
            {/* Image Preview */}
            {selectedImages.length > 0 && (
              <View className={cn(
                "p-4 rounded-2xl",
                "bg-white dark:bg-gray-900"
              )}>
                <Text className={cn(
                  "text-sm font-semibold mb-3",
                  "text-gray-900 dark:text-white"
                )}>
                  {t('common:content.create.selectedImages', { count: selectedImages.length })}
                </Text>
                
                <View className="flex-row flex-wrap">
                  {selectedImages.map((uri, index) => {
                    const imageAnim = imageAnimations[index] || new Animated.Value(1);
                    
                    return (
                      <Animated.View
                        key={index}
                        style={{
                          opacity: imageAnim,
                          transform: [{ scale: imageAnim }],
                        }}
                        className="mr-2 mb-2"
                      >
                        <Image 
                          source={{ uri }} 
                          className="rounded-xl"
                          style={{ width: IMAGE_SIZE, height: IMAGE_SIZE }}
                        />
                        <TouchableOpacity
                          onPress={() => handleRemoveImage(index)}
                          className="absolute top-1 right-1 w-6 h-6 rounded-full bg-red-500 items-center justify-center"
                        >
                          <Ionicons name="close" size={16} color="white" />
                        </TouchableOpacity>
                      </Animated.View>
                    );
                  })}
                </View>
              </View>
            )}
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
      
      {/* Group Picker Modal */}
      {renderGroupPicker()}
    </SafeAreaView>
  );
};