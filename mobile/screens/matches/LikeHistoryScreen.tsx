/**
 * 좋아요 보낸 내역 화면 - NativeWind 버전
 *
 * @screen
 * @description 사용자가 다른 사람에게 보낸 좋아요 내역을 관리하는 화면
 */
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
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
import { Like, AppMode, MODE_TEXTS } from '@/shared/types';
import { cn } from '@/lib/utils';

/**
 * 좋아요 보낸 내역 화면 컴포넌트
 *
 * @component
 * @returns {JSX.Element}
 *
 * @description
 * 사용자가 보낸 좋아요 내역을 표시하고 관리하는 화면입니다:
 * - 보낸 좋아요 목록 확인
 * - 24시간 이내 좋아요 취소 기능
 * - 다중 선택으로 내역 삭제
 * - 일반 좋아요 / 슈퍼 좋아요 구분
 * - 연애/친구 모드별 내역 분리
 *
 * @features
 * - 익명성 유지: 상대방 정보는 매칭 전까지 비공개
 * - 24시간 이내 좋아요 취소 가능
 * - 장문 선택 모드로 다중 삭제
 * - Pull-to-refresh로 최신 상태 갱신
 * - 슈퍼 좋아요는 별 아이콘으로 표시
 *
 * @navigation
 * - From: ProfileScreen (프로필 화면에서 "보낸 좋아요" 메뉴)
 * - From: MatchesScreen (매칭 화면에서 내역 확인)
 *
 * @example
 * ```tsx
 * <Stack.Screen name="LikeHistory" component={LikeHistoryScreen} />
 * ```
 */
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
        className={cn(
          "mx-4 my-1 rounded-xl p-4 border",
          isSelected && "border-opacity-100",
          "bg-white dark:bg-gray-800"
        )}
        style={{
          backgroundColor: isSelected ? colors.PRIMARY + '05' : colors.SURFACE,
          borderColor: isSelected ? colors.PRIMARY : colors.BORDER,
        }}
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
        <View className="flex-row items-center">
          {isSelectionMode && (
            <View 
              className="w-6 h-6 rounded-full border-2 mr-3 justify-center items-center"
              style={{ borderColor: colors.PRIMARY }}
            >
              {isSelected && (
                <Ionicons name="checkmark" size={16} color={colors.PRIMARY} />
              )}
            </View>
          )}
          
          <View className="flex-row flex-1 items-center">
            <View 
              className="w-12 h-12 rounded-full justify-center items-center mr-3"
              style={{ backgroundColor: colors.BACKGROUND }}
            >
              <Text 
                className="text-xl"
                style={{ color: colors.TEXT.SECONDARY }}
              >
                ?
              </Text>
            </View>
            <View className="flex-1">
              <Text 
                className="text-base font-semibold mb-0.5"
                style={{ color: colors.TEXT.PRIMARY }}
              >
                {t('matching:likeHistory.anonymousUser')}
              </Text>
              <Text 
                className="text-sm mb-0.5"
                style={{ color: colors.TEXT.SECONDARY }}
              >
                {t('matching:likeHistory.group')}: {item.groupId}
              </Text>
              <Text 
                className="text-xs"
                style={{ color: colors.TEXT.LIGHT }}
              >
                {format(new Date(item.createdAt), 
                  i18n.language === 'ko' ? 'M월 d일 HH:mm' : 'MMM d, HH:mm',
                  { locale: i18n.language === 'ko' ? ko : enUS }
                )}
              </Text>
            </View>
          </View>

          <View className="items-end space-y-1">
            {item.isSuper && (
              <View 
                className="flex-row items-center px-2 py-0.5 rounded-xl"
                style={{ backgroundColor: colors.WARNING + '20' }}
              >
                <Ionicons name="star" size={14} color={colors.WARNING} />
                <Text 
                  className="text-xs font-semibold ml-0.5"
                  style={{ color: colors.WARNING }}
                >
                  {t('matching:likeHistory.super')}
                </Text>
              </View>
            )}
            
            {canCancel && !isSelectionMode && (
              <TouchableOpacity
                className="px-3 py-1 rounded"
                style={{ backgroundColor: colors.ERROR + '10' }}
                onPress={() => handleCancelLike(item.id)}
              >
                <Text 
                  className="text-xs font-semibold"
                  style={{ color: colors.ERROR }}
                >
                  {t('matching:likeHistory.cancelLike')}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderEmptyState = () => (
    <View className="flex-1 justify-center items-center px-8">
      <Ionicons 
        name={currentMode === AppMode.DATING ? "heart-outline" : "people-outline"} 
        size={64} 
        color={colors.TEXT.SECONDARY} 
      />
      <Text 
        className="text-xl font-semibold mt-4 mb-2"
        style={{ color: colors.TEXT.PRIMARY }}
      >
        {currentMode === AppMode.DATING 
          ? t('matching:likeHistory.emptyTitle')
          : t('matching:likeHistory.emptyFriendTitle')
        }
      </Text>
      <Text 
        className="text-base text-center"
        style={{ color: colors.TEXT.SECONDARY }}
      >
        {currentMode === AppMode.DATING
          ? t('matching:likeHistory.emptyDescription')
          : t('matching:likeHistory.emptyFriendDescription')
        }
      </Text>
    </View>
  );

  const renderHeader = () => (
    <View 
      className={cn(
        "flex-row items-center justify-between px-4 py-3 border-b",
        "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700"
      )}
      style={{ 
        backgroundColor: colors.SURFACE, 
        borderBottomColor: colors.BORDER 
      }}
    >
      <TouchableOpacity
        onPress={() => navigation.goBack()}
        className="p-1"
      >
        <Ionicons name="arrow-back" size={24} color={colors.TEXT.PRIMARY} />
      </TouchableOpacity>
      
      <Text 
        className="text-xl font-semibold flex-1 text-center"
        style={{ color: colors.TEXT.PRIMARY }}
      >
        {currentMode === AppMode.DATING 
          ? t('matching:likeHistory.title')
          : t('matching:likeHistory.friendTitle')
        }
      </Text>
      
      {isSelectionMode ? (
        <View className="flex-row items-center space-x-4">
          <TouchableOpacity
            onPress={() => {
              setSelectedLikes([]);
              setIsSelectionMode(false);
            }}
            className="p-1"
          >
            <Text 
              className="text-base"
              style={{ color: colors.TEXT.SECONDARY }}
            >
              {t('matching:likeHistory.cancel')}
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            onPress={handleDeleteHistory}
            className="p-1"
          >
            <Ionicons name="trash-outline" size={20} color={colors.ERROR} />
          </TouchableOpacity>
        </View>
      ) : (
        <TouchableOpacity
          onPress={() => setIsSelectionMode(true)}
          className="p-1"
        >
          <Text 
            className="text-base font-semibold"
            style={{ color: colors.PRIMARY }}
          >
            {t('matching:likeHistory.select')}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <SafeAreaView 
      className={cn(
        "flex-1",
        "bg-white dark:bg-gray-900"
      )}
      style={{ backgroundColor: colors.BACKGROUND }}
    >
      {renderHeader()}
      
      {isLoading && !refreshing ? (
        <View className="flex-1 justify-center items-center">
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
          contentContainerStyle={
            sentLikes.length === 0 
              ? { flex: 1 }
              : { paddingVertical: 8 }
          }
        />
      )}
      
      {isSelectionMode && selectedLikes.length > 0 && (
        <View 
          className="absolute bottom-0 left-0 right-0 px-4 py-3 pb-4"
          style={{ backgroundColor: colors.PRIMARY }}
        >
          <Text 
            className="text-base font-semibold text-center"
            style={{ color: colors.TEXT.WHITE }}
          >
            {t('matching:likeHistory.deleteSelected', { count: selectedLikes.length })}
          </Text>
        </View>
      )}
    </SafeAreaView>
  );
};