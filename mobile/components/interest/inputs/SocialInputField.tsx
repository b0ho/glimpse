/**
 * 소셜 ID 입력 컴포넌트
 */
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { CrossPlatformInput } from '@/components/CrossPlatformInput';
import { IconWrapper as Icon } from '@/components/IconWrapper';
import { SOCIAL_PLATFORM_OPTIONS } from '@/constants/interest/interestTypes';

interface SocialInputFieldProps {
  value: string;
  onChange: (value: string) => void;
  selectedPlatform?: string;
  onPlatformSelect: (platform: string) => void;
  nickname?: string;
  onNicknameChange?: (value: string) => void;
  showAdditionalOptions: boolean;
  onToggleAdditionalOptions: () => void;
  colors: any;
  t: (key: string) => string;
}

export const SocialInputField: React.FC<SocialInputFieldProps> = ({
  value,
  onChange,
  selectedPlatform,
  onPlatformSelect,
  nickname,
  onNicknameChange,
  showAdditionalOptions,
  onToggleAdditionalOptions,
  colors,
  t,
}) => {
  return (
    <View style={styles.container}>
      <Text style={[styles.label, { color: colors.TEXT.SECONDARY }]}>
        {t('interest:platform')} *
      </Text>
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.platformScroll}
      >
        {SOCIAL_PLATFORM_OPTIONS.map((platform) => (
          <TouchableOpacity
            key={platform.id}
            style={[
              styles.platformButton,
              {
                backgroundColor: selectedPlatform === platform.id 
                  ? colors.PRIMARY 
                  : colors.SURFACE,
                borderColor: selectedPlatform === platform.id 
                  ? colors.PRIMARY 
                  : colors.BORDER,
              }
            ]}
            onPress={() => onPlatformSelect(platform.id)}
          >
            <Text style={[
              styles.platformButtonText,
              { 
                color: selectedPlatform === platform.id 
                  ? colors.TEXT.WHITE 
                  : colors.TEXT.PRIMARY 
              }
            ]}>
              {platform.name}
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
        placeholder={selectedPlatform === 'instagram' ? '@username' : 'username'}
        placeholderTextColor={colors.TEXT.LIGHT}
        value={value}
        onChangeText={onChange}
        autoCapitalize="none"
      />

      <TouchableOpacity
        style={[styles.additionalOptionsButton, { backgroundColor: colors.SURFACE }]}
        onPress={onToggleAdditionalOptions}
      >
        <Icon 
          name={showAdditionalOptions ? "chevron-up" : "chevron-down"} 
          size={20} 
          color={colors.TEXT.SECONDARY} 
        />
        <Text style={[styles.additionalOptionsText, { color: colors.TEXT.SECONDARY }]}>
          {t('interest:additionalInfo')}
        </Text>
      </TouchableOpacity>

      {showAdditionalOptions && nickname !== undefined && (
        <View style={styles.additionalContainer}>
          <Text style={[styles.label, { color: colors.TEXT.SECONDARY }]}>
            {t('interest:nickname')}
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
            placeholder={t('interest:nicknamePlaceholder')}
            placeholderTextColor={colors.TEXT.LIGHT}
            value={nickname}
            onChangeText={onNicknameChange}
          />
        </View>
      )}
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
  platformScroll: {
    marginBottom: 12,
  },
  platformButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
  },
  platformButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    marginBottom: 12,
  },
  additionalOptionsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  additionalOptionsText: {
    marginLeft: 8,
    fontSize: 14,
  },
  additionalContainer: {
    marginTop: 12,
  },
});