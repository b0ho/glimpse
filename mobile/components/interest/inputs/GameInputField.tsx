/**
 * 게임 ID 입력 컴포넌트
 */
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { CrossPlatformInput } from '@/components/CrossPlatformInput';
import { IconWrapper as Icon } from '@/components/IconWrapper';
import { GAME_PLATFORM_OPTIONS } from '@/constants/interest/interestTypes';

interface GameInputFieldProps {
  value: string;
  onChange: (value: string) => void;
  selectedGame?: string;
  onGameSelect: (game: string) => void;
  name?: string;
  onNameChange?: (name: string) => void;
  selectedGender?: 'male' | 'female' | 'other';
  onGenderSelect?: (gender: 'male' | 'female' | 'other') => void;
  colors: any;
  t: (key: string) => string;
}

export const GameInputField: React.FC<GameInputFieldProps> = ({
  value,
  onChange,
  selectedGame,
  onGameSelect,
  name = '',
  onNameChange,
  selectedGender = 'male',
  onGenderSelect,
  colors,
  t,
}) => {
  const genderOptions = [
    { id: 'male' as const, label: t('common:gender.male'), icon: 'male-outline' },
    { id: 'female' as const, label: t('common:gender.female'), icon: 'female-outline' },
    { id: 'other' as const, label: t('common:gender.other'), icon: 'help-outline' },
  ];

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

      {/* 이름 입력 필드 (선택) */}
      <View style={styles.nameSection}>
        <Text style={[styles.label, { color: colors.TEXT.PRIMARY }]}>
          {t('interest:labels.nameOptional')}
        </Text>
        <CrossPlatformInput
          style={[
            styles.input,
            { 
              backgroundColor: colors.BACKGROUND, 
              color: colors.TEXT.PRIMARY,
              borderColor: colors.BORDER,
            }
          ]}
          placeholder={t('interest:placeholders.nameOptional')}
          placeholderTextColor={colors.TEXT.LIGHT}
          value={name}
          onChangeText={onNameChange}
          maxLength={50}
        />
        <Text style={[styles.hint, { color: colors.TEXT.SECONDARY }]}>
          {t('interest:hints.nameDescription')}
        </Text>
      </View>

      {/* 성별 선택 */}
      <View style={styles.genderSection}>
        <Text style={[styles.label, { color: colors.TEXT.PRIMARY }]}>
          찾고자 하는 성별 <Text style={{ color: colors.ERROR }}>*</Text>
        </Text>
        <View style={styles.genderOptions}>
          {genderOptions.map((option) => (
            <TouchableOpacity
              key={option.id}
              style={[
                styles.genderOption,
                {
                  backgroundColor: selectedGender === option.id 
                    ? colors.PRIMARY + '20' 
                    : colors.SURFACE,
                  borderColor: selectedGender === option.id 
                    ? colors.PRIMARY 
                    : colors.BORDER,
                }
              ]}
              onPress={() => onGenderSelect?.(option.id)}
            >
              <Icon 
                name={option.icon} 
                size={20} 
                color={selectedGender === option.id ? colors.PRIMARY : colors.TEXT.SECONDARY} 
              />
              <Text style={[
                styles.genderLabel,
                { 
                  color: selectedGender === option.id 
                    ? colors.PRIMARY 
                    : colors.TEXT.PRIMARY 
                }
              ]}>
                {option.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
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
  nameSection: {
    marginTop: 20,
  },
  hint: {
    fontSize: 12,
    marginTop: 4,
    marginBottom: 12,
  },
  genderSection: {
    marginTop: 20,
  },
  genderOptions: {
    flexDirection: 'row',
    gap: 12,
  },
  genderOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    gap: 8,
  },
  genderLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
});