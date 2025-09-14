import React from 'react';
import { View, Image, Text, TouchableOpacity, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { IconWrapper as Icon } from '@/components/IconWrapper';

interface AvatarProps {
  source?: { uri: string } | number;
  name?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  onPress?: () => void;
  showOnline?: boolean;
  isOnline?: boolean;
  showBadge?: boolean;
  badgeContent?: string | number;
  badgeColor?: string;
  gradient?: boolean;
  className?: string;
  animate?: boolean;
}

const sizeMap = {
  xs: { container: 'w-8 h-8', text: 'text-xs', badge: 'w-2 h-2', badgeText: 'text-xs' },
  sm: { container: 'w-10 h-10', text: 'text-sm', badge: 'w-3 h-3', badgeText: 'text-xs' },
  md: { container: 'w-12 h-12', text: 'text-base', badge: 'w-3 h-3', badgeText: 'text-xs' },
  lg: { container: 'w-16 h-16', text: 'text-lg', badge: 'w-4 h-4', badgeText: 'text-sm' },
  xl: { container: 'w-20 h-20', text: 'text-xl', badge: 'w-5 h-5', badgeText: 'text-sm' },
};

export const Avatar: React.FC<AvatarProps> = ({
  source,
  name,
  size = 'md',
  onPress,
  showOnline = false,
  isOnline = false,
  showBadge = false,
  badgeContent,
  badgeColor = '#FF6B6B',
  gradient = false,
  className = '',
  animate = false,
}) => {
  const sizes = sizeMap[size];
  const pulseAnim = React.useRef(new Animated.Value(1)).current;
  const fadeAnim = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    if (animate) {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }).start();
    }

    if (showOnline && isOnline) {
      // Pulse animation for online status
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.2,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      ).start();
    }
  }, [animate, showOnline, isOnline]);

  const getInitials = (name: string) => {
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  const avatarContent = () => {
    if (source) {
      return (
        <Image
          source={source}
          className={`${sizes.container} rounded-full`}
          resizeMode="cover"
        />
      );
    }

    if (name) {
      const initials = getInitials(name);
      if (gradient) {
        return (
          <LinearGradient
            colors={['#FF6B6B', '#FF8A8A']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            className={`${sizes.container} rounded-full items-center justify-center`}
          >
            <Text className={`${sizes.text} text-white font-bold`}>{initials}</Text>
          </LinearGradient>
        );
      }
      return (
        <View className={`${sizes.container} rounded-full bg-gray-300 dark:bg-gray-600 items-center justify-center`}>
          <Text className={`${sizes.text} text-gray-600 dark:text-gray-300 font-bold`}>
            {initials}
          </Text>
        </View>
      );
    }

    return (
      <View className={`${sizes.container} rounded-full bg-gray-300 dark:bg-gray-600 items-center justify-center`}>
        <Icon name="person" size={parseInt(sizes.container.split('-')[1]) * 2} color="#9CA3AF" />
      </View>
    );
  };

  const content = (
    <View className={`relative ${className}`}>
      {avatarContent()}
      
      {/* Online status indicator */}
      {showOnline && isOnline && (
        <Animated.View
          style={{
            transform: [{ scale: pulseAnim }],
          }}
          className={`absolute bottom-0 right-0 ${sizes.badge} bg-green-500 rounded-full border-2 border-white dark:border-gray-800`}
        />
      )}

      {/* Badge */}
      {showBadge && badgeContent !== undefined && (
        <View
          className={`absolute -top-1 -right-1 bg-red-500 rounded-full px-1.5 py-0.5 min-w-[18px] items-center justify-center`}
          style={{ backgroundColor: badgeColor }}
        >
          <Text className={`text-white font-bold ${sizes.badgeText}`}>
            {badgeContent}
          </Text>
        </View>
      )}
    </View>
  );

  const animatedContent = animate ? (
    <Animated.View style={{ opacity: fadeAnim }}>
      {content}
    </Animated.View>
  ) : content;

  if (onPress) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.8}>
        {animatedContent}
      </TouchableOpacity>
    );
  }

  return animatedContent;
};

// Specialized avatar variants for dating app
export const MatchAvatar: React.FC<AvatarProps> = (props) => (
  <Avatar
    gradient
    animate
    showOnline
    {...props}
  />
);

export const GroupAvatar: React.FC<AvatarProps> = (props) => (
  <Avatar
    size="lg"
    gradient
    {...props}
  />
);

export const StoryAvatar: React.FC<AvatarProps> = (props) => {
  const [viewed, setViewed] = React.useState(false);
  
  return (
    <TouchableOpacity onPress={() => { setViewed(true); props.onPress?.(); }}>
      <View className="p-0.5 rounded-full">
        <LinearGradient
          colors={viewed ? ['#9CA3AF', '#6B7280'] : ['#FF6B6B', '#8B5CF6']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          className="p-0.5 rounded-full"
        >
          <View className="bg-white dark:bg-gray-900 p-0.5 rounded-full">
            <Avatar {...props} />
          </View>
        </LinearGradient>
      </View>
    </TouchableOpacity>
  );
};