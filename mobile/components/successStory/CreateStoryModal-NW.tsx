import React, { useState } from 'react';
import {
  View,
  Text,
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
        className="modalContainer"
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View className="modalContent">
          <LinearGradient
            colors={['#FF6B6B', '#FF8E53']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            className="header"
          >
            <View className="headerContent">
              <View>
                <Text className="headerTitle">💑 매칭 성공 스토리</Text>
                <Text className="headerSubtitle">
                  {matchInfo.partnerNickname}님과의 특별한 순간을 공유해주세요
                </Text>
              </View>
              <TouchableOpacity onPress={onClose} className="closeButton">
                <Icon name="close" size={24} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          </LinearGradient>

          <ScrollView className="scrollContent" showsVerticalScrollIndicator={false}>
            {/* 스토리 입력 */}
            <View className="section">
              <Text className="sectionTitle">
                우리의 이야기 <Text style={{ color: colors.ERROR }}>*</Text>
              </Text>
              <TextInput
                className="storyInput"
                placeholder="어떻게 만나게 되었나요? 첫 인상은 어땠나요? 특별했던 순간을 자유롭게 작성해주세요."
                placeholderTextColor={colors.TEXT.TERTIARY}
                multiline
                maxLength={500}
                value={story}
                onChangeText={setStory}
                textAlignVertical="top"
              />
              <Text className="charCount">
                {story.length}/500
              </Text>
            </View>

            {/* 태그 선택 */}
            <View className="section">
              <Text className="sectionTitle">
                우리 사이를 표현하는 태그 <Text style={{ color: colors.ERROR }}>*</Text>
              </Text>
              <Text className="sectionHint">
                최대 3개까지 선택 가능
              </Text>
              <View className="tagContainer">
                {availableTags.map((tag) => (
                  <TouchableOpacity
                    key={tag}
                    className="tag"
                    onPress={() => toggleTag(tag)}
                  >
                    <Text
                      className="tagText"
                    >
                      {tag}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* 익명 설정 */}
            <View className="section">
              <TouchableOpacity
                className="anonymousOption"
                onPress={() => setIsAnonymous(!isAnonymous)}
              >
                <View className="checkboxContainer">
                  <View
                    className="checkbox"
                  >
                    {isAnonymous && (
                      <Icon name="checkmark" size={16} color="#FFFFFF" />
                    )}
                  </View>
                  <Text className="anonymousText">
                    익명으로 작성하기
                  </Text>
                </View>
                <Text className="anonymousHint">
                  닉네임 대신 '행복한 커플'로 표시됩니다
                </Text>
              </TouchableOpacity>
            </View>

            {/* 안내 메시지 */}
            <View className="infoBox">
              <Icon name="information-circle" size={20} color={colors.INFO} />
              <Text className="infoText">
                작성하신 스토리는 다른 사용자들에게 공개되며, 일주일 동안 표시됩니다.
                부적절한 내용은 관리자에 의해 삭제될 수 있습니다.
              </Text>
            </View>
          </ScrollView>

          {/* 하단 버튼 */}
          <View className="footer">
            <TouchableOpacity
              className="cancelButton"
              onPress={onClose}
            >
              <Text className="cancelButtonText">
                취소
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              className="submitButton"
              onPress={handleSubmit}
              disabled={loading || story.trim().length < 20 || selectedTags.length === 0}
            >
              <Text className="submitButtonText">
                {loading ? '등록 중...' : '스토리 공유하기'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

