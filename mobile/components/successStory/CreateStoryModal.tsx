import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { IconWrapper as Icon } from '@/components/IconWrapper';
import { useTheme } from '@/hooks/useTheme';
import { LinearGradient } from 'expo-linear-gradient';

interface CreateStoryModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (story: string, tags: string[], isAnonymous: boolean) => void;
  matchInfo: {
    partnerNickname: string;
    matchId: string;
  };
}

export const CreateStoryModal: React.FC<CreateStoryModalProps> = ({
  visible,
  onClose,
  onSubmit,
  matchInfo,
}) => {
  const { colors } = useTheme();
  const [story, setStory] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [loading, setLoading] = useState(false);

  const availableTags = [
    '첫눈에 반함 💕',
    '운명적 만남 ✨',
    '취미 공유 🎨',
    '대화가 잘 통해요 💬',
    '성격이 잘 맞아요 😊',
    '가치관이 비슷해요 🤝',
    '웃음코드가 같아요 😂',
    '서로 배려해요 💝',
  ];

  const toggleTag = (tag: string) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter(t => t !== tag));
    } else if (selectedTags.length < 3) {
      setSelectedTags([...selectedTags, tag]);
    } else {
      Alert.alert('알림', '태그는 최대 3개까지 선택 가능합니다.');
    }
  };

  const handleSubmit = async () => {
    if (story.trim().length < 20) {
      Alert.alert('알림', '후기는 최소 20자 이상 작성해주세요.');
      return;
    }

    if (selectedTags.length === 0) {
      Alert.alert('알림', '최소 1개 이상의 태그를 선택해주세요.');
      return;
    }

    setLoading(true);
    try {
      await onSubmit(story.trim(), selectedTags, isAnonymous);
      Alert.alert('축하합니다! 🎉', '매칭 성공 스토리가 등록되었습니다.');
      setStory('');
      setSelectedTags([]);
      setIsAnonymous(false);
      onClose();
    } catch (error) {
      Alert.alert('오류', '스토리 등록에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        style={styles.modalContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={[styles.modalContent, { backgroundColor: colors.SURFACE }]}>
          <LinearGradient
            colors={['#FF6B6B', '#FF8E53']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.header}
          >
            <View style={styles.headerContent}>
              <View>
                <Text style={styles.headerTitle}>💑 매칭 성공 스토리</Text>
                <Text style={styles.headerSubtitle}>
                  {matchInfo.partnerNickname}님과의 특별한 순간을 공유해주세요
                </Text>
              </View>
              <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <Icon name="close" size={24} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          </LinearGradient>

          <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false}>
            {/* 스토리 입력 */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.TEXT.PRIMARY }]}>
                우리의 이야기 <Text style={{ color: colors.ERROR }}>*</Text>
              </Text>
              <TextInput
                style={[
                  styles.storyInput,
                  { 
                    color: colors.TEXT.PRIMARY,
                    backgroundColor: colors.BACKGROUND,
                    borderColor: colors.BORDER,
                  }
                ]}
                placeholder="어떻게 만나게 되었나요? 첫 인상은 어땠나요? 특별했던 순간을 자유롭게 작성해주세요."
                placeholderTextColor={colors.TEXT.TERTIARY}
                multiline
                maxLength={500}
                value={story}
                onChangeText={setStory}
                textAlignVertical="top"
              />
              <Text style={[styles.charCount, { color: colors.TEXT.SECONDARY }]}>
                {story.length}/500
              </Text>
            </View>

            {/* 태그 선택 */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.TEXT.PRIMARY }]}>
                우리 사이를 표현하는 태그 <Text style={{ color: colors.ERROR }}>*</Text>
              </Text>
              <Text style={[styles.sectionHint, { color: colors.TEXT.SECONDARY }]}>
                최대 3개까지 선택 가능
              </Text>
              <View style={styles.tagContainer}>
                {availableTags.map((tag) => (
                  <TouchableOpacity
                    key={tag}
                    style={[
                      styles.tag,
                      {
                        backgroundColor: selectedTags.includes(tag) 
                          ? colors.PRIMARY 
                          : colors.BACKGROUND,
                        borderColor: selectedTags.includes(tag) 
                          ? colors.PRIMARY 
                          : colors.BORDER,
                      }
                    ]}
                    onPress={() => toggleTag(tag)}
                  >
                    <Text
                      style={[
                        styles.tagText,
                        {
                          color: selectedTags.includes(tag) 
                            ? '#FFFFFF' 
                            : colors.TEXT.PRIMARY,
                        }
                      ]}
                    >
                      {tag}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* 익명 설정 */}
            <View style={styles.section}>
              <TouchableOpacity
                style={styles.anonymousOption}
                onPress={() => setIsAnonymous(!isAnonymous)}
              >
                <View style={styles.checkboxContainer}>
                  <View
                    style={[
                      styles.checkbox,
                      {
                        backgroundColor: isAnonymous ? colors.PRIMARY : colors.BACKGROUND,
                        borderColor: isAnonymous ? colors.PRIMARY : colors.BORDER,
                      }
                    ]}
                  >
                    {isAnonymous && (
                      <Icon name="checkmark" size={16} color="#FFFFFF" />
                    )}
                  </View>
                  <Text style={[styles.anonymousText, { color: colors.TEXT.PRIMARY }]}>
                    익명으로 작성하기
                  </Text>
                </View>
                <Text style={[styles.anonymousHint, { color: colors.TEXT.SECONDARY }]}>
                  닉네임 대신 '행복한 커플'로 표시됩니다
                </Text>
              </TouchableOpacity>
            </View>

            {/* 안내 메시지 */}
            <View style={[styles.infoBox, { backgroundColor: colors.INFO + '10' }]}>
              <Icon name="information-circle" size={20} color={colors.INFO} />
              <Text style={[styles.infoText, { color: colors.TEXT.SECONDARY }]}>
                작성하신 스토리는 다른 사용자들에게 공개되며, 일주일 동안 표시됩니다.
                부적절한 내용은 관리자에 의해 삭제될 수 있습니다.
              </Text>
            </View>
          </ScrollView>

          {/* 하단 버튼 */}
          <View style={styles.footer}>
            <TouchableOpacity
              style={[styles.cancelButton, { borderColor: colors.BORDER }]}
              onPress={onClose}
            >
              <Text style={[styles.cancelButtonText, { color: colors.TEXT.SECONDARY }]}>
                취소
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.submitButton,
                { backgroundColor: colors.PRIMARY },
                (loading || story.trim().length < 20 || selectedTags.length === 0) && {
                  opacity: 0.5,
                }
              ]}
              onPress={handleSubmit}
              disabled={loading || story.trim().length < 20 || selectedTags.length === 0}
            >
              <Text style={styles.submitButtonText}>
                {loading ? '등록 중...' : '스토리 공유하기'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
  },
  header: {
    padding: 20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#FFFFFF',
    opacity: 0.9,
  },
  closeButton: {
    padding: 4,
  },
  scrollContent: {
    padding: 20,
    maxHeight: 400,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  sectionHint: {
    fontSize: 12,
    marginBottom: 8,
  },
  storyInput: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    minHeight: 120,
    fontSize: 15,
  },
  charCount: {
    fontSize: 12,
    textAlign: 'right',
    marginTop: 4,
  },
  tagContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -4,
  },
  tag: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    margin: 4,
  },
  tagText: {
    fontSize: 14,
    fontWeight: '500',
  },
  anonymousOption: {
    paddingVertical: 8,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  anonymousText: {
    fontSize: 15,
    fontWeight: '500',
  },
  anonymousHint: {
    fontSize: 12,
    marginTop: 4,
    marginLeft: 30,
  },
  infoBox: {
    flexDirection: 'row',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
    marginLeft: 8,
  },
  footer: {
    flexDirection: 'row',
    padding: 20,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    marginRight: 8,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  submitButton: {
    flex: 2,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});