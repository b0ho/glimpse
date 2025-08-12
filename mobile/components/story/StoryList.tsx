import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useTranslation } from 'react-i18next';
import { COLORS, SPACING, FONT_SIZES } from '@/utils/constants';
import { StoryUser as StoryUserType } from '@/utils/storyData';
import { useTheme } from '@/hooks/useTheme';

/**
 * StoryList 컴포넌트 Props
 * @interface StoryListProps
 */
interface StoryListProps {
  /** 스토리 목록 */
  stories: StoryUserType[];
  /** 스토리 클릭 핸들러 */
  onStoryPress: (userIndex: number) => void;
  /** 스토리 추가 핸들러 */
  onAddStoryPress: () => void;
  /** 현재 사용자 ID */
  currentUserId: string;
  /** 로딩 상태 */
  isLoading?: boolean;
  /** 새로고침 핸들러 */
  onRefresh?: () => void;
  /** 새로고침 상태 */
  refreshing?: boolean;
}

/**
 * 스토리 리스트 컴포넌트 - 인스타그램 스타일 스토리 목록
 * @component
 * @param {StoryListProps} props - 컴포넌트 속성
 * @returns {JSX.Element} 스토리 리스트 UI
 * @description 사용자 스토리를 가로 스크롤 리스트로 표시하고 미확인 스토리 강조
 */
export const StoryList= ({
  stories,
  onStoryPress,
  onAddStoryPress,
  currentUserId,
  isLoading = false,
  onRefresh,
  refreshing = false,
}) => {
  const { t } = useTranslation();
  const { colors } = useTheme();
  
  // Find current user's stories
  const myStories = stories.find(story => story.userId === currentUserId);
  const otherStories = stories.filter(story => story.userId !== currentUserId);

  /**
   * 개별 스토리 아이템 렌더링
   * @param {Object} params - 리스트 아이템 파라미터
   * @param {StoryUserType} params.item - 스토리 사용자
   * @param {number} params.index - 리스트 인덱스
   * @returns {JSX.Element} 스토리 아이템 UI
   */
  const renderStoryItem = ({ item, index }: { item: StoryUserType; index: number }) => {
    const actualIndex = myStories ? index + 1 : index;
    const latestStory = item.stories[0]; // 최신 스토리를 프로필 이미지로 사용
    
    return (
      <TouchableOpacity
        style={styles.storyItem}
        onPress={() => onStoryPress(actualIndex)}
      >
        <View style={styles.storyImageContainer}>
          {item.hasUnviewedStories ? (
            <LinearGradient
              colors={[colors.PRIMARY, colors.SECONDARY || colors.PRIMARY]}
              style={styles.storyRing}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <View style={[styles.storyRingInner, { backgroundColor: colors.SURFACE }]}>
                {latestStory?.imageUri ? (
                  <Image source={{ uri: latestStory.imageUri }} style={styles.profileImage} />
                ) : (
                  <View style={[styles.profileImagePlaceholder, { backgroundColor: colors.PRIMARY }]}>
                    <Text style={[styles.profileImageText, { color: colors.TEXT.WHITE }]}>
                      {item.nickname.charAt(0).toUpperCase()}
                    </Text>
                  </View>
                )}
              </View>
            </LinearGradient>
          ) : (
            <View style={[styles.viewedStoryContainer, { borderColor: colors.BORDER }]}>
              {latestStory?.imageUri ? (
                <Image source={{ uri: latestStory.imageUri }} style={styles.profileImage} />
              ) : (
                <View style={[styles.profileImagePlaceholder, { backgroundColor: colors.PRIMARY }]}>
                  <Text style={[styles.profileImageText, { color: colors.TEXT.WHITE }]}>
                    {item.nickname.charAt(0).toUpperCase()}
                  </Text>
                </View>
              )}
            </View>
          )}
        </View>
        <Text style={[styles.nickname, { color: colors.TEXT.PRIMARY }]} numberOfLines={1}>
          {item.nickname}
        </Text>
      </TouchableOpacity>
    );
  };

  /**
   * 내 스토리 렌더링
   * @returns {JSX.Element} 내 스토리 또는 스토리 추가 버튼 UI
   */
  const renderMyStory = () => {
    if (myStories && myStories.stories.length > 0) {
      const latestStory = myStories.stories[0];
      
      return (
        <TouchableOpacity style={styles.storyItem} onPress={() => onStoryPress(0)}>
          <View style={styles.storyImageContainer}>
            <View style={[styles.viewedStoryContainer, { borderColor: colors.BORDER }]}>
              {latestStory?.imageUri ? (
                <Image source={{ uri: latestStory.imageUri }} style={styles.profileImage} />
              ) : (
                <View style={[styles.profileImagePlaceholder, { backgroundColor: colors.PRIMARY }]}>
                  <Text style={[styles.profileImageText, { color: colors.TEXT.WHITE }]}>
                    {myStories.nickname.charAt(0).toUpperCase()}
                  </Text>
                </View>
              )}
              {/* 내 스토리에 + 아이콘 추가 */}
              <View style={[styles.addIconOverlay, { backgroundColor: colors.SURFACE }]}>
                <Ionicons name="add-circle" size={20} color={colors.PRIMARY} />
              </View>
            </View>
          </View>
          <Text style={[styles.nickname, { color: colors.TEXT.PRIMARY }]} numberOfLines={1}>
            내 스토리
          </Text>
        </TouchableOpacity>
      );
    }

    // Add story button
    return (
      <TouchableOpacity style={styles.storyItem} onPress={onAddStoryPress}>
        <View style={styles.addStoryContainer}>
          <View style={[styles.addStoryButton, { backgroundColor: colors.TEXT.SECONDARY }]}>
            <Ionicons name="add" size={28} color={colors.TEXT.WHITE} />
          </View>
        </View>
        <Text style={[styles.nickname, { color: colors.TEXT.PRIMARY }]}>스토리 추가</Text>
      </TouchableOpacity>
    );
  };

  if (isLoading && stories.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="small" color={colors.PRIMARY} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.SURFACE, borderBottomColor: colors.BORDER }]}>
      <FlatList
        horizontal
        showsHorizontalScrollIndicator={false}
        data={otherStories}
        renderItem={renderStoryItem}
        keyExtractor={(item) => item.userId}
        ListHeaderComponent={renderMyStory}
        contentContainerStyle={styles.listContent}
        onRefresh={onRefresh}
        refreshing={refreshing}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: SPACING.MD,
    borderBottomWidth: 1,
  },
  loadingContainer: {
    height: 120,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    paddingHorizontal: SPACING.MD,
  },
  storyItem: {
    alignItems: 'center',
    marginRight: SPACING.MD,
  },
  storyImageContainer: {
    marginBottom: SPACING.SM,
    position: 'relative',
  },
  storyRing: {
    width: 74,
    height: 74,
    borderRadius: 37,
    padding: 3,
  },
  storyRingInner: {
    flex: 1,
    borderRadius: 34,
    padding: 3,
  },
  viewedStoryContainer: {
    width: 74,
    height: 74,
    borderRadius: 37,
    padding: 3,
    borderWidth: 2,
    position: 'relative',
  },
  addStoryContainer: {
    width: 74,
    height: 74,
    borderRadius: 37,
    padding: 3,
  },
  addStoryButton: {
    flex: 1,
    borderRadius: 34,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addIconOverlay: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    borderRadius: 12,
    padding: 2,
  },
  profileImage: {
    width: '100%',
    height: '100%',
    borderRadius: 31,
  },
  profileImagePlaceholder: {
    width: '100%',
    height: '100%',
    borderRadius: 31,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileImageText: {
    fontSize: FONT_SIZES.LG,
    fontWeight: 'bold',
  },
  nickname: {
    fontSize: FONT_SIZES.XS,
    width: 74,
    textAlign: 'center',
  },
});