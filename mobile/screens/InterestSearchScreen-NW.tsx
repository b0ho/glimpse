/**
 * 관심상대 찾기 메인 화면 - NativeWind 버전
 * 
 * 데이팅 앱의 핵심 기능으로 스와이프 카드 UI와 매치 애니메이션 적용
 */
import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  Platform,
  Alert,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect, useIsFocused } from '@react-navigation/native';
import { IconWrapper as Icon } from '@/components/IconWrapper';
import { useTheme } from '@/hooks/useTheme';
import { useAndroidSafeTranslation } from '@/hooks/useAndroidSafeTranslation';
import { useAuthStore } from '@/store/slices/authSlice';
import Toast from 'react-native-toast-message';
import { LinearGradient } from 'expo-linear-gradient';
import { cn } from '@/lib/utils';
import Ionicons from 'react-native-vector-icons/Ionicons';

// Custom hooks
import { useInterestData } from '@/hooks/interestSearch/useInterestData';
import { useMatchHandlers } from '@/hooks/interestSearch/useMatchHandlers';

// Components
import { InterestCard } from '@/components/interest/InterestCard';
import { CreateStoryModal } from '@/components/successStory/CreateStoryModal';
import { ServerConnectionError } from '@/components/ServerConnectionError';
import { TabBar } from '@/components/interestSearch/TabBar';
import { EmptySection } from '@/components/interestSearch/EmptySection';

// Utils
import { showDeleteConfirm, getSearchInfo } from '@/utils/interestSearch/interestHelpers';

export const InterestSearchScreen: React.FC = () => {
  const isFocused = useIsFocused();
  const navigation = useNavigation<any>();
  const { colors, isDarkMode } = useTheme();
  const { t } = useAndroidSafeTranslation('interest');
  const { user, getSubscriptionTier, getSubscriptionFeatures } = useAuthStore();
  
  const [selectedTab, setSelectedTab] = useState<'interest' | 'friend'>('interest');
  const [pulseAnim] = useState(new Animated.Value(1));
  
  const subscriptionTier = getSubscriptionTier();
  const features = getSubscriptionFeatures();

  // 데이터 관리 훅
  const {
    loading,
    refreshing,
    serverConnectionError,
    filteredSearches,
    filteredMatches,
    matches,
    loadData,
    handleRefresh,
    handleDeleteSearch: deleteSearchFromHook,
  } = useInterestData(selectedTab);

  // 매칭 핸들러 훅
  const {
    storyModalVisible,
    selectedMatch,
    setStoryModalVisible,
    handleReportMismatch,
    handleChatPress,
    handleShareStory,
    handleSaveSuccessStory,
    handleDeleteMatch,
  } = useMatchHandlers();

  // 화면이 포커스될 때마다 데이터 새로고침
  useFocusEffect(
    useCallback(() => {
      console.log('[InterestSearchScreen] Screen focused - refreshing data');
      loadData();
      startPulseAnimation();
    }, [loadData])
  );

  // 하트 펄스 애니메이션
  const startPulseAnimation = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.2,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    ).start();
  };

  const handleDeleteSearch = async (searchId: string) => {
    const confirmed = await showDeleteConfirm();
    
    if (confirmed) {
      const success = await deleteSearchFromHook(searchId);
      
      if (success) {
        Toast.show({
          type: 'success',
          text1: '삭제 완료',
          text2: '검색이 삭제되었습니다',
          position: 'bottom',
          visibilityTime: 3000,
        });
      }
    }
  };

  // 웹에서 포커스되지 않은 경우
  if (Platform.OS === 'web' && !isFocused) {
    return <View className="flex-1" />;
  }

  // 서버 연결 에러 처리
  if (serverConnectionError) {
    return (
      <ServerConnectionError 
        onRetry={handleRefresh}
        message="관심상대 데이터를 불러올 수 없습니다"
      />
    );
  }

  const renderTabContent = () => {
    if (selectedTab === 'friend') {
      return (
        <ScrollView 
          className="flex-1"
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={colors.PRIMARY}
              colors={[colors.PRIMARY]}
            />
          }
          showsVerticalScrollIndicator={false}
        >
          {filteredMatches.length === 0 ? (
            <EmptySection
              title={t('interest:matches.empty.title')}
              subtitle={t('interest:matches.empty.subtitle')}
              icon="heart-outline"
              isFullHeight
            />
          ) : (
            <View className="px-4 py-2">
              {filteredMatches.map((match, index) => (
                <Animated.View
                  key={match.id}
                  style={{
                    transform: [{ scale: pulseAnim }],
                    opacity: index === 0 ? 1 : 0.9,
                  }}
                  className={cn(
                    "mb-4 rounded-2xl overflow-hidden",
                    "shadow-lg",
                    isDarkMode ? "bg-gray-900" : "bg-white"
                  )}
                >
                  <LinearGradient
                    colors={['#FF6B6B', '#FF8E53']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={{ height: 4 }}
                  />
                  <View className="p-4">
                    <View className="flex-row items-center justify-between mb-3">
                      <View className="flex-row items-center">
                        <View className={cn(
                          "w-12 h-12 rounded-full items-center justify-center",
                          "bg-gradient-to-br from-pink-500 to-red-500"
                        )}>
                          <Ionicons name="heart" size={24} color="white" />
                        </View>
                        <View className="ml-3">
                          <Text className={cn(
                            "text-lg font-bold",
                            isDarkMode ? "text-white" : "text-gray-900"
                          )}>
                            {match.nickname || '익명'}
                          </Text>
                          <Text className={cn(
                            "text-sm",
                            isDarkMode ? "text-gray-400" : "text-gray-600"
                          )}>
                            매치됨 · {match.matchedAt}
                          </Text>
                        </View>
                      </View>
                      <View className="flex-row">
                        <TouchableOpacity
                          onPress={() => handleChatPress(match)}
                          className={cn(
                            "px-4 py-2 rounded-full mr-2",
                            "bg-primary-500"
                          )}
                        >
                          <Text className="text-white font-semibold">채팅</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          onPress={() => handleDeleteMatch(match.id)}
                          className="p-2"
                        >
                          <Ionicons name="close-circle-outline" size={24} color="#EF4444" />
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                </Animated.View>
              ))}
            </View>
          )}
        </ScrollView>
      );
    }

    // Interest tab content
    return (
      <FlatList
        data={filteredSearches}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View className={cn(
            "mx-4 mb-4 rounded-2xl overflow-hidden",
            "shadow-lg",
            isDarkMode ? "bg-gray-900" : "bg-white"
          )}>
            <TouchableOpacity
              onPress={() => navigation.navigate('InterestDetail', { searchId: item.id })}
              activeOpacity={0.95}
            >
              <LinearGradient
                colors={isDarkMode ? ['#374151', '#1F2937'] : ['#FFFFFF', '#F9FAFB']}
                start={{ x: 0, y: 0 }}
                end={{ x: 0, y: 1 }}
                className="p-4"
              >
                <View className="flex-row items-center justify-between">
                  <View className="flex-1">
                    <View className="flex-row items-center mb-2">
                      <View className={cn(
                        "px-3 py-1 rounded-full mr-2",
                        item.category === 'dating' ? "bg-pink-100" : "bg-blue-100"
                      )}>
                        <Text className={cn(
                          "text-xs font-semibold",
                          item.category === 'dating' ? "text-pink-600" : "text-blue-600"
                        )}>
                          {item.category === 'dating' ? '데이팅' : '친구'}
                        </Text>
                      </View>
                      {item.isPremium && (
                        <View className="px-3 py-1 rounded-full bg-yellow-100">
                          <Text className="text-xs font-semibold text-yellow-700">
                            프리미엄
                          </Text>
                        </View>
                      )}
                    </View>
                    <Text className={cn(
                      "text-lg font-bold mb-1",
                      isDarkMode ? "text-white" : "text-gray-900"
                    )}>
                      {item.title}
                    </Text>
                    <Text className={cn(
                      "text-sm",
                      isDarkMode ? "text-gray-400" : "text-gray-600"
                    )} numberOfLines={2}>
                      {item.description}
                    </Text>
                  </View>
                  <View className="ml-3">
                    <Animated.View
                      style={{ transform: [{ scale: pulseAnim }] }}
                      className={cn(
                        "w-16 h-16 rounded-full items-center justify-center",
                        "bg-gradient-to-br from-pink-500 to-red-500"
                      )}
                    >
                      <Text className="text-white text-xl font-bold">
                        {item.matchCount || 0}
                      </Text>
                      <Text className="text-white text-xs">매치</Text>
                    </Animated.View>
                  </View>
                </View>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        )}
        ListEmptyComponent={
          <EmptySection
            title={t('interest:searches.empty.title')}
            subtitle={t('interest:searches.empty.subtitle')}
            icon="search-outline"
            isFullHeight
          />
        }
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={colors.PRIMARY}
            colors={[colors.PRIMARY]}
          />
        }
        contentContainerStyle={{ paddingVertical: 16 }}
        showsVerticalScrollIndicator={false}
      />
    );
  };

  return (
    <SafeAreaView 
      className={cn('flex-1', isDarkMode ? 'bg-gray-950' : 'bg-gray-50')}
      edges={Platform.OS === 'android' ? ['top'] : ['top', 'bottom']}
    >
      {/* Header */}
      <View className={cn(
        "px-4 py-4 border-b",
        isDarkMode ? "bg-gray-900 border-gray-800" : "bg-white border-gray-200"
      )}>
        <View className="flex-row items-center justify-between mb-3">
          <Text className={cn(
            "text-2xl font-bold",
            isDarkMode ? "text-white" : "text-gray-900"
          )}>
            💝 {t('interest:title')}
          </Text>
          <TouchableOpacity
            onPress={() => navigation.navigate('AddInterest')}
            className={cn(
              "px-4 py-2 rounded-full",
              "bg-gradient-to-r from-pink-500 to-red-500"
            )}
          >
            <View className="flex-row items-center">
              <Ionicons name="add-circle-outline" size={20} color="white" />
              <Text className="text-white font-semibold ml-1">
                {t('interest:actions.add')}
              </Text>
            </View>
          </TouchableOpacity>
        </View>
        
        {/* Tab Bar */}
        <View className="flex-row bg-gray-100 dark:bg-gray-800 rounded-xl p-1">
          <TouchableOpacity
            onPress={() => setSelectedTab('interest')}
            className={cn(
              "flex-1 py-3 rounded-lg",
              selectedTab === 'interest' 
                ? "bg-white dark:bg-gray-700" 
                : "bg-transparent"
            )}
          >
            <Text className={cn(
              "text-center font-semibold",
              selectedTab === 'interest'
                ? (isDarkMode ? "text-primary-400" : "text-primary-500")
                : (isDarkMode ? "text-gray-400" : "text-gray-600")
            )}>
              관심 검색
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setSelectedTab('friend')}
            className={cn(
              "flex-1 py-3 rounded-lg",
              selectedTab === 'friend' 
                ? "bg-white dark:bg-gray-700" 
                : "bg-transparent"
            )}
          >
            <Text className={cn(
              "text-center font-semibold",
              selectedTab === 'friend'
                ? (isDarkMode ? "text-primary-400" : "text-primary-500")
                : (isDarkMode ? "text-gray-400" : "text-gray-600")
            )}>
              매치 목록
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Content */}
      {renderTabContent()}

      {/* Story Modal */}
      <CreateStoryModal
        visible={storyModalVisible}
        onClose={() => setStoryModalVisible(false)}
        match={selectedMatch}
        onSave={handleSaveSuccessStory}
      />
    </SafeAreaView>
  );
};