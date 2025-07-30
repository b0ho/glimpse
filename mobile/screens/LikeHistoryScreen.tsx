import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  FlatList,
  TouchableOpacity,
  Alert,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { useAuthStore } from '@/store/slices/authSlice';
import { useLikeStore } from '@/store/slices/likeSlice';
import { COLORS, SPACING, TYPOGRAPHY } from '@/utils/constants';
import { Like, AppMode, MODE_TEXTS } from '@shared/types';

export const LikeHistoryScreen = () => {
  const navigation = useNavigation();
  const { currentMode } = useAuthStore();
  const {
    sentLikes,
    isLoading,
    error,
    cancelLike,
    deleteLikeHistory,
    refreshLikes,
  } = useLikeStore();

  const [refreshing, setRefreshing] = useState(false);
  const [selectedLikes, setSelectedLikes] = useState<string[]>([]);
  const [isSelectionMode, setIsSelectionMode] = useState(false);

  const modeTexts = MODE_TEXTS[currentMode || AppMode.DATING];

  useEffect(() => {
    // 화면 진입 시 좋아요 목록 새로고침
    handleRefresh();
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await refreshLikes();
    } finally {
      setRefreshing(false);
    }
  };

  const handleCancelLike = (likeId: string) => {
    const like = sentLikes.find(l => l.id === likeId);
    if (!like) return;

    const targetUser = like.toUserId; // 실제로는 닉네임 가져와야 함
    const actionText = currentMode === AppMode.DATING ? '호감있어요' : '친해지고 싶어요';

    Alert.alert(
      `${actionText} 취소`,
      `이 사용자에게 보낸 ${actionText}를 취소하시겠습니까?\n\n취소 후 2주간 다시 보낼 수 없습니다.`,
      [
        { text: '아니오', style: 'cancel' },
        {
          text: '취소하기',
          style: 'destructive',
          onPress: async () => {
            const success = await cancelLike(likeId);
            if (success) {
              Alert.alert('완료', `${actionText}가 취소되었습니다.`);
            } else {
              Alert.alert('오류', `취소에 실패했습니다: ${error}`);
            }
          },
        },
      ]
    );
  };

  const handleDeleteHistory = () => {
    if (selectedLikes.length === 0) {
      Alert.alert('알림', '삭제할 항목을 선택해주세요.');
      return;
    }

    Alert.alert(
      '이력 삭제',
      `선택한 ${selectedLikes.length}개의 이력을 삭제하시겠습니까?\n\n삭제된 이력은 복구할 수 없습니다.`,
      [
        { text: '취소', style: 'cancel' },
        {
          text: '삭제',
          style: 'destructive',
          onPress: async () => {
            const success = await deleteLikeHistory(selectedLikes);
            if (success) {
              Alert.alert('완료', '선택한 이력이 삭제되었습니다.');
              setSelectedLikes([]);
              setIsSelectionMode(false);
            } else {
              Alert.alert('오류', '삭제에 실패했습니다.');
            }
          },
        },
      ]
    );
  };

  const toggleSelection = (likeId: string) => {
    setSelectedLikes(prev => {
      if (prev.includes(likeId)) {
        return prev.filter(id => id !== likeId);
      } else {
        return [...prev, likeId];
      }
    });
  };

  const renderLikeItem = ({ item }: { item: Like }) => {
    const isSelected = selectedLikes.includes(item.id);
    const canCancel = new Date().getTime() - new Date(item.createdAt).getTime() < 24 * 60 * 60 * 1000; // 24시간 이내

    return (
      <TouchableOpacity
        style={[
          styles.likeItem,
          isSelected && styles.likeItemSelected,
        ]}
        onPress={() => {
          if (isSelectionMode) {
            toggleSelection(item.id);
          }
        }}
        onLongPress={() => {
          setIsSelectionMode(true);
          toggleSelection(item.id);
        }}
      >
        <View style={styles.likeContent}>
          {isSelectionMode && (
            <View style={styles.checkbox}>
              {isSelected && (
                <Ionicons name="checkmark" size={16} color={COLORS.primary} />
              )}
            </View>
          )}
          
          <View style={styles.userInfo}>
            <View style={styles.userAvatar}>
              <Text style={styles.userAvatarText}>?</Text>
            </View>
            <View style={styles.userDetails}>
              <Text style={styles.userName}>익명 사용자</Text>
              <Text style={styles.groupName}>그룹: {item.groupId}</Text>
              <Text style={styles.likeDate}>
                {format(new Date(item.createdAt), 'M월 d일 HH:mm', { locale: ko })}
              </Text>
            </View>
          </View>

          <View style={styles.likeActions}>
            {item.isSuper && (
              <View style={styles.superLikeBadge}>
                <Ionicons name="star" size={14} color={COLORS.WARNING} />
                <Text style={styles.superLikeText}>슈퍼</Text>
              </View>
            )}
            
            {canCancel && !isSelectionMode && (
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => handleCancelLike(item.id)}
              >
                <Text style={styles.cancelButtonText}>취소</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons 
        name={currentMode === AppMode.DATING ? "heart-outline" : "people-outline"} 
        size={64} 
        color={COLORS.textSecondary} 
      />
      <Text style={styles.emptyTitle}>
        {currentMode === AppMode.DATING 
          ? '보낸 호감이 없습니다' 
          : '보낸 친구 요청이 없습니다'
        }
      </Text>
      <Text style={styles.emptyDescription}>
        {currentMode === AppMode.DATING
          ? '관심있는 사람에게 호감을 표시해보세요!'
          : '새로운 친구에게 친구 요청을 보내보세요!'
        }
      </Text>
    </View>
  );

  const renderHeader = () => (
    <View style={styles.header}>
      <TouchableOpacity
        onPress={() => navigation.goBack()}
        style={styles.backButton}
      >
        <Ionicons name="arrow-back" size={24} color={COLORS.text} />
      </TouchableOpacity>
      
      <Text style={styles.headerTitle}>
        {currentMode === AppMode.DATING ? '호감 관리' : '친구 요청 관리'}
      </Text>
      
      {isSelectionMode ? (
        <View style={styles.headerActions}>
          <TouchableOpacity
            onPress={() => {
              setSelectedLikes([]);
              setIsSelectionMode(false);
            }}
            style={styles.headerAction}
          >
            <Text style={styles.cancelText}>취소</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            onPress={handleDeleteHistory}
            style={styles.headerAction}
          >
            <Ionicons name="trash-outline" size={20} color={COLORS.ERROR} />
          </TouchableOpacity>
        </View>
      ) : (
        <TouchableOpacity
          onPress={() => setIsSelectionMode(true)}
          style={styles.selectButton}
        >
          <Text style={styles.selectText}>선택</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {renderHeader()}
      
      {isLoading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : (
        <FlatList
          data={sentLikes}
          keyExtractor={(item) => item.id}
          renderItem={renderLikeItem}
          ListEmptyComponent={renderEmptyState}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={[COLORS.primary]}
            />
          }
          contentContainerStyle={[
            styles.listContent,
            sentLikes.length === 0 && styles.emptyListContent,
          ]}
        />
      )}
      
      {isSelectionMode && selectedLikes.length > 0 && (
        <View style={styles.selectionBar}>
          <Text style={styles.selectionText}>
            {selectedLikes.length}개 선택됨
          </Text>
        </View>
      )}
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
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray200,
  },
  backButton: {
    padding: SPACING.xs,
  },
  headerTitle: {
    ...TYPOGRAPHY.h2,
    color: COLORS.text,
    flex: 1,
    textAlign: 'center',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  headerAction: {
    padding: SPACING.xs,
  },
  selectButton: {
    padding: SPACING.xs,
  },
  selectText: {
    ...TYPOGRAPHY.body,
    color: COLORS.primary,
    fontWeight: '600',
  },
  cancelText: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    paddingVertical: SPACING.sm,
  },
  emptyListContent: {
    flex: 1,
  },
  likeItem: {
    backgroundColor: COLORS.white,
    marginHorizontal: SPACING.md,
    marginVertical: SPACING.xs,
    borderRadius: 12,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.gray200,
  },
  likeItemSelected: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primary + '05',
  },
  likeContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: COLORS.primary,
    marginRight: SPACING.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  userInfo: {
    flexDirection: 'row',
    flex: 1,
    alignItems: 'center',
  },
  userAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.gray200,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.sm,
  },
  userAvatarText: {
    ...TYPOGRAPHY.h3,
    color: COLORS.textSecondary,
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    ...TYPOGRAPHY.body,
    color: COLORS.text,
    fontWeight: '600',
    marginBottom: 2,
  },
  groupName: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    marginBottom: 2,
  },
  likeDate: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
  },
  likeActions: {
    alignItems: 'flex-end',
    gap: SPACING.xs,
  },
  superLikeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.WARNING + '20',
    paddingHorizontal: SPACING.xs,
    paddingVertical: 2,
    borderRadius: 12,
    gap: 2,
  },
  superLikeText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.WARNING,
    fontWeight: '600',
  },
  cancelButton: {
    backgroundColor: COLORS.ERROR + '10',
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: 6,
  },
  cancelButtonText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.ERROR,
    fontWeight: '600',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING.xl,
  },
  emptyTitle: {
    ...TYPOGRAPHY.h3,
    color: COLORS.text,
    marginTop: SPACING.md,
    marginBottom: SPACING.xs,
  },
  emptyDescription: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  selectionBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.md,
  },
  selectionText: {
    ...TYPOGRAPHY.body,
    color: COLORS.white,
    fontWeight: '600',
    textAlign: 'center',
  },
});