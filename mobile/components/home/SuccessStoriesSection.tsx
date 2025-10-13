/**
 * 성공 스토리 섹션 컴포넌트
 */
import React from 'react';
import { View, Text, ScrollView} from 'react-native';
import { SuccessStoryCard } from '@/components/successStory/SuccessStoryCard';
import { SuccessStory } from '@/types/successStory';
import { useTheme } from '@/hooks/useTheme';

interface SuccessStoriesSectionProps {
  successStories: SuccessStory[];
  celebratedStories: Set<string>;
  onToggleCelebration: (storyId: string) => void;
  t: (key: string) => string;
}

export const SuccessStoriesSection: React.FC<SuccessStoriesSectionProps> = ({
  successStories,
  celebratedStories,
  onToggleCelebration,
  t,
}) => {
  const { colors } = useTheme();

  if (successStories.length === 0) {
    return null;
  }

  return (
    <View className="successStoriesContainer">
      <View className="successStoriesHeader">
        <Text className="successStoriesTitle">
          💑 {t('home:successStories.title')}
        </Text>
        <Text className="successStoriesSubtitle">
          {t('home:successStories.subtitle')}
        </Text>
      </View>
      
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16 }}
      >
        {successStories.map(story => (
          <SuccessStoryCard
            key={story.id}
            story={story}
            isCelebrated={celebratedStories.has(story.id)}
            onToggleCelebration={() => onToggleCelebration(story.id)}
          />
        ))}
      </ScrollView>
    </View>
  );
};

