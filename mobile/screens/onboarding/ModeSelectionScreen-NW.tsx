import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  Dimensions,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAndroidSafeTranslation } from '@/hooks/useAndroidSafeTranslation';
import Icon from 'react-native-vector-icons/Ionicons';
import { useAuthStore } from '@/store/slices/authSlice';
import { useTheme } from '@/hooks/useTheme';
import { AppMode } from '@/shared/types';
import { cn } from '@/lib/utils';

const { width } = Dimensions.get('window');

export const ModeSelectionScreen = () => {
  const navigation = useNavigation() as any;
  const { t } = useAndroidSafeTranslation('common');
  const { setAppMode } = useAuthStore();
  const { colors, isDarkMode } = useTheme();

  const handleModeSelection = (mode: AppMode) => {
    setAppMode(mode);
    // Navigate to main app after mode selection
    navigation.reset({
      index: 0,
      routes: [{ name: 'Main' }],
    });
  };

  return (
    <SafeAreaView 
      className="flex-1 bg-white dark:bg-gray-900"
      style={{ backgroundColor: colors.BACKGROUND }}
    >
      <View className="items-center mt-16 mb-8">
        <Text 
          className="text-4xl font-bold mb-3"
          style={{ color: colors.PRIMARY }}
        >
          {t('modeselection:app.name')}
        </Text>
        <Text 
          className="text-lg"
          style={{ color: colors.TEXT.SECONDARY }}
        >
          {t('modeselection:mode.selection.title')}
        </Text>
      </View>

      <View className="flex-1 px-6 justify-center space-y-6">
        {/* Dating Mode */}
        <TouchableOpacity
          className="rounded-2xl p-8 border-2 shadow-sm elevation-5 bg-white dark:bg-gray-800"
          style={{ 
            backgroundColor: colors.SURFACE,
            borderColor: colors.PRIMARY + '20',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 8,
          }}
          onPress={() => handleModeSelection(AppMode.DATING)}
          activeOpacity={0.8}
        >
          <View className="items-center mb-4">
            <Icon name="heart" size={60} color={colors.PRIMARY} />
          </View>
          <Text 
            className="text-2xl font-bold text-center mb-3"
            style={{ color: colors.TEXT.PRIMARY }}
          >
            {t('modeselection:mode.selection.dating.title')}
          </Text>
          <Text 
            className="text-base text-center mb-4 leading-6"
            style={{ color: colors.TEXT.SECONDARY }}
          >
            {t('modeselection:mode.selection.dating.description')}
          </Text>
          <View className="mt-3">
            <Text 
              className="text-sm mb-1"
              style={{ color: colors.TEXT.SECONDARY }}
            >
              {t('modeselection:mode.selection.dating.features.like')}
            </Text>
            <Text 
              className="text-sm mb-1"
              style={{ color: colors.TEXT.SECONDARY }}
            >
              {t('modeselection:mode.selection.dating.features.matching')}
            </Text>
            <Text 
              className="text-sm mb-1"
              style={{ color: colors.TEXT.SECONDARY }}
            >
              {t('modeselection:mode.selection.dating.features.anonymous')}
            </Text>
          </View>
        </TouchableOpacity>

        {/* Friendship Mode */}
        <TouchableOpacity
          className="rounded-2xl p-8 border-2 shadow-sm elevation-5 bg-white dark:bg-gray-800"
          style={{ 
            backgroundColor: colors.SURFACE,
            borderColor: '#4ECDC420',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 8,
          }}
          onPress={() => handleModeSelection(AppMode.FRIENDSHIP)}
          activeOpacity={0.8}
        >
          <View className="items-center mb-4">
            <Icon name="people" size={60} color={colors.SECONDARY || "#4ECDC4"} />
          </View>
          <Text 
            className="text-2xl font-bold text-center mb-3"
            style={{ color: colors.TEXT.PRIMARY }}
          >
            {t('modeselection:mode.selection.friendship.title')}
          </Text>
          <Text 
            className="text-base text-center mb-4 leading-6"
            style={{ color: colors.TEXT.SECONDARY }}
          >
            {t('modeselection:mode.selection.friendship.description')}
          </Text>
          <View className="mt-3">
            <Text 
              className="text-sm mb-1"
              style={{ color: colors.TEXT.SECONDARY }}
            >
              {t('modeselection:mode.selection.friendship.features.community')}
            </Text>
            <Text 
              className="text-sm mb-1"
              style={{ color: colors.TEXT.SECONDARY }}
            >
              {t('modeselection:mode.selection.friendship.features.groupChat')}
            </Text>
            <Text 
              className="text-sm mb-1"
              style={{ color: colors.TEXT.SECONDARY }}
            >
              {t('modeselection:mode.selection.friendship.features.events')}
            </Text>
          </View>
        </TouchableOpacity>
      </View>

      <Text 
        className="text-sm text-center mb-8 px-6"
        style={{ color: colors.TEXT.MUTED }}
      >
        {t('modeselection:mode.selection.note')}
      </Text>
    </SafeAreaView>
  );
};