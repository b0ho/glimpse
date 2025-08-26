import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { COLORS, SPACING, FONT_SIZES } from '@/utils/constants';
import { useAndroidSafeTranslation } from '@/hooks/useAndroidSafeTranslation';

interface LocationPermissionViewProps {
  isLoading: boolean;
  onRequestPermission: () => void;
}

export const LocationPermissionView= ({
  isLoading,
  onRequestPermission,
}) => {
  const { t } = useAndroidSafeTranslation();
  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={COLORS.PRIMARY} />
        <Text style={styles.loadingText}>{t('nearbyusers:permission.loading')}</Text>
      </View>
    );
  }

  return (
    <View style={styles.centerContainer}>
      <Icon name="location-outline" size={80} color={COLORS.PRIMARY} />
      <Text style={styles.title}>{t('nearbyusers:permission.title')}</Text>
      <Text style={styles.description}>
        {t('nearbyusers:permission.description')}
      </Text>
      <TouchableOpacity style={styles.button} onPress={onRequestPermission}>
        <Text style={styles.buttonText}>{t('nearbyusers:permission.allowButton')}</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
  },
  loadingText: {
    marginTop: SPACING.md,
    fontSize: FONT_SIZES.MD,
    color: COLORS.TEXT.SECONDARY,
  },
  title: {
    fontSize: FONT_SIZES.XL,
    fontWeight: 'bold',
    color: COLORS.TEXT.PRIMARY,
    marginTop: SPACING.lg,
    marginBottom: SPACING.sm,
  },
  description: {
    fontSize: FONT_SIZES.MD,
    color: COLORS.TEXT.SECONDARY,
    textAlign: 'center',
    marginBottom: SPACING.xl,
    lineHeight: 22,
  },
  button: {
    backgroundColor: COLORS.PRIMARY,
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.md,
    borderRadius: 25,
  },
  buttonText: {
    color: COLORS.WHITE,
    fontSize: FONT_SIZES.MD,
    fontWeight: '600',
  },
});