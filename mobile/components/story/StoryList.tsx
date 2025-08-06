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
import { COLORS, FONTS, SIZES } from '../../constants/theme';

/**
 * 스토리 사용자 인터페이스
 * @interface StoryUser
 */
interface StoryUser {
  /** 사용자 정보 */
  user: {
    /** 사용자 ID */
    id: string;
    /** 닉네임 */
    nickname: string;
    /** 프로필 이미지 URL */
    profileImage?: string;
  };
  /** 스토리 리스트 */
  stories: any[];
  /** 보지 않은 스토리 여부 */
  hasUnviewed: boolean;
}

/**
 * StoryList 컴포넌트 Props
 * @interface StoryListProps
 */
interface StoryListProps {
  /** 스토리 목록 */
  stories: StoryUser[];
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
  // Find current user's stories
  const myStories = stories.find(story => story.user.id === currentUserId);
  const otherStories = stories.filter(story => story.user.id !== currentUserId);

  /**
   * 개별 스토리 아이템 렌더링
   * @param {Object} params - 리스트 아이템 파라미터
   * @param {StoryUser} params.item - 스토리 사용자
   * @param {number} params.index - 리스트 인덱스
   * @returns {JSX.Element} 스토리 아이템 UI
   */
  const renderStoryItem = ({ item, index }: { item: StoryUser; index: number }) => {
    const actualIndex = myStories ? index + 1 : index;
    
    return (
      <TouchableOpacity
        style={styles.storyItem}
        onPress={() => onStoryPress(actualIndex)}
      >
        <View style={styles.storyImageContainer}>
          {item.hasUnviewed ? (
            <LinearGradient
              colors={[COLORS.primary, COLORS.secondary]}
              style={styles.storyRing}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <View style={styles.storyRingInner}>
                {item.user.profileImage ? (
                  <Image source={{ uri: item.user.profileImage }} style={styles.profileImage} />
                ) : (
                  <View style={styles.profileImagePlaceholder}>
                    <Text style={styles.profileImageText}>
                      {item.user.nickname.charAt(0).toUpperCase()}
                    </Text>
                  </View>
                )}
              </View>
            </LinearGradient>
          ) : (
            <View style={styles.viewedStoryContainer}>
              {item.user.profileImage ? (
                <Image source={{ uri: item.user.profileImage }} style={styles.profileImage} />
              ) : (
                <View style={styles.profileImagePlaceholder}>
                  <Text style={styles.profileImageText}>
                    {item.user.nickname.charAt(0).toUpperCase()}
                  </Text>
                </View>
              )}
            </View>
          )}
        </View>
        <Text style={styles.nickname} numberOfLines={1}>
          {item.user.nickname}
        </Text>
      </TouchableOpacity>
    );
  };

  /**
   * 내 스토리 렌더링
   * @returns {JSX.Element} 내 스토리 또는 스토리 추가 버튼 UI
   */
  const renderMyStory = () => {
    if (myStories) {
      return (
        <TouchableOpacity style={styles.storyItem} onPress={() => onStoryPress(0)}>
          <View style={styles.storyImageContainer}>
            {myStories.hasUnviewed ? (
              <LinearGradient
                colors={[COLORS.primary, COLORS.secondary]}
                style={styles.storyRing}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <View style={styles.storyRingInner}>
                  {myStories.user.profileImage ? (
                    <Image source={{ uri: myStories.user.profileImage }} style={styles.profileImage} />
                  ) : (
                    <View style={styles.profileImagePlaceholder}>
                      <Text style={styles.profileImageText}>
                        {myStories.user.nickname.charAt(0).toUpperCase()}
                      </Text>
                    </View>
                  )}
                </View>
              </LinearGradient>
            ) : (
              <View style={styles.viewedStoryContainer}>
                {myStories.user.profileImage ? (
                  <Image source={{ uri: myStories.user.profileImage }} style={styles.profileImage} />
                ) : (
                  <View style={styles.profileImagePlaceholder}>
                    <Text style={styles.profileImageText}>
                      {myStories.user.nickname.charAt(0).toUpperCase()}
                    </Text>
                  </View>
                )}
              </View>
            )}
          </View>
          <Text style={styles.nickname} numberOfLines={1}>
            내 스토리
          </Text>
        </TouchableOpacity>
      );
    }

    // Add story button
    return (
      <TouchableOpacity style={styles.storyItem} onPress={onAddStoryPress}>
        <View style={styles.addStoryContainer}>
          <View style={styles.addStoryButton}>
            <Ionicons name="add" size={28} color={COLORS.white} />
          </View>
        </View>
        <Text style={styles.nickname}>스토리 추가</Text>
      </TouchableOpacity>
    );
  };

  if (isLoading && stories.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="small" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        horizontal
        showsHorizontalScrollIndicator={false}
        data={otherStories}
        renderItem={renderStoryItem}
        keyExtractor={(item) => item.user.id}
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
    backgroundColor: COLORS.white,
    paddingVertical: SIZES.padding,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray4,
  },
  loadingContainer: {
    height: 120,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    paddingHorizontal: SIZES.padding,
  },
  storyItem: {
    alignItems: 'center',
    marginRight: SIZES.padding,
  },
  storyImageContainer: {
    marginBottom: SIZES.base,
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
    backgroundColor: COLORS.white,
    padding: 3,
  },
  viewedStoryContainer: {
    width: 74,
    height: 74,
    borderRadius: 37,
    padding: 3,
    borderWidth: 1,
    borderColor: COLORS.lightGray3,
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
    backgroundColor: COLORS.lightGray3,
    justifyContent: 'center',
    alignItems: 'center',
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
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileImageText: {
    ...FONTS.h3,
    color: COLORS.white,
  },
  nickname: {
    ...FONTS.body5,
    color: COLORS.black,
    width: 74,
    textAlign: 'center',
  },
});