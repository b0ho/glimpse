import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
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
      style={styles.cardGradient}
    >
      <View style={[styles.card, { backgroundColor: colors.SURFACE }]}>
        {/* 헤더 */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={styles.avatarContainer}>
              <Text style={styles.avatarEmoji}>💑</Text>
            </View>
            <View style={styles.headerInfo}>
              <Text style={[styles.coupleNames, { color: colors.TEXT.PRIMARY }]}>
                {displayNames}
              </Text>
              <Text style={[styles.timeAgo, { color: colors.TEXT.SECONDARY }]}>
                {getTimeAgo(story.createdAt)}
              </Text>
            </View>
          </View>
          {story.matchType && (
            <View style={[styles.matchTypeBadge, { backgroundColor: colors.PRIMARY + '20' }]}>
              <Text style={[styles.matchTypeText, { color: colors.PRIMARY }]}>
                {story.matchType}
              </Text>
            </View>
          )}
        </View>

        {/* 스토리 내용 */}
        <View style={styles.storyContent}>
          <Text style={[styles.storyText, { color: colors.TEXT.PRIMARY }]}>
            {story.story}
          </Text>
        </View>

        {/* 태그 */}
        {story.tags && story.tags.length > 0 && (
          <View style={styles.tagContainer}>
            {story.tags.map((tag, index) => (
              <View
                key={index}
                style={[styles.tag, { backgroundColor: colors.PRIMARY + '15' }]}
              >
                <Text style={[styles.tagText, { color: colors.PRIMARY }]}>
                  {tag}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* 하단 액션 */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={[
              styles.celebrateButton,
              {
                backgroundColor: celebrated ? colors.PRIMARY : colors.BACKGROUND,
                borderColor: colors.PRIMARY,
              }
            ]}
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
              style={[
                styles.celebrateText,
                { color: celebrated ? '#FFFFFF' : colors.PRIMARY }
              ]}
            >
              축하해요
            </Text>
            <View style={[styles.celebrateCount, { backgroundColor: celebrated ? '#FFFFFF20' : colors.PRIMARY + '20' }]}>
              <Text style={[styles.countText, { color: celebrated ? '#FFFFFF' : colors.PRIMARY }]}>
                {story.celebrationCount + (celebrated && !hasCelebrated ? 1 : 0)}
              </Text>
            </View>
          </TouchableOpacity>

          <View style={styles.shareContainer}>
            <TouchableOpacity style={styles.shareButton}>
              <Icon name="share-social-outline" size={20} color={colors.TEXT.SECONDARY} />
            </TouchableOpacity>
          </View>
        </View>

        {/* 장식 요소 */}
        <View style={styles.decorationContainer}>
          <Text style={styles.decorationEmoji}>✨</Text>
          <Text style={styles.decorationEmoji}>💕</Text>
        </View>
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  cardGradient: {
    borderRadius: 16,
    marginHorizontal: 16,
    marginVertical: 8,
    padding: 1,
  },
  card: {
    borderRadius: 15,
    padding: 16,
    position: 'relative',
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatarContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFE5EC',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarEmoji: {
    fontSize: 20,
  },
  headerInfo: {
    marginLeft: 10,
    flex: 1,
  },
  coupleNames: {
    fontSize: 15,
    fontWeight: '600',
  },
  timeAgo: {
    fontSize: 12,
    marginTop: 2,
  },
  matchTypeBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  matchTypeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  storyContent: {
    marginBottom: 12,
  },
  storyText: {
    fontSize: 14,
    lineHeight: 20,
  },
  tagContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 12,
    marginHorizontal: -4,
  },
  tag: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 15,
    margin: 4,
  },
  tagText: {
    fontSize: 12,
    fontWeight: '500',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  celebrateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  celebrateText: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  celebrateCount: {
    marginLeft: 8,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  countText: {
    fontSize: 12,
    fontWeight: '700',
  },
  shareContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  shareButton: {
    padding: 8,
  },
  decorationContainer: {
    position: 'absolute',
    top: 10,
    right: 10,
    flexDirection: 'row',
    opacity: 0.3,
  },
  decorationEmoji: {
    fontSize: 12,
    marginLeft: 4,
  },
});