import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { COLORS, SPACING, FONT_SIZES } from '@/utils/constants';

interface RadiusSelectorProps {
  radiusOptions: number[];
  selectedRadius: number;
  onRadiusChange: (radius: number) => void;
}

export const RadiusSelector: React.FC<RadiusSelectorProps> = ({
  radiusOptions,
  selectedRadius,
  onRadiusChange,
}) => {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>검색 범위</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={styles.radiusSelector}>
          {radiusOptions.map((radius) => (
            <TouchableOpacity
              key={radius}
              style={[
                styles.radiusOption,
                selectedRadius === radius && styles.radiusOptionActive,
              ]}
              onPress={() => onRadiusChange(radius)}
            >
              <Text
                style={[
                  styles.radiusText,
                  selectedRadius === radius && styles.radiusTextActive,
                ]}
              >
                {radius}km
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.WHITE,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.BORDER,
  },
  label: {
    fontSize: FONT_SIZES.SM,
    color: COLORS.TEXT.SECONDARY,
    marginBottom: SPACING.sm,
  },
  radiusSelector: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  radiusOption: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    borderRadius: 20,
    backgroundColor: COLORS.BACKGROUND,
    borderWidth: 1,
    borderColor: COLORS.BORDER,
  },
  radiusOptionActive: {
    backgroundColor: COLORS.PRIMARY,
    borderColor: COLORS.PRIMARY,
  },
  radiusText: {
    fontSize: FONT_SIZES.SM,
    color: COLORS.TEXT.PRIMARY,
    fontWeight: '500',
  },
  radiusTextActive: {
    color: COLORS.WHITE,
  },
});