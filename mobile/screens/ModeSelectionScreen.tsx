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
import { AppMode } from '@shared/types';
import { COLORS, SPACING, FONT_SIZES } from '@/utils/constants';

const { width } = Dimensions.get('window');

export const ModeSelectionScreen = () => {
  const navigation = useNavigation() as any;
  const { t } = useTranslation('common');
  const { setAppMode } = useAuthStore();

  const handleModeSelection = (mode: AppMode) => {
    setAppMode(mode);
    // Navigate to main app after mode selection
    navigation.reset({
      index: 0,
      routes: [{ name: 'Main' }],
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{t('app.name')}</Text>
        <Text style={styles.subtitle}>{t('mode.selection.title')}</Text>
      </View>

      <View style={styles.modeContainer}>
        {/* Dating Mode */}
        <TouchableOpacity
          style={[styles.modeCard, styles.datingCard]}
          onPress={() => handleModeSelection(AppMode.DATING)}
          activeOpacity={0.8}
        >
          <View style={styles.iconContainer}>
            <Icon name="heart" size={60} color={COLORS.PRIMARY} />
          </View>
          <Text style={styles.modeTitle}>{t('mode.selection.dating.title')}</Text>
          <Text style={styles.modeDescription}>
            {t('mode.selection.dating.description')}
          </Text>
          <View style={styles.featureList}>
            <Text style={styles.featureItem}>{t('mode.selection.dating.features.like')}</Text>
            <Text style={styles.featureItem}>{t('mode.selection.dating.features.matching')}</Text>
            <Text style={styles.featureItem}>{t('mode.selection.dating.features.anonymous')}</Text>
          </View>
        </TouchableOpacity>

        {/* Friendship Mode */}
        <TouchableOpacity
          style={[styles.modeCard, styles.friendshipCard]}
          onPress={() => handleModeSelection(AppMode.FRIENDSHIP)}
          activeOpacity={0.8}
        >
          <View style={styles.iconContainer}>
            <Icon name="people" size={60} color="#4ECDC4" />
          </View>
          <Text style={styles.modeTitle}>{t('mode.selection.friendship.title')}</Text>
          <Text style={styles.modeDescription}>
            {t('mode.selection.friendship.description')}
          </Text>
          <View style={styles.featureList}>
            <Text style={styles.featureItem}>{t('mode.selection.friendship.features.community')}</Text>
            <Text style={styles.featureItem}>{t('mode.selection.friendship.features.groupChat')}</Text>
            <Text style={styles.featureItem}>{t('mode.selection.friendship.features.events')}</Text>
          </View>
        </TouchableOpacity>
      </View>

      <Text style={styles.note}>
        {t('mode.selection.note')}
      </Text>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    alignItems: 'center',
    marginTop: SPACING.XXL,
    marginBottom: SPACING.XL,
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    color: COLORS.PRIMARY,
    marginBottom: SPACING.SM,
  },
  subtitle: {
    fontSize: FONT_SIZES.LG,
    color: COLORS.TEXT.SECONDARY,
  },
  modeContainer: {
    flex: 1,
    paddingHorizontal: SPACING.LG,
    justifyContent: 'center',
    gap: SPACING.LG,
  },
  modeCard: {
    backgroundColor: COLORS.WHITE,
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
    borderColor: COLORS.PRIMARY + '20',
  },
  friendshipCard: {
    borderColor: '#4ECDC420',
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: SPACING.MD,
  },
  modeTitle: {
    fontSize: FONT_SIZES.XL,
    fontWeight: 'bold',
    color: COLORS.TEXT.PRIMARY,
    textAlign: 'center',
    marginBottom: SPACING.SM,
  },
  modeDescription: {
    fontSize: FONT_SIZES.MD,
    color: COLORS.TEXT.SECONDARY,
    textAlign: 'center',
    marginBottom: SPACING.MD,
    lineHeight: 22,
  },
  featureList: {
    marginTop: SPACING.SM,
  },
  featureItem: {
    fontSize: FONT_SIZES.SM,
    color: COLORS.TEXT.SECONDARY,
    marginBottom: SPACING.XS,
  },
  note: {
    fontSize: FONT_SIZES.SM,
    color: COLORS.TEXT.MUTED,
    textAlign: 'center',
    marginBottom: SPACING.XL,
    paddingHorizontal: SPACING.LG,
  },
});