/**
 * 게임 ID 입력 컴포넌트
 */
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { CrossPlatformInput } from '@/components/CrossPlatformInput';
import { GAME_PLATFORM_OPTIONS } from '@/constants/interest/interestTypes';

interface GameInputFieldProps {
  value: string;
  onChange: (value: string) => void;
  selectedGame?: string;
  onGameSelect: (game: string) => void;
  colors: any;
  t: (key: string) => string;
}

export const GameInputField: React.FC<GameInputFieldProps> = ({
  value,
  onChange,
  selectedGame,
  onGameSelect,
  colors,
  t,
}) => {
  return (
    <View style={styles.container}>
      <Text style={[styles.label, { color: colors.TEXT.SECONDARY }]}>
        {t('interest:game')} *
      </Text>
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.gameScroll}
      >
        {GAME_PLATFORM_OPTIONS.map((game) => (
          <TouchableOpacity
            key={game.id}
            style={[
              styles.gameButton,
              {
                backgroundColor: selectedGame === game.id 
                  ? colors.PRIMARY 
                  : colors.SURFACE,
                borderColor: selectedGame === game.id 
                  ? colors.PRIMARY 
                  : colors.BORDER,
              }
            ]}
            onPress={() => onGameSelect(game.id)}
          >
            <Text style={[
              styles.gameButtonText,
              { 
                color: selectedGame === game.id 
                  ? colors.TEXT.WHITE 
                  : colors.TEXT.PRIMARY 
              }
            ]}>
              {game.name}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <CrossPlatformInput
        style={[
          styles.input,
          { 
            backgroundColor: colors.BACKGROUND, 
            color: colors.TEXT.PRIMARY,
            borderColor: colors.BORDER,
          }
        ]}
        placeholder={t('interest:gameIdPlaceholder')}
        placeholderTextColor={colors.TEXT.LIGHT}
        value={value}
        onChangeText={onChange}
        autoCapitalize="none"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  label: {
    fontSize: 14,
    marginBottom: 8,
    fontWeight: '500',
  },
  gameScroll: {
    marginBottom: 12,
  },
  gameButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
  },
  gameButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
  },
});