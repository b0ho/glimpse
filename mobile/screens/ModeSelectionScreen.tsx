import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Image,
  Dimensions,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import Icon from 'react-native-vector-icons/Ionicons';
import { useAuthStore } from '@/store/slices/authSlice';
import { useTheme } from '@/hooks/useTheme';
import { AppMode } from '@shared/types';
import { COLORS, SPACING, FONT_SIZES } from '@/utils/constants';

const { width } = Dimensions.get('window');

export const ModeSelectionScreen = () => {
  const navigation = useNavigation() as any;
  const { t } = useTranslation('common');
  const { setAppMode } = useAuthStore();
  const { colors } = useTheme();

  const handleModeSelection = (mode: AppMode) => {
    setAppMode(mode);
    // Navigate to main app after mode selection
    navigation.reset({
      index: 0,
      routes: [{ name: 'Main' }],
    });
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.BACKGROUND }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.PRIMARY }]}>{t('app.name')}</Text>
        <Text style={[styles.subtitle, { color: colors.TEXT.SECONDARY }]}>{t('mode.selection.title')}</Text>
      </View>

      <View style={styles.modeContainer}>
        {/* Dating Mode */}
        <TouchableOpacity
          style={[
            styles.modeCard, 
            styles.datingCard, 
            { 
              backgroundColor: colors.SURFACE,
              borderColor: colors.PRIMARY + '20',
            }
          ]}
          onPress={() => handleModeSelection(AppMode.DATING)}
          activeOpacity={0.8}
        >
          <View style={styles.iconContainer}>
            <Icon name="heart" size={60} color={colors.PRIMARY} />
          </View>
          <Text style={[styles.modeTitle, { color: colors.TEXT.PRIMARY }]}>{t('mode.selection.dating.title')}</Text>
          <Text style={[styles.modeDescription, { color: colors.TEXT.SECONDARY }]}>
            {t('mode.selection.dating.description')}
          </Text>
          <View style={styles.featureList}>
            <Text style={[styles.featureItem, { color: colors.TEXT.SECONDARY }]}>{t('mode.selection.dating.features.like')}</Text>
            <Text style={[styles.featureItem, { color: colors.TEXT.SECONDARY }]}>{t('mode.selection.dating.features.matching')}</Text>
            <Text style={[styles.featureItem, { color: colors.TEXT.SECONDARY }]}>{t('mode.selection.dating.features.anonymous')}</Text>
          </View>
        </TouchableOpacity>

        {/* Friendship Mode */}
        <TouchableOpacity
          style={[
            styles.modeCard, 
            styles.friendshipCard, 
            { 
              backgroundColor: colors.SURFACE,
              borderColor: '#4ECDC420',
            }
          ]}
          onPress={() => handleModeSelection(AppMode.FRIENDSHIP)}
          activeOpacity={0.8}
        >
          <View style={styles.iconContainer}>
            <Icon name="people" size={60} color={colors.SECONDARY || "#4ECDC4"} />
          </View>
          <Text style={[styles.modeTitle, { color: colors.TEXT.PRIMARY }]}>{t('mode.selection.friendship.title')}</Text>
          <Text style={[styles.modeDescription, { color: colors.TEXT.SECONDARY }]}>
            {t('mode.selection.friendship.description')}
          </Text>
          <View style={styles.featureList}>
            <Text style={[styles.featureItem, { color: colors.TEXT.SECONDARY }]}>{t('mode.selection.friendship.features.community')}</Text>
            <Text style={[styles.featureItem, { color: colors.TEXT.SECONDARY }]}>{t('mode.selection.friendship.features.groupChat')}</Text>
            <Text style={[styles.featureItem, { color: colors.TEXT.SECONDARY }]}>{t('mode.selection.friendship.features.events')}</Text>
          </View>
        </TouchableOpacity>
      </View>

      <Text style={[styles.note, { color: colors.TEXT.MUTED }]}>
        {t('mode.selection.note')}
      </Text>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    alignItems: 'center',
    marginTop: SPACING.XXL,
    marginBottom: SPACING.XL,
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    marginBottom: SPACING.SM,
  },
  subtitle: {
    fontSize: FONT_SIZES.LG,
  },
  modeContainer: {
    flex: 1,
    paddingHorizontal: SPACING.LG,
    justifyContent: 'center',
    gap: SPACING.LG,
  },
  modeCard: {
    borderRadius: 20,
    padding: SPACING.XL,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  datingCard: {
  },
  friendshipCard: {
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: SPACING.MD,
  },
  modeTitle: {
    fontSize: FONT_SIZES.XL,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: SPACING.SM,
  },
  modeDescription: {
    fontSize: FONT_SIZES.MD,
    textAlign: 'center',
    marginBottom: SPACING.MD,
    lineHeight: 22,
  },
  featureList: {
    marginTop: SPACING.SM,
  },
  featureItem: {
    fontSize: FONT_SIZES.SM,
    marginBottom: SPACING.XS,
  },
  note: {
    fontSize: FONT_SIZES.SM,
    textAlign: 'center',
    marginBottom: SPACING.XL,
    paddingHorizontal: SPACING.LG,
  },
});