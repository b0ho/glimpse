import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { COLORS, SPACING, FONT_SIZES } from '@/utils/constants';

interface LocationHeaderProps {
  address?: string;
  nearbyCount: number;
  onRefresh: () => void;
}

export const LocationHeader: React.FC<LocationHeaderProps> = ({
  address,
  nearbyCount,
  onRefresh,
}) => {
  return (
    <View style={styles.locationHeader}>
      <View style={styles.locationInfo}>
        <Icon name="location" size={20} color={COLORS.primary} />
        <Text style={styles.locationText} numberOfLines={1}>
          {address || '위치 확인 중...'}
        </Text>
      </View>
      <TouchableOpacity onPress={onRefresh} style={styles.refreshButton}>
        <Icon name="refresh" size={20} color={COLORS.primary} />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  locationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  locationInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationText: {
    marginLeft: SPACING.sm,
    fontSize: FONT_SIZES.md,
    color: COLORS.text,
    flex: 1,
  },
  refreshButton: {
    padding: SPACING.sm,
  },
});