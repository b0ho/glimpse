/**
 * 사용자 피드백 화면
 *
 * @screen
 * @description 사용자들이 기능 개선 의견을 제출하고 투표할 수 있는 피드백 커뮤니티 화면
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  TextInput,
  FlatList,
  Alert,
  Modal,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useTheme } from '@/hooks/useTheme';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAndroidSafeTranslation } from '@/hooks/useAndroidSafeTranslation';
import { cn } from '@/lib/utils';

/**
 * 피드백 데이터 인터페이스
 *
 * @interface Feedback
 * @property {string} id - 피드백 고유 ID
 * @property {string} content - 피드백 내용
 * @property {number} voteCount - 투표 수
 * @property {boolean} hasVoted - 현재 사용자 투표 여부
 * @property {Date} createdAt - 작성 일시
 */
interface Feedback {
  id: string;
  content: string;
  voteCount: number;
  hasVoted: boolean;
  createdAt: Date;
}

/**
 * 사용자 피드백 화면 컴포넌트
 *
 * @component
 * @returns {JSX.Element}
 *
 * @description
 * 사용자들이 서비스 개선 의견을 자유롭게 제출하고 투표할 수 있는 커뮤니티 화면입니다.
 * - 피드백 목록 조회
 * - 새 피드백 작성
 * - 피드백 투표 (좋아요)
 * - 검색 및 정렬 기능
 *
 * @features
 * - 피드백 검색 (키워드 기반)
 * - 정렬 옵션: 인기순/최신순
 * - 투표 시스템 (토글 가능)
 * - 모달 기반 피드백 작성
 * - AsyncStorage 로컬 저장
 * - 최소 10자 이상 입력 검증
 *
 * @data
 * - 로컬 스토리지 기반 (AsyncStorage)
 * - 샘플 데이터 5개 제공
 * - 실시간 투표 반영
 *
 * @navigation
 * - From: SettingsScreen (설정 화면)
 * - Modal: 피드백 작성 화면
 *
 * @example
 * ```tsx
 * // 설정 화면에서 이동
 * navigation.navigate('Support');
 *
 * // 피드백 작성 모달 열기
 * setShowCreateModal(true);
 * ```
 */
export const SupportScreen = () => {
  const navigation = useNavigation();
  const { colors } = useTheme();
  const { t } = useAndroidSafeTranslation('support');

  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newFeedback, setNewFeedback] = useState('');
  const [sortBy, setSortBy] = useState<'popular' | 'recent'>('popular');

  useEffect(() => {
    loadFeedbacks();
  }, []);

  const loadFeedbacks = async () => {
    setIsLoading(true);
    try {
      // 로컬 스토리지에서 피드백 로드
      const storedFeedbacks = await AsyncStorage.getItem('support_feedbacks');
      if (storedFeedbacks) {
        const parsed = JSON.parse(storedFeedbacks);
        setFeedbacks(parsed.map((f: any) => ({
          ...f,
          createdAt: new Date(f.createdAt),
        })));
      } else {
        // 초기 샘플 데이터
        const sampleFeedbacks: Feedback[] = [
          {
            id: '1',
            content: '프로필에 MBTI 정보를 추가할 수 있으면 좋겠어요',
            voteCount: 45,
            hasVoted: false,
            createdAt: new Date('2025-01-20'),
          },
          {
            id: '2',
            content: '음성 통화 기능이 있으면 좋겠습니다',
            voteCount: 38,
            hasVoted: false,
            createdAt: new Date('2025-01-19'),
          },
          {
            id: '3',
            content: '그룹 내에서 미니 게임을 할 수 있는 기능 추가 요청',
            voteCount: 25,
            hasVoted: false,
            createdAt: new Date('2025-01-18'),
          },
          {
            id: '4',
            content: '다크모드 개선이 필요합니다. 일부 화면이 아직 밝아요',
            voteCount: 22,
            hasVoted: false,
            createdAt: new Date('2025-01-21'),
          },
          {
            id: '5',
            content: '매칭 알고리즘에 취미 가중치를 더 높여주세요',
            voteCount: 18,
            hasVoted: false,
            createdAt: new Date('2025-01-17'),
          },
        ];
        setFeedbacks(sampleFeedbacks);
        await AsyncStorage.setItem('support_feedbacks', JSON.stringify(sampleFeedbacks));
      }
    } catch (error) {
      console.error('Failed to load feedbacks:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVote = async (feedbackId: string) => {
    try {
      const updatedFeedbacks = feedbacks.map(feedback => {
        if (feedback.id === feedbackId) {
          return {
            ...feedback,
            voteCount: feedback.hasVoted ? feedback.voteCount - 1 : feedback.voteCount + 1,
            hasVoted: !feedback.hasVoted,
          };
        }
        return feedback;
      });

      setFeedbacks(updatedFeedbacks);
      await AsyncStorage.setItem('support_feedbacks', JSON.stringify(updatedFeedbacks));
    } catch (error) {
      console.error('Failed to vote:', error);
    }
  };

  const handleCreateFeedback = async () => {
    if (newFeedback.trim().length < 10) {
      Alert.alert('피드백이 너무 짧습니다', '최소 10자 이상 입력해주세요.');
      return;
    }

    try {
      const newFeedbackItem: Feedback = {
        id: Date.now().toString(),
        content: newFeedback.trim(),
        voteCount: 0,
        hasVoted: false,
        createdAt: new Date(),
      };

      const updatedFeedbacks = [newFeedbackItem, ...feedbacks];
      setFeedbacks(updatedFeedbacks);
      await AsyncStorage.setItem('support_feedbacks', JSON.stringify(updatedFeedbacks));

      setNewFeedback('');
      setShowCreateModal(false);
      Alert.alert('피드백이 등록되었습니다', '소중한 의견 감사합니다!');
    } catch (error) {
      console.error('Failed to create feedback:', error);
      Alert.alert('오류', '피드백 등록에 실패했습니다.');
    }
  };

  const filteredFeedbacks = feedbacks
    .filter(feedback =>
      feedback.content.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => {
      if (sortBy === 'popular') {
        return b.voteCount - a.voteCount;
      } else {
        return b.createdAt.getTime() - a.createdAt.getTime();
      }
    });

  const renderFeedbackItem = ({ item }: { item: Feedback }) => (
    <View className="p-4 mb-3 rounded-xl border bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
      <Text className="text-base leading-6 mb-3 text-gray-900 dark:text-white">
        {item.content}
      </Text>

      <View className="flex-row items-center justify-between">
        <Text className="text-xs text-gray-500 dark:text-gray-500">
          {item.createdAt.toLocaleDateString('ko-KR')}
        </Text>

        <TouchableOpacity
          className={cn(
            "flex-row items-center px-3 py-2 rounded-lg",
            item.hasVoted
              ? "bg-blue-50 dark:bg-blue-900/20"
              : "bg-gray-100 dark:bg-gray-800"
          )}
          onPress={() => handleVote(item.id)}
        >
          <Icon
            name={item.hasVoted ? "thumbs-up" : "thumbs-up-outline"}
            size={16}
            color={item.hasVoted ? colors.PRIMARY : colors.TEXT.SECONDARY}
          />
          <Text
            className={cn(
              "text-sm font-medium ml-1",
              item.hasVoted
                ? "text-blue-500"
                : "text-gray-600 dark:text-gray-400"
            )}
          >
            {item.voteCount}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView className="flex-1 bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <View className="flex-row items-center justify-between px-4 py-3 border-b bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="arrow-back" size={24} color={colors.TEXT.PRIMARY} />
        </TouchableOpacity>

        <Text className="text-xl font-semibold text-gray-900 dark:text-white">
          사용자 피드백
        </Text>

        <TouchableOpacity onPress={() => setShowCreateModal(true)}>
          <Icon name="add" size={24} color={colors.PRIMARY} />
        </TouchableOpacity>
      </View>

      {/* Search and Sort */}
      <View className="p-4">
        <View className="flex-row items-center px-4 py-3 rounded-lg mb-3 bg-white dark:bg-gray-800">
          <Icon name="search" size={20} color={colors.TEXT.LIGHT} />
          <TextInput
            className="flex-1 ml-3 text-base text-gray-900 dark:text-white"
            placeholder="피드백 검색..."
            placeholderTextColor={colors.TEXT.LIGHT}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        <View className="flex-row space-x-3">
          <TouchableOpacity
            className={cn(
              "px-4 py-2 rounded-lg",
              sortBy === 'popular'
                ? "bg-blue-500"
                : "bg-white dark:bg-gray-800 opacity-60"
            )}
            onPress={() => setSortBy('popular')}
          >
            <Text
              className={cn(
                "text-sm font-medium",
                sortBy === 'popular'
                  ? "text-white"
                  : "text-gray-900 dark:text-white"
              )}
            >
              인기순
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            className={cn(
              "px-4 py-2 rounded-lg",
              sortBy === 'recent'
                ? "bg-blue-500"
                : "bg-white dark:bg-gray-800 opacity-60"
            )}
            onPress={() => setSortBy('recent')}
          >
            <Text
              className={cn(
                "text-sm font-medium",
                sortBy === 'recent'
                  ? "text-white"
                  : "text-gray-900 dark:text-white"
              )}
            >
              최신순
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Feedback List */}
      {isLoading ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color={colors.PRIMARY} />
        </View>
      ) : (
        <FlatList
          data={filteredFeedbacks}
          renderItem={renderFeedbackItem}
          keyExtractor={item => item.id}
          contentContainerStyle={{ padding: 16 }}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* Create Feedback Modal */}
      <Modal
        visible={showCreateModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView className="flex-1 bg-white dark:bg-gray-900">
          <View className="flex-row items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700">
            <TouchableOpacity onPress={() => setShowCreateModal(false)}>
              <Text className="text-gray-600 dark:text-gray-400">취소</Text>
            </TouchableOpacity>

            <Text className="text-lg font-semibold text-gray-900 dark:text-white">
              피드백 작성
            </Text>

            <TouchableOpacity onPress={handleCreateFeedback}>
              <Text className="font-semibold text-blue-500">
                등록
              </Text>
            </TouchableOpacity>
          </View>

          <KeyboardAvoidingView
            className="flex-1 p-4"
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          >
            <TextInput
              className="flex-1 p-4 rounded-lg text-base bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white"
              placeholder="어떤 기능이 있으면 좋을까요? 자유롭게 의견을 남겨주세요."
              placeholderTextColor={colors.TEXT.LIGHT}
              value={newFeedback}
              onChangeText={setNewFeedback}
              multiline
              style={{ textAlignVertical: 'top' }}
            />
          </KeyboardAvoidingView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
};
