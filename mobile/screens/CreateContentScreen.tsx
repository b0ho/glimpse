import React, { useState } from 'react';
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
import * as ImagePicker from 'expo-image-picker';
import { useAuthStore } from '@/store/slices/authSlice';
import { useGroupStore } from '@/store/slices/groupSlice';
import { Group, Content } from '@/types';
import { COLORS, SPACING, FONT_SIZES } from '@/utils/constants';

export const CreateContentScreen: React.FC = () => {
  const [contentText, setContentText] = useState('');
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showGroupPicker, setShowGroupPicker] = useState(false);
  
  const navigation = useNavigation();
  const authStore = useAuthStore();
  const groupStore = useGroupStore();

  const handleImagePicker = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
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

    if (!result.canceled && result.assets) {
      const newImages = result.assets.map(asset => asset.uri);
      setSelectedImages(prev => [...prev, ...newImages].slice(0, 5));
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
      Alert.alert('내용 입력', '텍스트를 입력하거나 이미지를 선택해주세요.');
      return;
    }

    if (!selectedGroup) {
      Alert.alert('그룹 선택', '게시할 그룹을 선택해주세요.');
      return;
    }

    setIsSubmitting(true);
    try {
      // 실제로는 API 호출
      await new Promise(resolve => setTimeout(resolve, 1500));

      const newContent: Content = {
        id: `content_${Date.now()}`,
        authorId: authStore.user?.id || 'current_user',
        authorNickname: authStore.user?.nickname || '익명사용자',
        groupId: selectedGroup.id,
        type: selectedImages.length > 0 ? 'image' : 'text',
        text: contentText.trim() || undefined,
        imageUrls: selectedImages.length > 0 ? selectedImages : undefined,
        likeCount: 0,
        isLikedByUser: false,
        createdAt: new Date(),
      };

      // TODO: 실제로는 서버에 저장하고 홈 피드 새로고침
      console.log('Created content:', newContent);

      Alert.alert(
        '게시물 작성 완료! 🎉',
        `"${selectedGroup.name}" 그룹에 게시물이 성공적으로 작성되었습니다.`,
        [
          {
            text: '확인',
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } catch (error) {
      console.error('Content submission error:', error);
      Alert.alert('오류', '게시물 작성 중 오류가 발생했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderGroupPicker = () => {
    if (!showGroupPicker) return null;

    return (
      <View style={styles.groupPickerOverlay}>
        <View style={styles.groupPickerModal}>
          <Text style={styles.groupPickerTitle}>그룹 선택</Text>
          <ScrollView style={styles.groupList}>
            {groupStore.joinedGroups.map(group => (
              <TouchableOpacity
                key={group.id}
                style={styles.groupItem}
                onPress={() => handleGroupSelect(group)}
              >
                <Text style={styles.groupName}>{group.name}</Text>
                <Text style={styles.groupType}>{group.type}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => setShowGroupPicker(false)}
          >
            <Text style={styles.cancelButtonText}>취소</Text>
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
          선택된 이미지 ({selectedImages.length}/5)
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
          <Text style={styles.headerButtonText}>취소</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>새 게시물</Text>
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
            <Text style={styles.submitButtonText}>게시</Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.groupSelector}>
          <Text style={styles.sectionLabel}>게시할 그룹</Text>
          <TouchableOpacity
            style={styles.groupSelectorButton}
            onPress={() => setShowGroupPicker(true)}
          >
            <Text style={styles.groupSelectorText}>
              {selectedGroup ? selectedGroup.name : '그룹을 선택해주세요'}
            </Text>
            <Text style={styles.groupSelectorArrow}>{'>'}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.textInputContainer}>
          <Text style={styles.sectionLabel}>내용</Text>
          <TextInput
            style={styles.textInput}
            placeholder="무슨 일이 일어나고 있나요?"
            placeholderTextColor={COLORS.TEXT.LIGHT}
            value={contentText}
            onChangeText={setContentText}
            multiline
            maxLength={500}
            textAlignVertical="top"
          />
          <Text style={styles.characterCount}>
            {contentText.length}/500
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
              사진 추가 ({selectedImages.length}/5)
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.guidelines}>
          <Text style={styles.guidelinesTitle}>게시물 작성 가이드라인</Text>
          <Text style={styles.guidelinesText}>
            • 익명성을 유지하기 위해 개인정보가 포함된 내용은 피해주세요{'\n'}
            • 존중과 예의를 지켜주세요{'\n'}
            • 부적절한 내용은 삭제될 수 있습니다{'\n'}
            • 이미지는 최대 5개까지 업로드 가능합니다
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