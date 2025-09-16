import React, { useState } from 'react';
import {
  View,
  Text
  TouchableOpacity,
  Animated,
} from 'react-native';
import { IconWrapper as Icon } from '@/components/IconWrapper';
import { useTheme } from '@/hooks/useTheme';
import { SuccessStory } from '@/types/successStory';
import { LinearGradient } from 'expo-linear-gradient';

interface SuccessStoryCardProps {
  story: SuccessStory;
  onCelebrate: (storyId: string) => void;
  hasCelebrated?: boolean;
}

export const SuccessStoryCard: React.FC<SuccessStoryCardProps> = ({
  story,
  onCelebrate,
  hasCelebrated = false,
}) => {
  const { colors } = useTheme();
  const [celebrated, setCelebrated] = useState(hasCelebrated);
  const [celebrationAnim] = useState(new Animated.Value(1));

  const handleCelebrate = () => {
    if (!celebrated) {
      // 애니메이션 효과
      Animated.sequence([
        Animated.spring(celebrationAnim, {
          toValue: 1.3,
          useNativeDriver: true,
          tension: 200,
          friction: 5,
        }),
        Animated.spring(celebrationAnim, {
          toValue: 1,
          useNativeDriver: true,
          tension: 200,
          friction: 5,
        }),
      ]).start();
      
      setCelebrated(true);
      onCelebrate(story.id);
    }
  };

  const getTimeAgo = (date: string) => {
    const now = new Date();
    const created = new Date(date);
    const diffInHours = Math.floor((now.getTime() - created.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return '방금 전';
    if (diffInHours < 24) return `${diffInHours}시간 전`;
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays === 1) return '어제';
    if (diffInDays < 7) return `${diffInDays}일 전`;
    return '일주일 전';
  };

  const displayNames = story.isAnonymous 
    ? '행복한 커플' 
    : `${story.userNickname} ❤️ ${story.partnerNickname}`;

  return (
    <LinearGradient
      colors={['#FFE5EC', '#FFE5EC']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      className="cardGradient"
    >
      <View className="card">
        {/* 헤더 */}
        <View className="header">
          <View className="headerLeft">
            <View className="avatarContainer">
              <Text className="avatarEmoji">💑</Text>
            </View>
            <View className="headerInfo">
              <Text className="coupleNames">
                {displayNames}
              </Text>
              <Text className="timeAgo">
                {getTimeAgo(story.createdAt)}
              </Text>
            </View>
          </View>
          {story.matchType && (
            <View className="matchTypeBadge">
              <Text className="matchTypeText">
                {story.matchType}
              </Text>
            </View>
          )}
        </View>

        {/* 스토리 내용 */}
        <View className="storyContent">
          <Text className="storyText">
            {story.story}
          </Text>
        </View>

        {/* 태그 */}
        {story.tags && story.tags.length > 0 && (
          <View className="tagContainer">
            {story.tags.map((tag, index) => (
              <View
                key={index}
                className="tag"
              >
                <Text className="tagText">
                  {tag}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* 하단 액션 */}
        <View className="footer">
          <TouchableOpacity
            className="celebrateButton"
            onPress={handleCelebrate}
            disabled={celebrated}
          >
            <Animated.View
              style={{ transform: [{ scale: celebrationAnim }] }}
            >
              <Icon 
                name={celebrated ? "heart" : "heart-outline"} 
                size={20} 
                color={celebrated ? '#FFFFFF' : colors.PRIMARY} 
              />
            </Animated.View>
            <Text
              className="celebrateText"
            >
              축하해요
            </Text>
            <View className="celebrateCount">
              <Text className="countText">
                {story.celebrationCount + (celebrated && !hasCelebrated ? 1 : 0)}
              </Text>
            </View>
          </TouchableOpacity>

          <View className="shareContainer">
            <TouchableOpacity className="shareButton">
              <Icon name="share-social-outline" size={20} color={colors.TEXT.SECONDARY} />
            </TouchableOpacity>
          </View>
        </View>

        {/* 장식 요소 */}
        <View className="decorationContainer">
          <Text className="decorationEmoji">✨</Text>
          <Text className="decorationEmoji">💕</Text>
        </View>
      </View>
    </LinearGradient>
  );
};

