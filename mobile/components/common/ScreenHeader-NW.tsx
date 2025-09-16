/**
 * 공통 스크린 헤더 컴포넌트
 */
import React from 'react';
import { View, Text, TouchableOpacity} from 'react-native';
import { IconWrapper as Icon } from '@/components/IconWrapper';
import { useNavigation } from '@react-navigation/native';

interface ScreenHeaderProps {
  title?: string;
  onBackPress?: () => void;
  rightComponent?: React.ReactNode;
  showBackButton?: boolean;
  colors: any;
}

export const ScreenHeader: React.FC<ScreenHeaderProps> = ({
  title,
  onBackPress,
  rightComponent,
  showBackButton = true,
  colors,
}) => {
  const navigation = useNavigation();
  
  const handleBack = () => {
    if (onBackPress) {
      onBackPress();
    } else {
      navigation.goBack();
    }
  };

  return (
    <View className="header">
      {showBackButton ? (
        <TouchableOpacity onPress={handleBack} className="backButton">
          <Icon name="arrow-back" size={24} color={colors.TEXT.PRIMARY} />
        </TouchableOpacity>
      ) : (
        <View className="placeholder" />
      )}
      
      {title && (
        <Text className="title">
          {title}
        </Text>
      )}
      
      {rightComponent ? (
        <View className="rightContainer">
          {rightComponent}
        </View>
      ) : (
        <View className="placeholder" />
      )}
    </View>
  );
};

