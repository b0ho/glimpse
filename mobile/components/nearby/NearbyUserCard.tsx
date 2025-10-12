/**
 * 주변 사용자 카드 컴포넌트
 */
import React, { useRef, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Animated,
  PanResponder,
  Alert,
} from 'react-native';
import { IconWrapper as Icon } from '@/components/IconWrapper';
import { NearbyUser } from '@/types';
import { LinearGradient } from 'expo-linear-gradient';
import { shadowStyles } from '@/utils/shadowStyles';

interface NearbyUserCardProps {
  user: NearbyUser;
  onLike: () => void;
  onHide: () => void;
  onChat: () => void;
  isLiked: boolean;
  canLike: boolean;
  colors: any;
  t: (key: string) => string;
}

export const NearbyUserCard: React.FC<NearbyUserCardProps> = ({
  user,
  onLike,
  onHide,
  onChat,
  isLiked,
  canLike,
  colors,
  t,
}) => {
  const pan = useRef(new Animated.ValueXY()).current;
  const rotateCard = pan.x.interpolate({
    inputRange: [-200, 0, 200],
    outputRange: ['-10deg', '0deg', '10deg'],
  });

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return Math.abs(gestureState.dx) > 5;
      },
      onPanResponderMove: Animated.event(
        [null, { dx: pan.x, dy: pan.y }],
        { useNativeDriver: false }
      ),
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dx > 120) {
          // 오른쪽 스와이프 - 좋아요
          if (canLike && !isLiked) {
            Animated.spring(pan, {
              toValue: { x: 500, y: 0 },
              useNativeDriver: true,
            }).start(() => {
              onLike();
              pan.setValue({ x: 0, y: 0 });
            });
          } else {
            Animated.spring(pan, {
              toValue: { x: 0, y: 0 },
              useNativeDriver: true,
            }).start();
          }
        } else if (gestureState.dx < -120) {
          // 왼쪽 스와이프 - 숨기기
          Animated.spring(pan, {
            toValue: { x: -500, y: 0 },
            useNativeDriver: true,
          }).start(() => {
            onHide();
            pan.setValue({ x: 0, y: 0 });
          });
        } else {
          Animated.spring(pan, {
            toValue: { x: 0, y: 0 },
            useNativeDriver: true,
          }).start();
        }
      },
    })
  ).current;

  const formatDistance = (distance: number) => {
    if (distance < 1) {
      return `${Math.round(distance * 1000)}m`;
    }
    return `${distance.toFixed(1)}km`;
  };

  return (
    <Animated.View
      style={{
        transform: [
          { translateX: pan.x },
          { translateY: pan.y },
          { rotate: rotateCard },
        ],
      }}
      className="mx-4 my-2 rounded-2xl overflow-hidden bg-white dark:bg-gray-800"
      {...panResponder.panHandlers}
    >
      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.7)']}
        className="gradient"
      >
        <View className="userInfo">
          <View className="header">
            <Text className="nickname">
              {user.nickname}
            </Text>
            <View className="distanceBadge">
              <Icon name="location-outline" size={14} color={colors.TEXT.WHITE} />
              <Text className="distance">
                {formatDistance(user.distance)}
              </Text>
            </View>
          </View>

          {user.persona && (
            <View className="personaInfo">
              <Text className="bio">
                {user.persona.bio}
              </Text>
              <View className="tags">
                {user.persona.interests?.map((interest, index) => (
                  <View key={index} className="tag">
                    <Text className="tagText">
                      {interest}
                    </Text>
                  </View>
                ))}
              </View>
              <View className="metadata">
                {user.persona.ageRange && (
                  <Text className="metaText">
                    {user.persona.ageRange}
                  </Text>
                )}
                {user.persona.occupation && (
                  <Text className="metaText">
                    {user.persona.occupation}
                  </Text>
                )}
              </View>
            </View>
          )}

          {user.mutualGroups && user.mutualGroups.length > 0 && (
            <View className="mutualGroups">
              <Icon name="people-outline" size={14} color={colors.TEXT.LIGHT} />
              <Text className="mutualGroupsText">
                {`${user.mutualGroups.length} ${t('location:mutualGroups')}`}
              </Text>
            </View>
          )}
        </View>

        <View className="actions">
          <TouchableOpacity
            className="actionButton hideButton"
            onPress={onHide}
          >
            <Icon name="close" size={28} color="#FF4458" />
          </TouchableOpacity>

          {isLiked ? (
            <View className="actionButton likedButton">
              <Icon name="heart" size={28} color="#4FC3F7" />
            </View>
          ) : (
            <TouchableOpacity
              className="actionButton likeButton"
              onPress={canLike ? onLike : undefined}
              disabled={!canLike}
            >
              <Icon name="heart-outline" size={28} color={canLike ? "#4FC3F7" : "#999"} />
            </TouchableOpacity>
          )}

          <TouchableOpacity
            className="actionButton chatButton"
            onPress={onChat}
          >
            <Icon name="chatbubble-outline" size={28} color="#9C27B0" />
          </TouchableOpacity>
        </View>
      </LinearGradient>
    </Animated.View>
  );
};

