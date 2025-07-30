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

interface LocationPermissionViewProps {
  isLoading: boolean;
  onRequestPermission: () => void;
}

export const LocationPermissionView: React.FC<LocationPermissionViewProps> = ({
  isLoading,
  onRequestPermission,
}) => {
  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>위치 권한 확인 중...</Text>
      </View>
    );
  }

  return (
    <View style={styles.centerContainer}>
      <Icon name="location-outline" size={80} color={COLORS.primary} />
      <Text style={styles.title}>위치 권한이 필요합니다</Text>
      <Text style={styles.description}>
        주변 사용자를 찾기 위해{`\n`}위치 정보가 필요합니다
      </Text>
      <TouchableOpacity style={styles.button} onPress={onRequestPermission}>
        <Text style={styles.buttonText}>위치 권한 허용하기</Text>
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
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
  },
  title: {
    fontSize: FONT_SIZES.xl,
    fontWeight: 'bold',
    color: COLORS.text,
    marginTop: SPACING.lg,
    marginBottom: SPACING.sm,
  },
  description: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: SPACING.xl,
    lineHeight: 22,
  },
  button: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.md,
    borderRadius: 25,
  },
  buttonText: {
    color: COLORS.white,
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
  },
});