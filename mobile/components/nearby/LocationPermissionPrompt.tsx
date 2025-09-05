/**
 * 위치 권한 요청 프롬프트 컴포넌트
 */
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { IconWrapper as Icon } from '@/components/IconWrapper';

interface LocationPermissionPromptProps {
  onRequestPermission: () => void;
  isLoading: boolean;
  colors: any;
  t: (key: string) => string;
}

export const LocationPermissionPrompt: React.FC<LocationPermissionPromptProps> = ({
  onRequestPermission,
  isLoading,
  colors,
  t,
}) => {
  return (
    <View style={[styles.container, { backgroundColor: colors.BACKGROUND }]}>
      <View style={[styles.card, { backgroundColor: colors.SURFACE }]}>
        <Icon name="location" size={64} color={colors.PRIMARY} />
        <Text style={[styles.title, { color: colors.TEXT.PRIMARY }]}>
          {t('location:permissionRequired')}
        </Text>
        <Text style={[styles.description, { color: colors.TEXT.SECONDARY }]}>
          {t('location:permissionDescription')}
        </Text>
        
        <TouchableOpacity
          style={[styles.button, { backgroundColor: colors.PRIMARY }]}
          onPress={onRequestPermission}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color={colors.TEXT.WHITE} />
          ) : (
            <>
              <Icon name="location-outline" size={20} color={colors.TEXT.WHITE} />
              <Text style={[styles.buttonText, { color: colors.TEXT.WHITE }]}>
                {t('location:enableLocation')}
              </Text>
            </>
          )}
        </TouchableOpacity>

        <View style={styles.features}>
          <View style={styles.feature}>
            <Icon name="shield-checkmark-outline" size={20} color={colors.SUCCESS} />
            <Text style={[styles.featureText, { color: colors.TEXT.SECONDARY }]}>
              {t('location:privacyProtected')}
            </Text>
          </View>
          <View style={styles.feature}>
            <Icon name="people-outline" size={20} color={colors.INFO} />
            <Text style={[styles.featureText, { color: colors.TEXT.SECONDARY }]}>
              {t('location:findNearbyUsers')}
            </Text>
          </View>
          <View style={styles.feature}>
            <Icon name="settings-outline" size={20} color={colors.WARNING} />
            <Text style={[styles.featureText, { color: colors.TEXT.SECONDARY }]}>
              {t('location:controlSettings')}
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  card: {
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  description: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
    marginBottom: 24,
    minWidth: 200,
    justifyContent: 'center',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  features: {
    width: '100%',
    gap: 12,
  },
  feature: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  featureText: {
    fontSize: 12,
    marginLeft: 8,
  },
});