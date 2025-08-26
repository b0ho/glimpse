import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
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
import { COLORS, SPACING, FONT_SIZES } from '@/utils/constants';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAndroidSafeTranslation } from '@/hooks/useAndroidSafeTranslation';

interface Feedback {
  id: string;
  content: string;
  voteCount: number;
  hasVoted: boolean;
  createdAt: Date;
}

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
    const updated = feedbacks.map(f => {
      if (f.id === feedbackId) {
        if (f.hasVoted) {
          return { ...f, voteCount: f.voteCount - 1, hasVoted: false };
        } else {
          return { ...f, voteCount: f.voteCount + 1, hasVoted: true };
        }
      }
      return f;
    });
    
    setFeedbacks(updated);
    await AsyncStorage.setItem('support_feedbacks', JSON.stringify(updated));
  };

  const handleSubmitFeedback = async () => {
    if (!newFeedback.trim()) {
      Alert.alert(t('support:alerts.emailTitle'), t('support:alerts.contentRequired'));
      return;
    }

    const feedback: Feedback = {
      id: Date.now().toString(),
      content: newFeedback,
      voteCount: 0,
      hasVoted: false,
      createdAt: new Date(),
    };

    const updated = [feedback, ...feedbacks];
    setFeedbacks(updated);
    await AsyncStorage.setItem('support_feedbacks', JSON.stringify(updated));
    
    setNewFeedback('');
    setShowCreateModal(false);
    Alert.alert(t('support:alerts.emailTitle'), t('support:alerts.thankYou'));
  };

  const getFilteredAndSortedFeedbacks = () => {
    let filtered = feedbacks;
    
    if (searchQuery) {
      filtered = filtered.filter(f => 
        f.content.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (sortBy === 'popular') {
      return [...filtered].sort((a, b) => b.voteCount - a.voteCount);
    } else {
      return [...filtered].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    }
  };

  const renderFeedbackItem = ({ item, index }: { item: Feedback; index: number }) => (
    <View style={[styles.feedbackCard, { backgroundColor: colors.SURFACE }]}>
      <View style={styles.feedbackHeader}>
        {sortBy === 'popular' && (
          <View style={[styles.rankBadge, { 
            backgroundColor: index < 3 ? colors.WARNING : colors.BACKGROUND 
          }]}>
            <Text style={[styles.rankText, { 
              color: index < 3 ? '#FFFFFF' : colors.TEXT.SECONDARY 
            }]}>
              {t('support:feedback.rank', { rank: index + 1 })}
            </Text>
          </View>
        )}
        <TouchableOpacity
          style={[styles.voteButton, { 
            backgroundColor: item.hasVoted ? colors.PRIMARY : colors.BACKGROUND,
            borderColor: item.hasVoted ? colors.PRIMARY : colors.BORDER,
          }]}
          onPress={() => handleVote(item.id)}
        >
          <Icon 
            name={item.hasVoted ? "heart" : "heart-outline"} 
            size={20} 
            color={item.hasVoted ? '#FFFFFF' : colors.PRIMARY} 
          />
          <Text style={[styles.voteCount, { 
            color: item.hasVoted ? '#FFFFFF' : colors.TEXT.PRIMARY 
          }]}>
            {item.voteCount}
          </Text>
        </TouchableOpacity>
      </View>
      
      <Text style={[styles.feedbackContent, { color: colors.TEXT.PRIMARY }]}>
        {item.content}
      </Text>
      
      <Text style={[styles.feedbackDate, { color: colors.TEXT.TERTIARY }]}>
        {item.createdAt.toLocaleDateString('ko-KR')}
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.BACKGROUND }]}>
      <View style={[styles.header, { backgroundColor: colors.SURFACE, borderBottomColor: colors.BORDER }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Icon name="arrow-back" size={24} color={colors.TEXT.PRIMARY} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.TEXT.PRIMARY }]}>{t('support:title')}</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* 상단 안내 */}
        <View style={[styles.infoSection, { backgroundColor: colors.INFO + '10' }]}>
          <Icon name="information-circle" size={24} color={colors.INFO} />
          <View style={styles.infoContent}>
            <Text style={[styles.infoTitle, { color: colors.TEXT.PRIMARY }]}>
              {t('support:info.title')}
            </Text>
            <Text style={[styles.infoText, { color: colors.TEXT.SECONDARY }]}>
              {t('support:info.description')}
            </Text>
          </View>
        </View>

        {/* 이메일 문의 */}
        <TouchableOpacity 
          style={[styles.emailSection, { backgroundColor: colors.SURFACE }]}
          onPress={() => Alert.alert(t('support:alerts.emailTitle'), t('support:alerts.emailMessage'))}
        >
          <Icon name="mail-outline" size={24} color={colors.PRIMARY} />
          <View style={styles.emailContent}>
            <Text style={[styles.emailTitle, { color: colors.TEXT.PRIMARY }]}>
              {t('support:contact.title')}
            </Text>
            <Text style={[styles.emailAddress, { color: colors.PRIMARY }]}>
              {t('support:contact.email')}
            </Text>
          </View>
          <Icon name="chevron-forward" size={20} color={colors.TEXT.SECONDARY} />
        </TouchableOpacity>

        {/* 검색 및 정렬 */}
        <View style={styles.controlSection}>
          <View style={[styles.searchContainer, { 
            backgroundColor: colors.SURFACE,
            borderColor: colors.BORDER,
          }]}>
            <Icon name="search" size={20} color={colors.TEXT.SECONDARY} />
            <TextInput
              style={[styles.searchInput, { color: colors.TEXT.PRIMARY }]}
              placeholder={t('support:search.placeholder')}
              placeholderTextColor={colors.TEXT.SECONDARY}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
          
          <View style={styles.sortButtons}>
            <TouchableOpacity
              style={[styles.sortButton, 
                sortBy === 'popular' && { backgroundColor: colors.PRIMARY }
              ]}
              onPress={() => setSortBy('popular')}
            >
              <Text style={[styles.sortButtonText, { 
                color: sortBy === 'popular' ? '#FFFFFF' : colors.TEXT.SECONDARY 
              }]}>
                {t('support:sort.popular')}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.sortButton, 
                sortBy === 'recent' && { backgroundColor: colors.PRIMARY }
              ]}
              onPress={() => setSortBy('recent')}
            >
              <Text style={[styles.sortButtonText, { 
                color: sortBy === 'recent' ? '#FFFFFF' : colors.TEXT.SECONDARY 
              }]}>
                {t('support:sort.recent')}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* 피드백 목록 */}
        <View style={styles.feedbackSection}>
          <Text style={[styles.sectionTitle, { color: colors.TEXT.PRIMARY }]}>
            {t('support:feedback.sectionTitle')}
          </Text>
          
          {isLoading ? (
            <ActivityIndicator size="large" color={colors.PRIMARY} />
          ) : (
            <FlatList
              data={getFilteredAndSortedFeedbacks()}
              renderItem={renderFeedbackItem}
              keyExtractor={item => item.id}
              scrollEnabled={false}
              ListEmptyComponent={
                <Text style={[styles.emptyText, { color: colors.TEXT.SECONDARY }]}>
                  {t('support:feedback.emptyState')}
                </Text>
              }
            />
          )}
        </View>
      </ScrollView>

      {/* 요청사항 작성 버튼 */}
      <TouchableOpacity
        style={[styles.fab, { backgroundColor: colors.PRIMARY }]}
        onPress={() => setShowCreateModal(true)}
      >
        <Icon name="add" size={28} color="#FFFFFF" />
      </TouchableOpacity>

      {/* 작성 모달 */}
      <Modal
        visible={showCreateModal}
        animationType="slide"
        transparent={true}
      >
        <KeyboardAvoidingView 
          style={styles.modalContainer}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <View style={[styles.modalContent, { backgroundColor: colors.SURFACE }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.TEXT.PRIMARY }]}>
                {t('support:modal.title')}
              </Text>
              <TouchableOpacity onPress={() => setShowCreateModal(false)}>
                <Icon name="close" size={24} color={colors.TEXT.PRIMARY} />
              </TouchableOpacity>
            </View>
            
            <TextInput
              style={[styles.feedbackInput, { 
                backgroundColor: colors.BACKGROUND,
                color: colors.TEXT.PRIMARY,
                borderColor: colors.BORDER,
              }]}
              placeholder={t('support:modal.placeholder')}
              placeholderTextColor={colors.TEXT.SECONDARY}
              value={newFeedback}
              onChangeText={setNewFeedback}
              multiline
              maxLength={200}
              textAlignVertical="top"
            />
            
            <Text style={[styles.charCount, { color: colors.TEXT.SECONDARY }]}>
              {t('support:modal.charCount', { count: newFeedback.length })}
            </Text>
            
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: colors.BACKGROUND }]}
                onPress={() => setShowCreateModal(false)}
              >
                <Text style={[styles.modalButtonText, { color: colors.TEXT.PRIMARY }]}>
                  {t('support:modal.cancel')}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: colors.PRIMARY }]}
                onPress={handleSubmitFeedback}
              >
                <Text style={[styles.modalButtonText, { color: '#FFFFFF' }]}>
                  {t('support:modal.submit')}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.MD,
    paddingVertical: SPACING.SM,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: SPACING.SM,
  },
  headerTitle: {
    fontSize: FONT_SIZES.LG,
    fontWeight: '600',
  },
  headerRight: {
    width: 40,
  },
  infoSection: {
    flexDirection: 'row',
    margin: SPACING.MD,
    padding: SPACING.MD,
    borderRadius: 12,
  },
  infoContent: {
    flex: 1,
    marginLeft: SPACING.SM,
  },
  infoTitle: {
    fontSize: FONT_SIZES.MD,
    fontWeight: '600',
    marginBottom: SPACING.XS,
  },
  infoText: {
    fontSize: FONT_SIZES.SM,
    lineHeight: 20,
  },
  emailSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: SPACING.MD,
    marginBottom: SPACING.MD,
    padding: SPACING.MD,
    borderRadius: 12,
  },
  emailContent: {
    flex: 1,
    marginLeft: SPACING.MD,
  },
  emailTitle: {
    fontSize: FONT_SIZES.SM,
    marginBottom: 2,
  },
  emailAddress: {
    fontSize: FONT_SIZES.MD,
    fontWeight: '600',
  },
  controlSection: {
    marginHorizontal: SPACING.MD,
    marginBottom: SPACING.MD,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.MD,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    marginBottom: SPACING.SM,
  },
  searchInput: {
    flex: 1,
    marginLeft: SPACING.SM,
    fontSize: FONT_SIZES.MD,
  },
  sortButtons: {
    flexDirection: 'row',
    gap: SPACING.SM,
  },
  sortButton: {
    paddingHorizontal: SPACING.MD,
    paddingVertical: SPACING.SM,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.BORDER,
  },
  sortButtonText: {
    fontSize: FONT_SIZES.SM,
    fontWeight: '500',
  },
  feedbackSection: {
    marginHorizontal: SPACING.MD,
    marginBottom: SPACING.XL * 3,
  },
  sectionTitle: {
    fontSize: FONT_SIZES.LG,
    fontWeight: '600',
    marginBottom: SPACING.MD,
  },
  feedbackCard: {
    padding: SPACING.MD,
    borderRadius: 12,
    marginBottom: SPACING.MD,
  },
  feedbackHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.SM,
  },
  rankBadge: {
    paddingHorizontal: SPACING.SM,
    paddingVertical: 4,
    borderRadius: 12,
  },
  rankText: {
    fontSize: FONT_SIZES.XS,
    fontWeight: '600',
  },
  voteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.MD,
    paddingVertical: SPACING.SM,
    borderRadius: 20,
    borderWidth: 1,
    gap: SPACING.XS,
  },
  voteCount: {
    fontSize: FONT_SIZES.SM,
    fontWeight: '600',
  },
  feedbackContent: {
    fontSize: FONT_SIZES.MD,
    lineHeight: 22,
    marginBottom: SPACING.SM,
  },
  feedbackDate: {
    fontSize: FONT_SIZES.XS,
  },
  emptyText: {
    fontSize: FONT_SIZES.MD,
    textAlign: 'center',
    padding: SPACING.XL,
  },
  fab: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: SPACING.LG,
    paddingBottom: SPACING.XL,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.MD,
  },
  modalTitle: {
    fontSize: FONT_SIZES.LG,
    fontWeight: '600',
  },
  feedbackInput: {
    height: 120,
    borderRadius: 12,
    padding: SPACING.MD,
    borderWidth: 1,
    fontSize: FONT_SIZES.MD,
  },
  charCount: {
    fontSize: FONT_SIZES.SM,
    textAlign: 'right',
    marginTop: SPACING.XS,
    marginBottom: SPACING.MD,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: SPACING.SM,
  },
  modalButton: {
    flex: 1,
    paddingVertical: SPACING.MD,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalButtonText: {
    fontSize: FONT_SIZES.MD,
    fontWeight: '600',
  },
});