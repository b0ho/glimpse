/**
 * 성공 스토리 섹션 컴포넌트
 */
import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
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
    <View style={styles.successStoriesContainer}>
      <View style={styles.successStoriesHeader}>
        <Text style={[styles.successStoriesTitle, { color: colors.TEXT.PRIMARY }]}>
          💑 {t('home:successStories.title')}
        </Text>
        <Text style={[styles.successStoriesSubtitle, { color: colors.TEXT.SECONDARY }]}>
          {t('home:successStories.subtitle')}
        </Text>
      </View>
      
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.successStoriesList}
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

const styles = StyleSheet.create({
  successStoriesContainer: {
    marginVertical: 16,
  },
  successStoriesHeader: {
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  successStoriesTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  successStoriesSubtitle: {
    fontSize: 13,
  },
  successStoriesList: {
    paddingHorizontal: 16,
    gap: 12,
  },
});