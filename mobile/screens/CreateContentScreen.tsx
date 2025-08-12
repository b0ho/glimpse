import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TextInput,
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
import { useGroupStore } from '@/store/slices/groupSlice';
import { Group, Content } from '@/types';
import { COLORS, SPACING, FONT_SIZES } from '@/utils/constants';
import { groupApi } from '@/services/api/groupApi';
import { contentApi } from '@/services/api/contentApi';

export const CreateContentScreen = ({ route }: any) => {
  const { t } = useTranslation(['common', 'group']);
  const editingContent = route?.params?.editingContent as Content | undefined;
  const isEditMode = !!editingContent;
  
  const [contentText, setContentText] = useState(editingContent?.text || '');
  const [selectedImages, setSelectedImages] = useState<string[]>(editingContent?.imageUrls || []);
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showGroupPicker, setShowGroupPicker] = useState(false);
  
  const navigation = useNavigation();
  const authStore = useAuthStore();
  const groupStore = useGroupStore();

  // 컴포넌트 로드 시 그룹 목록 불러오기
  useEffect(() => {
    const loadGroups = async () => {
      try {
        console.log('[CreateContentScreen] 그룹 목록 로드 시작');
        const groups = await groupApi.getGroups();
        groupStore.setGroups(groups);
        
        // 개발 환경에서는 모든 그룹에 자동으로 참여한 것으로 처리
        if (__DEV__) {
          groups.forEach(group => {
            groupStore.joinGroup(group);
          });
          console.log('[CreateContentScreen] 개발 모드: 모든 그룹에 자동 참여');
        }
        
        console.log('[CreateContentScreen] 그룹 목록 로드 완료:', groups.length, '개');
        console.log('[CreateContentScreen] 참여한 그룹:', groupStore.joinedGroups.length, '개');
        
        // 수정 모드일 때 기존 그룹 설정
        if (isEditMode && editingContent?.groupId) {
          const existingGroup = groups.find(g => g.id === editingContent.groupId);
          if (existingGroup) {
            setSelectedGroup(existingGroup);
            console.log('[CreateContentScreen] 수정 모드: 기존 그룹 설정', existingGroup.name);
          }
        }
      } catch (error) {
        console.error('[CreateContentScreen] 그룹 목록 로드 실패:', error);
      }
    };

    // 그룹 목록이 비어있는 경우에만 로드
    if (groupStore.groups.length === 0) {
      loadGroups();
    } else if (isEditMode && editingContent?.groupId && !selectedGroup) {
      // 이미 그룹이 로드되어 있고 수정 모드인 경우
      const existingGroup = groupStore.groups.find(g => g.id === editingContent.groupId);
      if (existingGroup) {
        setSelectedGroup(existingGroup);
      }
    }
  }, [isEditMode, editingContent, selectedGroup]);

  const handleImagePicker = async () => {
    try {
      console.log('[CreateContentScreen] 이미지 선택 시작');
      
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      console.log('[CreateContentScreen] 권한 상태:', status);
      
      if (status !== 'granted') {
        Alert.alert('권한 필요', '갤러리 접근 권한이 필요합니다.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: true,
        quality: 0.8,
        selectionLimit: 5 - selectedImages.length,
      });

      console.log('[CreateContentScreen] 이미지 선택 결과:', {
        canceled: result.canceled,
        assetsCount: result.assets?.length || 0,
        assets: result.assets?.map(asset => ({
          uri: asset.uri,
          width: asset.width,
          height: asset.height
        }))
      });

      if (!result.canceled && result.assets) {
        const newImages = result.assets.map(asset => asset.uri);
        console.log('[CreateContentScreen] 새 이미지 URIs:', newImages);
        setSelectedImages(prev => {
          const updated = [...prev, ...newImages].slice(0, 5);
          console.log('[CreateContentScreen] 업데이트된 이미지 목록:', updated);
          return updated;
        });
      }
    } catch (error) {
      console.error('[CreateContentScreen] 이미지 선택 에러:', error);
      Alert.alert('오류', '이미지 선택 중 오류가 발생했습니다.');
    }
  };

  const handleRemoveImage = (index: number) => {
    setSelectedImages(prev => prev.filter((_, i) => i !== index));
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
      console.log('[CreateContentScreen] 콘텐츠 생성 시도:', {
        text: contentText.trim(),
        groupId: selectedGroup.id,
        imageCount: selectedImages.length,
      });

      // 사용자 정보 가져오기 - authStore에서 우선 확인
      let userNickname = authStore.user?.nickname;
      let userId = authStore.user?.id;
      
      console.log('[CreateContentScreen] authStore 사용자 정보:', {
        nickname: userNickname,
        userId: userId
      });
      
      // authStore에 사용자 정보가 없거나 불완전한 경우 서버에서 가져오기
      if (!userNickname || !userId) {
        try {
          console.log('[CreateContentScreen] 서버에서 사용자 정보 가져오기 시도');
          const userResponse = await fetch('http://localhost:3002/api/v1/users/profile', {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              'x-dev-auth': 'true',
            },
          });
          
          if (userResponse.ok) {
            const userData = await userResponse.json();
            console.log('[CreateContentScreen] 서버 사용자 정보 응답:', userData);
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
              
              console.log('[CreateContentScreen] 사용자 정보 업데이트 완료:', {
                nickname: userNickname,
                userId: userId
              });
            }
          } else {
            console.warn('[CreateContentScreen] 서버 응답 실패:', userResponse.status);
            userNickname = '테스트유저';
            userId = 'current_user';
          }
        } catch (error) {
          console.warn('[CreateContentScreen] 서버 사용자 정보 가져오기 실패:', error);
          userNickname = '테스트유저';
          userId = 'current_user';
        }
      }

      // 실제 API 호출로 콘텐츠 생성
      const contentData: Partial<Content> = {
        text: contentText.trim() || undefined,
        type: selectedImages.length > 0 ? 'image' : 'text',
        imageUrls: selectedImages.length > 0 ? selectedImages : undefined,
        groupId: selectedGroup.id,
        userId: userId,
        authorId: userId,
        authorNickname: userNickname,
      };

      console.log('[CreateContentScreen] contentData 확인:', {
        authorNickname: contentData.authorNickname,
        userId: contentData.userId,
      });

      let result: Content;
      if (isEditMode && editingContent) {
        // 수정 모드
        result = await contentApi.updateContent(editingContent.id, contentData);
        console.log('[CreateContentScreen] 콘텐츠 수정 성공:', result);
      } else {
        // 생성 모드
        result = await contentApi.createContent(contentData);
        console.log('[CreateContentScreen] 콘텐츠 생성 성공:', result);
      }

      // 성공 시 즉시 홈화면으로 이동
      console.log('[CreateContentScreen] 콘텐츠 생성 성공 - 홈화면으로 이동');
      navigation.navigate('HomeTab' as never);
      
      // 성공 알림은 나중에 표시 (옵션)
      setTimeout(() => {
        Alert.alert(
          t('common:content.success.title'),
          t('common:content.success.message', { groupName: selectedGroup.name })
        );
      }, 500);
    } catch (error: any) {
      console.error('[CreateContentScreen] 콘텐츠 생성 실패:', error);
      const errorMessage = error?.message || t('common:errors.unknown');
      Alert.alert(t('common:errors.error'), errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderGroupPicker = () => {
    if (!showGroupPicker) return null;

    const availableGroups = groupStore.joinedGroups;

    return (
      <View style={styles.groupPickerOverlay}>
        <View style={styles.groupPickerModal}>
          <Text style={styles.groupPickerTitle}>{t('group:picker.title')}</Text>
          <ScrollView style={styles.groupList}>
            {availableGroups.length > 0 ? (
              availableGroups.map(group => (
                <TouchableOpacity
                  key={group.id}
                  style={styles.groupItem}
                  onPress={() => handleGroupSelect(group)}
                >
                  <Text style={styles.groupName}>{group.name}</Text>
                  <Text style={styles.groupType}>{group.type}</Text>
                </TouchableOpacity>
              ))
            ) : (
              <View style={styles.emptyGroupContainer}>
                <Text style={styles.emptyGroupText}>
                  {__DEV__ ? '그룹을 불러오는 중...' : '참여한 그룹이 없습니다.'}
                </Text>
              </View>
            )}
          </ScrollView>
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => setShowGroupPicker(false)}
          >
            <Text style={styles.cancelButtonText}>{t('group:picker.cancel')}</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderImagePreview = () => {
    if (selectedImages.length === 0) return null;

    return (
      <View style={styles.imagePreviewContainer}>
        <Text style={styles.imagePreviewTitle}>
          {t('common:content.create.selectedImages', { count: selectedImages.length })}
        </Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {selectedImages.map((uri, index) => (
            <View key={index} style={styles.imagePreviewItem}>
              <Image source={{ uri }} style={styles.previewImage} />
              <TouchableOpacity
                style={styles.removeImageButton}
                onPress={() => handleRemoveImage(index)}
              >
                <Text style={styles.removeImageButtonText}>×</Text>
              </TouchableOpacity>
            </View>
          ))}
        </ScrollView>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.headerButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.headerButtonText}>{t('common:content.create.cancel')}</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {isEditMode ? '스토리 수정' : t('common:content.create.title')}
        </Text>
        <TouchableOpacity
          style={[
            styles.headerButton,
            styles.submitButton,
            (!contentText.trim() && selectedImages.length === 0) && styles.submitButtonDisabled,
          ]}
          onPress={handleSubmit}
          disabled={isSubmitting || (!contentText.trim() && selectedImages.length === 0)}
        >
          {isSubmitting ? (
            <ActivityIndicator size="small" color={COLORS.TEXT.WHITE} />
          ) : (
            <Text style={styles.submitButtonText}>
              {isEditMode ? '수정 완료' : t('common:content.create.publish')}
            </Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.groupSelector}>
          <Text style={styles.sectionLabel}>{t('common:content.create.publishTo')}</Text>
          <TouchableOpacity
            style={styles.groupSelectorButton}
            onPress={() => setShowGroupPicker(true)}
          >
            <Text style={styles.groupSelectorText}>
              {selectedGroup ? selectedGroup.name : t('common:content.create.selectGroup')}
            </Text>
            <Text style={styles.groupSelectorArrow}>{'>'}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.textInputContainer}>
          <Text style={styles.sectionLabel}>{t('common:content.create.contentLabel')}</Text>
          <TextInput
            style={styles.textInput}
            placeholder={t('common:content.create.placeholder')}
            placeholderTextColor={COLORS.TEXT.LIGHT}
            value={contentText}
            onChangeText={setContentText}
            multiline
            maxLength={500}
            textAlignVertical="top"
          />
          <Text style={styles.characterCount}>
            {t('common:content.create.characterCount', { current: contentText.length, max: 500 })}
          </Text>
        </View>

        {renderImagePreview()}

        <View style={styles.mediaButtons}>
          <TouchableOpacity
            style={[
              styles.mediaButton,
              selectedImages.length >= 5 && styles.mediaButtonDisabled,
            ]}
            onPress={handleImagePicker}
            disabled={selectedImages.length >= 5}
          >
            <Text style={styles.mediaButtonIcon}>📷</Text>
            <Text style={styles.mediaButtonText}>
              {t('common:content.create.addPhotos', { current: selectedImages.length, max: 5 })}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.guidelines}>
          <Text style={styles.guidelinesTitle}>{t('common:content.create.guidelines.title')}</Text>
          <Text style={styles.guidelinesText}>
            {t('common:content.create.guidelines.privacy')}{'\n'}
            {t('common:content.create.guidelines.respect')}{'\n'}
            {t('common:content.create.guidelines.inappropriate')}{'\n'}
            {t('common:content.create.guidelines.images')}
          </Text>
        </View>
      </ScrollView>

      {renderGroupPicker()}
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
  headerButtonText: {
    fontSize: FONT_SIZES.MD,
    color: COLORS.TEXT.SECONDARY,
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
  groupSelector: {
    marginBottom: SPACING.LG,
  },
  sectionLabel: {
    fontSize: FONT_SIZES.MD,
    fontWeight: '600',
    color: COLORS.TEXT.PRIMARY,
    marginBottom: SPACING.SM,
  },
  groupSelectorButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.MD,
    backgroundColor: COLORS.SURFACE,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.BORDER,
  },
  groupSelectorText: {
    fontSize: FONT_SIZES.MD,
    color: COLORS.TEXT.PRIMARY,
  },
  groupSelectorArrow: {
    fontSize: FONT_SIZES.MD,
    color: COLORS.TEXT.SECONDARY,
  },
  textInputContainer: {
    marginBottom: SPACING.LG,
  },
  textInput: {
    backgroundColor: COLORS.SURFACE,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.BORDER,
    padding: SPACING.MD,
    fontSize: FONT_SIZES.MD,
    color: COLORS.TEXT.PRIMARY,
    minHeight: 120,
    maxHeight: 200,
  },
  characterCount: {
    textAlign: 'right',
    fontSize: FONT_SIZES.XS,
    color: COLORS.TEXT.LIGHT,
    marginTop: SPACING.XS,
  },
  imagePreviewContainer: {
    marginBottom: SPACING.LG,
  },
  imagePreviewTitle: {
    fontSize: FONT_SIZES.MD,
    fontWeight: '600',
    color: COLORS.TEXT.PRIMARY,
    marginBottom: SPACING.SM,
  },
  imagePreviewItem: {
    position: 'relative',
    marginRight: SPACING.SM,
  },
  previewImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
  },
  removeImageButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.ERROR,
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeImageButtonText: {
    color: COLORS.TEXT.WHITE,
    fontSize: 16,
    fontWeight: 'bold',
  },
  mediaButtons: {
    marginBottom: SPACING.LG,
  },
  mediaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.MD,
    backgroundColor: COLORS.SURFACE,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.BORDER,
  },
  mediaButtonDisabled: {
    opacity: 0.5,
  },
  mediaButtonIcon: {
    fontSize: 20,
    marginRight: SPACING.SM,
  },
  mediaButtonText: {
    fontSize: FONT_SIZES.MD,
    color: COLORS.TEXT.PRIMARY,
  },
  guidelines: {
    backgroundColor: COLORS.SURFACE,
    padding: SPACING.MD,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.BORDER,
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
  groupPickerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: COLORS.OVERLAY,
    justifyContent: 'center',
    alignItems: 'center',
  },
  groupPickerModal: {
    backgroundColor: COLORS.SURFACE,
    borderRadius: 12,
    padding: SPACING.LG,
    width: '80%',
    maxHeight: '60%',
  },
  groupPickerTitle: {
    fontSize: FONT_SIZES.LG,
    fontWeight: 'bold',
    color: COLORS.TEXT.PRIMARY,
    marginBottom: SPACING.MD,
    textAlign: 'center',
  },
  groupList: {
    maxHeight: 200,
  },
  groupItem: {
    padding: SPACING.MD,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.BORDER,
  },
  groupName: {
    fontSize: FONT_SIZES.MD,
    fontWeight: '600',
    color: COLORS.TEXT.PRIMARY,
  },
  groupType: {
    fontSize: FONT_SIZES.SM,
    color: COLORS.TEXT.SECONDARY,
    marginTop: 2,
  },
  emptyGroupContainer: {
    padding: SPACING.XL,
    alignItems: 'center',
  },
  emptyGroupText: {
    fontSize: FONT_SIZES.MD,
    color: COLORS.TEXT.SECONDARY,
    textAlign: 'center',
  },
  cancelButton: {
    marginTop: SPACING.MD,
    padding: SPACING.MD,
    backgroundColor: COLORS.TEXT.LIGHT,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: FONT_SIZES.MD,
    color: COLORS.TEXT.PRIMARY,
  },
});