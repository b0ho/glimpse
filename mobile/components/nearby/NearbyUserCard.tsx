/**
 * 주변 사용자 카드 컴포넌트
 */
import React, { useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
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
      style={[
        styles.card,
        {
          backgroundColor: colors.SURFACE,
          transform: [
            { translateX: pan.x },
            { translateY: pan.y },
            { rotate: rotateCard },
          ],
        },
      ]}
      {...panResponder.panHandlers}
    >
      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.7)']}
        style={styles.gradient}
      >
        <View style={styles.userInfo}>
          <View style={styles.header}>
            <Text style={[styles.nickname, { color: colors.TEXT.WHITE }]}>
              {user.nickname}
            </Text>
            <View style={[styles.distanceBadge, { backgroundColor: colors.PRIMARY }]}>
              <Icon name="location-outline" size={14} color={colors.TEXT.WHITE} />
              <Text style={[styles.distance, { color: colors.TEXT.WHITE }]}>
                {formatDistance(user.distance)}
              </Text>
            </View>
          </View>

          {user.persona && (
            <View style={styles.personaInfo}>
              <Text style={[styles.bio, { color: colors.TEXT.WHITE }]}>
                {user.persona.bio}
              </Text>
              <View style={styles.tags}>
                {user.persona.interests?.map((interest, index) => (
                  <View key={index} style={[styles.tag, { backgroundColor: colors.PRIMARY + '40' }]}>
                    <Text style={[styles.tagText, { color: colors.TEXT.WHITE }]}>
                      {interest}
                    </Text>
                  </View>
                ))}
              </View>
              <View style={styles.metadata}>
                {user.persona.ageRange && (
                  <Text style={[styles.metaText, { color: colors.TEXT.LIGHT }]}>
                    {user.persona.ageRange}
                  </Text>
                )}
                {user.persona.occupation && (
                  <Text style={[styles.metaText, { color: colors.TEXT.LIGHT }]}>
                    {user.persona.occupation}
                  </Text>
                )}
              </View>
            </View>
          )}

          {user.mutualGroups && user.mutualGroups.length > 0 && (
            <View style={styles.mutualGroups}>
              <Icon name="people-outline" size={14} color={colors.TEXT.LIGHT} />
              <Text style={[styles.mutualGroupsText, { color: colors.TEXT.LIGHT }]}>
                {t('location:mutualGroups', { count: user.mutualGroups.length })}
              </Text>
            </View>
          )}
        </View>

        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.actionButton, styles.hideButton]}
            onPress={onHide}
          >
            <Icon name="close" size={28} color="#FF4458" />
          </TouchableOpacity>

          {isLiked ? (
            <View style={[styles.actionButton, styles.likedButton]}>
              <Icon name="heart" size={28} color="#4FC3F7" />
            </View>
          ) : (
            <TouchableOpacity
              style={[
                styles.actionButton,
                styles.likeButton,
                !canLike && styles.disabledButton
              ]}
              onPress={canLike ? onLike : undefined}
              disabled={!canLike}
            >
              <Icon name="heart-outline" size={28} color={canLike ? "#4FC3F7" : "#999"} />
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={[styles.actionButton, styles.chatButton]}
            onPress={onChat}
          >
            <Icon name="chatbubble-outline" size={28} color="#9C27B0" />
          </TouchableOpacity>
        </View>
      </LinearGradient>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  card: {
    flex: 1,
    borderRadius: 16,
    overflow: 'hidden',
    marginHorizontal: 16,
    marginVertical: 8,
    ...shadowStyles.card,
  },
  gradient: {
    flex: 1,
    justifyContent: 'flex-end',
    padding: 20,
  },
  userInfo: {
    marginBottom: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  nickname: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  distanceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  distance: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  personaInfo: {
    marginTop: 12,
  },
  bio: {
    fontSize: 16,
    lineHeight: 22,
    marginBottom: 12,
  },
  tags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 8,
  },
  tag: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 16,
  },
  tagText: {
    fontSize: 12,
    fontWeight: '500',
  },
  metadata: {
    flexDirection: 'row',
    gap: 12,
  },
  metaText: {
    fontSize: 14,
  },
  mutualGroups: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  mutualGroupsText: {
    fontSize: 12,
    marginLeft: 4,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.2)',
  },
  actionButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255,255,255,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    ...shadowStyles.button,
  },
  hideButton: {},
  likeButton: {},
  likedButton: {
    backgroundColor: 'rgba(79, 195, 247, 0.2)',
  },
  chatButton: {},
  disabledButton: {
    opacity: 0.5,
  },
});