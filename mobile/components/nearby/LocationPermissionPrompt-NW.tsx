/**
 * 위치 권한 요청 프롬프트 컴포넌트
 */
import React from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { IconWrapper as Icon } from '@/components/IconWrapper';
import { shadowStyles } from '@/utils/shadowStyles';

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
    <View className="container">
      <View className="card">
        <Icon name="location" size={64} color={colors.PRIMARY} />
        <Text className="title">
          {t('location:permissionRequired')}
        </Text>
        <Text className="description">
          {t('location:permissionDescription')}
        </Text>
        
        <TouchableOpacity
          className="button"
          onPress={onRequestPermission}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color={colors.TEXT.WHITE} />
          ) : (
            <>
              <Icon name="location-outline" size={20} color={colors.TEXT.WHITE} />
              <Text className="buttonText">
                {t('location:enableLocation')}
              </Text>
            </>
          )}
        </TouchableOpacity>

        <View className="features">
          <View className="feature">
            <Icon name="shield-checkmark-outline" size={20} color={colors.SUCCESS} />
            <Text className="featureText">
              {t('location:privacyProtected')}
            </Text>
          </View>
          <View className="feature">
            <Icon name="people-outline" size={20} color={colors.INFO} />
            <Text className="featureText">
              {t('location:findNearbyUsers')}
            </Text>
          </View>
          <View className="feature">
            <Icon name="settings-outline" size={20} color={colors.WARNING} />
            <Text className="featureText">
              {t('location:controlSettings')}
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
};

