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
import { useAndroidSafeTranslation } from '@/hooks/useAndroidSafeTranslation';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { format } from 'date-fns';
import { ko, enUS } from 'date-fns/locale';
import { useTheme } from '@/hooks/useTheme';
import { useAuthStore } from '@/store/slices/authSlice';
import { useLikeStore } from '@/store/slices/likeSlice';
import { COLORS, SPACING, TYPOGRAPHY } from '@/utils/constants';
import { Like, AppMode, MODE_TEXTS } from '../shared/types';

export const LikeHistoryScreen = () => {
  const navigation = useNavigation();
  const { t, i18n } = useAndroidSafeTranslation('matching');
  const { colors } = useTheme();
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

    Alert.alert(
      currentMode === AppMode.DATING 
        ? t('matching:likeHistory.cancelLikeTitle')
        : t('matching:likeHistory.cancelFriendTitle'),
      currentMode === AppMode.DATING
        ? t('matching:likeHistory.cancelLikeMessage')
        : t('matching:likeHistory.cancelFriendMessage'),
      [
        { text: t('matching:likeHistory.no'), style: 'cancel' },
        {
          text: t('matching:likeHistory.cancelButton'),
          style: 'destructive',
          onPress: async () => {
            const success = await cancelLike(likeId);
            if (success) {
              Alert.alert(
                t('matching:likeHistory.complete'),
                currentMode === AppMode.DATING
                  ? t('matching:likeHistory.likeCancelled')
                  : t('matching:likeHistory.friendRequestCancelled')
              );
            } else {
              Alert.alert(
                t('matching:likeHistory.error'),
                t('matching:likeHistory.cancelFailed', { error })
              );
            }
          },
        },
      ]
    );
  };

  const handleDeleteHistory = () => {
    if (selectedLikes.length === 0) {
      Alert.alert(
        t('matching:likeHistory.notification'),
        t('matching:likeHistory.selectItemsToDelete')
      );
      return;
    }

    Alert.alert(
      t('matching:likeHistory.deleteHistory'),
      t('matching:likeHistory.deleteHistoryMessage', { count: selectedLikes.length }),
      [
        { text: t('matching:likeHistory.cancelAction'), style: 'cancel' },
        {
          text: t('matching:likeHistory.delete'),
          style: 'destructive',
          onPress: async () => {
            const success = await deleteLikeHistory(selectedLikes);
            if (success) {
              Alert.alert(
                t('matching:likeHistory.complete'),
                t('matching:likeHistory.historyDeleted')
              );
              setSelectedLikes([]);
              setIsSelectionMode(false);
            } else {
              Alert.alert(
                t('matching:likeHistory.error'),
                t('matching:likeHistory.deleteFailed')
              );
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
          { backgroundColor: colors.SURFACE, borderColor: colors.BORDER },
          isSelected && [styles.likeItemSelected, { borderColor: colors.PRIMARY, backgroundColor: colors.PRIMARY + '05' }],
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
            <View style={[styles.checkbox, { borderColor: colors.PRIMARY }]}>
              {isSelected && (
                <Ionicons name="checkmark" size={16} color={colors.PRIMARY} />
              )}
            </View>
          )}
          
          <View style={styles.userInfo}>
            <View style={[styles.userAvatar, { backgroundColor: colors.BACKGROUND }]}>
              <Text style={[styles.userAvatarText, { color: colors.TEXT.SECONDARY }]}>?</Text>
            </View>
            <View style={styles.userDetails}>
              <Text style={[styles.userName, { color: colors.TEXT.PRIMARY }]}>{t('matching:likeHistory.anonymousUser')}</Text>
              <Text style={[styles.groupName, { color: colors.TEXT.SECONDARY }]}>{t('matching:likeHistory.group')}: {item.groupId}</Text>
              <Text style={[styles.likeDate, { color: colors.TEXT.LIGHT }]}>
                {format(new Date(item.createdAt), 
                  i18n.language === 'ko' ? 'M월 d일 HH:mm' : 'MMM d, HH:mm',
                  { locale: i18n.language === 'ko' ? ko : enUS }
                )}
              </Text>
            </View>
          </View>

          <View style={styles.likeActions}>
            {item.isSuper && (
              <View style={[styles.superLikeBadge, { backgroundColor: colors.WARNING + '20' }]}>
                <Ionicons name="star" size={14} color={colors.WARNING} />
                <Text style={[styles.superLikeText, { color: colors.WARNING }]}>{t('matching:likeHistory.super')}</Text>
              </View>
            )}
            
            {canCancel && !isSelectionMode && (
              <TouchableOpacity
                style={[styles.cancelButton, { backgroundColor: colors.ERROR + '10' }]}
                onPress={() => handleCancelLike(item.id)}
              >
                <Text style={[styles.cancelButtonText, { color: colors.ERROR }]}>{t('matching:likeHistory.cancelLike')}</Text>
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
        color={colors.TEXT.SECONDARY} 
      />
      <Text style={[styles.emptyTitle, { color: colors.TEXT.PRIMARY }]}>
        {currentMode === AppMode.DATING 
          ? t('matching:likeHistory.emptyTitle')
          : t('matching:likeHistory.emptyFriendTitle')
        }
      </Text>
      <Text style={[styles.emptyDescription, { color: colors.TEXT.SECONDARY }]}>
        {currentMode === AppMode.DATING
          ? t('matching:likeHistory.emptyDescription')
          : t('matching:likeHistory.emptyFriendDescription')
        }
      </Text>
    </View>
  );

  const renderHeader = () => (
    <View style={[styles.header, { backgroundColor: colors.SURFACE, borderBottomColor: colors.BORDER }]}>
      <TouchableOpacity
        onPress={() => navigation.goBack()}
        style={styles.backButton}
      >
        <Ionicons name="arrow-back" size={24} color={colors.TEXT.PRIMARY} />
      </TouchableOpacity>
      
      <Text style={[styles.headerTitle, { color: colors.TEXT.PRIMARY }]}>
        {currentMode === AppMode.DATING 
          ? t('matching:likeHistory.title')
          : t('matching:likeHistory.friendTitle')
        }
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
            <Text style={[styles.cancelText, { color: colors.TEXT.SECONDARY }]}>{t('matching:likeHistory.cancel')}</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            onPress={handleDeleteHistory}
            style={styles.headerAction}
          >
            <Ionicons name="trash-outline" size={20} color={colors.ERROR} />
          </TouchableOpacity>
        </View>
      ) : (
        <TouchableOpacity
          onPress={() => setIsSelectionMode(true)}
          style={styles.selectButton}
        >
          <Text style={[styles.selectText, { color: colors.PRIMARY }]}>{t('matching:likeHistory.select')}</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.BACKGROUND }]}>
      {renderHeader()}
      
      {isLoading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.PRIMARY} />
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
              colors={[colors.PRIMARY]}
              tintColor={colors.PRIMARY}
            />
          }
          contentContainerStyle={[
            styles.listContent,
            sentLikes.length === 0 && styles.emptyListContent,
          ]}
        />
      )}
      
      {isSelectionMode && selectedLikes.length > 0 && (
        <View style={[styles.selectionBar, { backgroundColor: colors.PRIMARY }]}>
          <Text style={[styles.selectionText, { color: colors.TEXT.WHITE }]}>
            {t('matching:likeHistory.deleteSelected', { count: selectedLikes.length })}
          </Text>
        </View>
      )}
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
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: SPACING.xs,
  },
  headerTitle: {
    ...TYPOGRAPHY.h2,
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
    fontWeight: '600',
  },
  cancelText: {
    ...TYPOGRAPHY.body,
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
    marginHorizontal: SPACING.md,
    marginVertical: SPACING.xs,
    borderRadius: 12,
    padding: SPACING.md,
    borderWidth: 1,
  },
  likeItemSelected: {
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
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.sm,
  },
  userAvatarText: {
    ...TYPOGRAPHY.h3,
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    ...TYPOGRAPHY.body,
    fontWeight: '600',
    marginBottom: 2,
  },
  groupName: {
    ...TYPOGRAPHY.caption,
    marginBottom: 2,
  },
  likeDate: {
    ...TYPOGRAPHY.caption,
  },
  likeActions: {
    alignItems: 'flex-end',
    gap: SPACING.xs,
  },
  superLikeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.xs,
    paddingVertical: 2,
    borderRadius: 12,
    gap: 2,
  },
  superLikeText: {
    ...TYPOGRAPHY.caption,
    fontWeight: '600',
  },
  cancelButton: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: 6,
  },
  cancelButtonText: {
    ...TYPOGRAPHY.caption,
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
    marginTop: SPACING.md,
    marginBottom: SPACING.xs,
  },
  emptyDescription: {
    ...TYPOGRAPHY.body,
    textAlign: 'center',
  },
  selectionBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.md,
  },
  selectionText: {
    ...TYPOGRAPHY.body,
    fontWeight: '600',
    textAlign: 'center',
  },
});