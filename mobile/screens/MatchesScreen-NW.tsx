/**
 * 매칭 화면 - NativeWind 버전
 * 
 * 서로 좋아요한 사용자들과의 매칭을 보여주는 데이팅 앱 핵심 화면
 * 하트 애니메이션과 스와이프 카드 UI로 로맨틱한 경험 제공
 */
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
  Platform,
  Animated,
  Dimensions,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useIsFocused } from '@react-navigation/native';
import { useAndroidSafeTranslation } from '@/hooks/useAndroidSafeTranslation';
import { useLikeStore } from '@/store/slices/likeSlice';
import { useAuthStore } from '@/store/slices/authSlice';
import { useTheme } from '@/hooks/useTheme';
import { Match } from '@/types';
import { formatTimeAgo } from '@/utils/dateUtils';
import { matchApi } from '@/services/api/matchApi';
import { ServerConnectionError } from '@/components/ServerConnectionError';
import { LinearGradient } from 'expo-linear-gradient';
import { cn } from '@/lib/utils';
import Ionicons from 'react-native-vector-icons/Ionicons';

const { width: screenWidth } = Dimensions.get('window');
const CARD_WIDTH = screenWidth - 32;

export const MatchesScreen = React.memo(() => {
  const isFocused = useIsFocused();
  const [matches, setMatches] = useState<Match[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [serverConnectionError, setServerConnectionError] = useState(false);
  
  const navigation = useNavigation();
  const likeStore = useLikeStore();
  const { user } = useAuthStore();
  const { colors, isDarkMode } = useTheme();
  const { t } = useAndroidSafeTranslation('matches');
  
  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const heartBeats = useRef(matches.map(() => new Animated.Value(1))).current;
  const cardAnimations = useRef<Animated.Value[]>([]).current;
  
  // Initialize card animations
  useEffect(() => {
    matches.forEach((_, index) => {
      if (!cardAnimations[index]) {
        cardAnimations[index] = new Animated.Value(0);
      }
    });
  }, [matches]);
  
  // Entry animations
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 4,
        useNativeDriver: true,
      }),
    ]).start();
    
    // Staggered card animations
    matches.forEach((_, index) => {
      if (cardAnimations[index]) {
        Animated.timing(cardAnimations[index], {
          toValue: 1,
          duration: 400,
          delay: index * 100,
          useNativeDriver: true,
        }).start();
      }
    });
  }, [matches]);
  
  // Heart beat animation
  const startHeartBeat = (index: number) => {
    if (!heartBeats[index]) {
      heartBeats[index] = new Animated.Value(1);
    }
    
    Animated.loop(
      Animated.sequence([
        Animated.timing(heartBeats[index], {
          toValue: 1.2,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(heartBeats[index], {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(heartBeats[index], {
          toValue: 1.1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(heartBeats[index], {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ])
    ).start();
  };
  
  // Load matches
  useEffect(() => {
    if (!isLoading) return;
    
    const loadMatches = async () => {
      try {
        setServerConnectionError(false);
        const matchData = await matchApi.getMatches();
        setMatches(matchData);
        likeStore.setMatches(matchData);
        setIsLoading(false);
        
        // Start heart animations
        matchData.forEach((_, index) => {
          setTimeout(() => startHeartBeat(index), index * 200);
        });
      } catch (error) {
        console.error('[MatchesScreen] Failed to load matches:', error);
        setMatches([]);
        setServerConnectionError(true);
        setIsLoading(false);
      }
    };
    
    loadMatches();
  }, []);
  
  const handleStartChat = (matchId: string, nickname: string) => {
    const roomId = `room_${matchId}`;
    (navigation as any).navigate('Chat', {
      roomId,
      matchId,
      otherUserNickname: nickname,
    });
  };
  
  const handleReportMismatch = (matchId: string, nickname: string) => {
    Alert.alert(
      t('matches:mismatch.reportTitle'),
      t('matches:mismatch.reportMessage', { nickname }),
      [
        {
          text: t('matches:mismatch.cancel'),
          style: 'cancel',
        },
        {
          text: t('matches:mismatch.report'),
          style: 'destructive',
          onPress: async () => {
            try {
              await matchApi.reportMismatch(matchId, '사용자가 미스매치를 신고했습니다.');
              setMatches(prevMatches => prevMatches.filter(m => m.id !== matchId));
              
              Alert.alert(
                t('matches:mismatch.reportCompleteTitle'),
                t('matches:mismatch.reportCompleteMessage'),
                [{ text: t('matches:mismatch.confirm') }]
              );
            } catch (error) {
              console.error('[MatchesScreen] Failed to report mismatch:', error);
              Alert.alert(
                t('matches:mismatch.errorTitle'),
                t('matches:mismatch.errorMessage'),
                [{ text: t('matches:mismatch.confirm') }]
              );
            }
          },
        },
      ]
    );
  };
  
  const renderMatchCard = ({ item, index }: { item: Match; index: number }) => {
    const otherUserId = item.user1Id === user?.id ? item.user2Id : item.user1Id;
    const displayName = user?.id 
      ? likeStore.getUserDisplayName(otherUserId, user.id)
      : t('matches:user.anonymous');
    
    const cardOpacity = cardAnimations[index] || new Animated.Value(1);
    const cardScale = (cardAnimations[index] || new Animated.Value(1)).interpolate({
      inputRange: [0, 1],
      outputRange: [0.8, 1],
    });
    
    return (
      <Animated.View
        style={{
          opacity: cardOpacity,
          transform: [{ scale: cardScale }],
        }}
        className="mb-4"
      >
        <View className={cn(
          "mx-4 rounded-3xl overflow-hidden",
          "shadow-xl",
          isDarkMode ? "bg-gray-900" : "bg-white"
        )}>
          {/* Gradient Header */}
          <LinearGradient
            colors={['#FF6B6B', '#FF8E53']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{ height: 120, padding: 16 }}
          >
            <View className="flex-row items-center justify-between h-full">
              <View className="flex-row items-center flex-1">
                {/* Animated Avatar */}
                <Animated.View
                  style={{ transform: [{ scale: heartBeats[index] || 1 }] }}
                  className="w-16 h-16 rounded-full bg-white/20 items-center justify-center mr-3"
                >
                  <Text className="text-2xl font-bold text-white">
                    {displayName.charAt(0)}
                  </Text>
                </Animated.View>
                
                <View className="flex-1">
                  <Text className="text-xl font-bold text-white mb-1">
                    {displayName}
                  </Text>
                  <View className="flex-row items-center">
                    <Ionicons name="time-outline" size={14} color="rgba(255,255,255,0.8)" />
                    <Text className="text-sm text-white/80 ml-1">
                      {formatTimeAgo(new Date(item.matchedAt || item.createdAt))}
                    </Text>
                  </View>
                </View>
              </View>
              
              {/* Match Hearts Animation */}
              <Animated.View
                style={{ transform: [{ scale: heartBeats[index] || 1 }] }}
                className="absolute right-4"
              >
                <View className="flex-row">
                  <Ionicons name="heart" size={24} color="white" />
                  <Ionicons name="heart" size={24} color="white" style={{ marginLeft: -8 }} />
                </View>
              </Animated.View>
            </View>
          </LinearGradient>
          
          {/* Card Content */}
          <View className="p-4">
            <Text className={cn(
              "text-center mb-4",
              isDarkMode ? "text-gray-400" : "text-gray-600"
            )}>
              {t('matches:messages.matchDescription')}
            </Text>
            
            {/* Action Buttons */}
            <View className="flex-row space-x-3">
              <TouchableOpacity
                onPress={() => handleStartChat(item.id, displayName)}
                className="flex-1"
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={isDarkMode ? ['#4ECDC4', '#36B3AA'] : ['#4ECDC4', '#45B7D1']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  className="py-3 rounded-xl flex-row items-center justify-center"
                >
                  <Ionicons name="chatbubbles" size={20} color="white" />
                  <Text className="text-white font-bold ml-2">
                    {t('matches:actions.startChat')}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
              
              <TouchableOpacity
                onPress={() => handleReportMismatch(item.id, displayName)}
                className={cn(
                  "w-12 h-12 rounded-xl items-center justify-center",
                  "bg-red-500"
                )}
                activeOpacity={0.7}
              >
                <Ionicons name="warning" size={20} color="white" />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Animated.View>
    );
  };
  
  const renderHeader = () => (
    <Animated.View
      style={{ opacity: fadeAnim, transform: [{ scale: scaleAnim }] }}
      className={cn(
        "mx-4 mb-4 p-4 rounded-2xl",
        isDarkMode ? "bg-gray-900" : "bg-white"
      )}
    >
      <View className="flex-row items-center mb-3">
        <View className="w-12 h-12 rounded-full bg-gradient-to-br from-pink-500 to-red-500 items-center justify-center mr-3">
          <Ionicons name="heart" size={24} color="white" />
        </View>
        <View>
          <Text className={cn(
            "text-2xl font-bold",
            isDarkMode ? "text-white" : "text-gray-900"
          )}>
            {t('matches:header.title')}
          </Text>
          <Text className={cn(
            "text-sm",
            isDarkMode ? "text-gray-400" : "text-gray-600"
          )}>
            {t('matches:header.subtitle')}
          </Text>
        </View>
      </View>
      
      {/* Stats Cards */}
      <View className="flex-row space-x-3">
        <View className={cn(
          "flex-1 p-3 rounded-xl",
          isDarkMode ? "bg-gray-800" : "bg-pink-50"
        )}>
          <View className="flex-row items-center">
            <Ionicons 
              name="people" 
              size={20} 
              color={isDarkMode ? '#FF8A8A' : '#FF6B6B'} 
            />
            <Text className={cn(
              "ml-2 font-semibold",
              isDarkMode ? "text-white" : "text-gray-900"
            )}>
              {matches.length}
            </Text>
          </View>
          <Text className={cn(
            "text-xs mt-1",
            isDarkMode ? "text-gray-400" : "text-gray-600"
          )}>
            {t('matches:stats.totalMatches', { count: matches.length })}
          </Text>
        </View>
        
        <View className={cn(
          "flex-1 p-3 rounded-xl",
          isDarkMode ? "bg-gray-800" : "bg-blue-50"
        )}>
          <View className="flex-row items-center">
            <Ionicons 
              name="heart-circle" 
              size={20} 
              color={isDarkMode ? '#4ECDC4' : '#45B7D1'} 
            />
            <Text className={cn(
              "ml-2 font-semibold",
              isDarkMode ? "text-white" : "text-gray-900"
            )}>
              {likeStore.getReceivedLikesCount()}
            </Text>
          </View>
          <Text className={cn(
            "text-xs mt-1",
            isDarkMode ? "text-gray-400" : "text-gray-600"
          )}>
            {t('matches:stats.receivedLikes', { count: likeStore.getReceivedLikesCount() })}
          </Text>
        </View>
      </View>
    </Animated.View>
  );
  
  const renderEmptyState = () => (
    <View className="flex-1 items-center justify-center px-8 py-16">
      <Animated.View
        style={{
          transform: [
            {
              rotate: fadeAnim.interpolate({
                inputRange: [0, 1],
                outputRange: ['0deg', '360deg'],
              }),
            },
          ],
        }}
        className="mb-6"
      >
        <Text className="text-6xl">💝</Text>
      </Animated.View>
      <Text className={cn(
        "text-xl font-bold mb-2",
        isDarkMode ? "text-white" : "text-gray-900"
      )}>
        {t('matches:emptyState.title')}
      </Text>
      <Text className={cn(
        "text-center",
        isDarkMode ? "text-gray-400" : "text-gray-600"
      )}>
        {t('matches:emptyState.subtitle')}
      </Text>
    </View>
  );
  
  if (Platform.OS === 'web' && !isFocused) {
    return <View className="flex-1" />;
  }
  
  if (serverConnectionError) {
    return (
      <ServerConnectionError 
        onRetry={async () => {
          setServerConnectionError(false);
          setIsLoading(true);
          const loadMatches = async () => {
            try {
              const matchData = await matchApi.getMatches();
              setMatches(matchData);
              likeStore.setMatches(matchData);
              setIsLoading(false);
            } catch (error) {
              console.error('[MatchesScreen] Failed to load matches:', error);
              setMatches([]);
              setServerConnectionError(true);
              setIsLoading(false);
            }
          };
          await loadMatches();
        }}
        message="매칭 정보를 불러올 수 없습니다"
      />
    );
  }
  
  if (isLoading) {
    return (
      <SafeAreaView 
        className={cn('flex-1', isDarkMode ? 'bg-gray-950' : 'bg-gray-50')}
        edges={Platform.OS === 'android' ? ['top'] : ['top', 'bottom']}
      >
        <View className="flex-1 items-center justify-center">
          <Animated.View
            style={{
              transform: [
                {
                  rotate: fadeAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: ['0deg', '360deg'],
                  }),
                },
              ],
            }}
            className="mb-4"
          >
            <Ionicons name="heart" size={48} color={isDarkMode ? '#FF8A8A' : '#FF6B6B'} />
          </Animated.View>
          <ActivityIndicator size="large" color={isDarkMode ? '#FF8A8A' : '#FF6B6B'} />
          <Text className={cn(
            "mt-4 font-medium",
            isDarkMode ? "text-gray-400" : "text-gray-600"
          )}>
            {t('common:loading.text')}
          </Text>
        </View>
      </SafeAreaView>
    );
  }
  
  return (
    <SafeAreaView 
      className={cn('flex-1', isDarkMode ? 'bg-gray-950' : 'bg-gray-50')}
      edges={Platform.OS === 'android' ? ['top'] : ['top', 'bottom']}
    >
      <FlatList
        data={matches}
        keyExtractor={(item) => item.id}
        renderItem={renderMatchCard}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmptyState}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={matches.length === 0 ? { flexGrow: 1 } : { paddingBottom: 20 }}
      />
    </SafeAreaView>
  );
});