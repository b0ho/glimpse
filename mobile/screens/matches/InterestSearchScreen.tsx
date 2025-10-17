/**
 * 관심상대 찾기 메인 화면 - NativeWind 버전
 *
 * @screen
 * @description 사용자가 관심상대나 친구를 찾기 위해 검색 조건을 등록하고 관리하는 화면
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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect, useIsFocused } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { InterestStackParamList } from '@/types/navigation';
import { IconWrapper as Icon } from '@/components/IconWrapper';
import { useTheme } from '@/hooks/useTheme';
import { useAndroidSafeTranslation } from '@/hooks/useAndroidSafeTranslation';
import { useAuthStore } from '@/store/slices/authSlice';
import Toast from 'react-native-toast-message';

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

/**
 * 네비게이션 타입 정의
 *
 * @type
 */
type InterestSearchScreenNavigationProp = StackNavigationProp<InterestStackParamList, 'InterestSearchScreen'>;

/**
 * 관심상대 찾기 메인 화면 컴포넌트
 *
 * @component
 * @returns {JSX.Element}
 *
 * @description
 * 관심사 기반 매칭 시스템의 핵심 화면으로, 다음 기능을 제공합니다:
 * - 내 정보 등록 (연락처, 위치, 그룹 등)
 * - 찾고자 하는 상대방 조건 등록
 * - 등록된 검색 목록 관리
 * - 매칭된 상대 목록 확인
 * - 연애/친구 모드 전환
 *
 * @features
 * - 연애/친구 탭 전환으로 목적별 검색 분리
 * - 검색 조건: 전화번호, 장소, 그룹, 학교/회사 등
 * - 실시간 매칭 알림
 * - 구독 상태에 따른 검색 제한 (무료: 3개, 프리미엄: 무제한)
 * - Pull-to-refresh로 데이터 갱신
 *
 * @navigation
 * - From: MainTabs (찾기 탭)
 * - To: AddInterest (검색 추가/수정)
 * - To: Chat (매칭 후 채팅 시작)
 * - To: PricingScreen (구독 업그레이드)
 *
 * @example
 * ```tsx
 * <Tab.Screen name="InterestSearch" component={InterestSearchScreen} />
 * ```
 */
export const InterestSearchScreen: React.FC = () => {
  const isFocused = useIsFocused();
  const navigation = useNavigation<InterestSearchScreenNavigationProp>();
  const { colors, isDark } = useTheme();
  const { t } = useAndroidSafeTranslation('interest');
  const { user, getSubscriptionTier, getSubscriptionFeatures } = useAuthStore();
  
  const [selectedTab, setSelectedTab] = useState<'interest' | 'friend'>('interest');
  
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
    }, [loadData])
  );

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

  const handleAddInterest = (registrationType: 'MY_INFO' | 'LOOKING_FOR' = 'LOOKING_FOR') => {
    // 모두 AddInterest 화면으로 이동, type 파라미터로 구분
    console.log(`[InterestSearchScreen] Navigating to AddInterest with type: ${registrationType}`);
    navigation.navigate('AddInterest', { 
      type: registrationType,
      relationshipType: selectedTab === 'interest' ? 'romantic' : 'friend'
    });
  };

  const renderSearchItem = ({ item }: { item: any }) => (
    <InterestCard
      item={item}
      isSecure={true}
      onPress={() => navigation.navigate('AddInterest', { 
        editItem: item,
        relationshipType: selectedTab === 'interest' ? 'romantic' : 'friend' 
      })}
      onDelete={() => handleDeleteSearch(item.id)}
    />
  );

  const renderMatchItem = ({ item }: { item: any }) => {
    return (
      <InterestCard
        item={item}
        isSecure={true}
        isMatch={true}
        onPress={() => handleChatPress(item)}
        onMismatch={() => handleReportMismatch(item)}
      />
    );
  };

  if (serverConnectionError) {
    return (
      <ServerConnectionError
        onRetry={handleRefresh}
        message={t('error.serverConnectionError')}
      />
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50 dark:bg-gray-900">
      {/* 헤더 섹션 */}
      <View className="bg-white dark:bg-gray-800 px-4 py-4">
        <Text className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          찾기
        </Text>
        <Text className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          관심상대와 친구를 찾아보세요
        </Text>
      </View>

      {/* 탭 바 */}
      <TabBar
        selectedTab={selectedTab}
        onTabChange={setSelectedTab}
        colors={colors}
      />

      {/* CTA 버튼 섹션 */}
      <View className="px-4 py-3" style={{ width: '100%', maxWidth: 768, alignSelf: 'center' }}>
        <TouchableOpacity
          className="bg-red-500 dark:bg-red-600 flex-row items-center justify-between px-5 py-4 rounded-xl mb-3 border border-red-400 dark:border-red-700 shadow-md"
          onPress={() => handleAddInterest('MY_INFO')}
          activeOpacity={0.8}
          style={{
            width: '100%',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 4,
            elevation: 3,
          }}
        >
          <View className="flex-row items-center flex-1 min-w-0">
            <View className="w-6 h-6 items-center justify-center mr-3 flex-shrink-0">
              <Icon name="person-add" size={22} color="#FFFFFF" />
            </View>
            <Text className="text-white font-bold text-base" numberOfLines={1} style={{ flex: 1 }}>
              내 정보 등록하기
            </Text>
          </View>
          <View className="w-5 h-5 items-center justify-center ml-2 flex-shrink-0">
            <Icon name="chevron-forward" size={18} color="#FFFFFF" />
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          className="bg-teal-500 dark:bg-teal-600 flex-row items-center justify-between px-5 py-4 rounded-xl border border-teal-400 dark:border-teal-700 shadow-md"
          onPress={() => handleAddInterest('LOOKING_FOR')}
          activeOpacity={0.8}
          style={{
            width: '100%',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 4,
            elevation: 3,
          }}
        >
          <View className="flex-row items-center flex-1 min-w-0">
            <View className="w-6 h-6 items-center justify-center mr-3 flex-shrink-0">
              <Icon name="heart" size={22} color="#FFFFFF" />
            </View>
            <Text className="text-white font-bold text-base" numberOfLines={1} style={{ flex: 1 }}>
              새로운 관심상대 등록하기
            </Text>
          </View>
          <View className="w-5 h-5 items-center justify-center ml-2 flex-shrink-0">
            <Icon name="chevron-forward" size={18} color="#FFFFFF" />
          </View>
        </TouchableOpacity>
      </View>

      {/* 컨텐츠 */}
      <ScrollView
        className="flex-1"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={colors.PRIMARY}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* 등록한 검색 섹션 */}
        <View className="px-4 py-3" style={{ width: '100%', maxWidth: 768, alignSelf: 'center' }}>
          <View className="flex-row items-center mb-3">
            <Icon name="search" size={20} color={colors.TEXT.SECONDARY} />
            <Text className="text-base font-semibold text-gray-900 dark:text-gray-100 ml-2" numberOfLines={1}>
              등록된 검색 ({filteredSearches.length})
            </Text>
          </View>

          {filteredSearches.length > 0 ? (
            <FlatList
              data={filteredSearches}
              keyExtractor={(item) => item.id}
              renderItem={renderSearchItem}
              scrollEnabled={false}
            />
          ) : (
            <View
              className="bg-white dark:bg-gray-800 rounded-2xl p-6 items-center shadow-xl"
              style={{ width: '100%', maxWidth: 600, alignSelf: 'center' }}
            >
              {/* 아이콘 */}
              <View className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-700 items-center justify-center mb-4">
                <Icon name="search-outline" size={32} color={colors.TEXT.TERTIARY} />
              </View>

              {/* 메인 텍스트 */}
              <Text
                className="text-lg font-bold text-gray-900 dark:text-gray-100 text-center mb-2"
                numberOfLines={2}
                style={{ width: '100%', maxWidth: 400 }}
              >
                {selectedTab === 'interest' ? '등록된 검색이 없습니다' : '등록된 친구 검색이 없습니다'}
              </Text>
              <Text
                className="text-sm text-gray-600 dark:text-gray-400 text-center mb-6"
                numberOfLines={3}
                style={{ width: '100%', maxWidth: 350 }}
              >
                {selectedTab === 'interest'
                  ? '관심있는 사람을 찾기 위해\n검색을 등록해보세요'
                  : '친구를 찾기 위해\n검색을 등록해보세요'}
              </Text>

              {/* CTA 버튼 */}
              <TouchableOpacity
                className="bg-red-500 px-8 py-3 rounded-full shadow-lg"
                onPress={() => handleAddInterest('LOOKING_FOR')}
                style={{
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.25,
                  shadowRadius: 12,
                  elevation: 6,
                  width: 'auto',
                }}
              >
                <Text className="text-white text-base font-bold" numberOfLines={1}>
                  + 등록하기
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* 매칭 섹션 */}
        <View className="px-4 py-3" style={{ width: '100%', maxWidth: 768, alignSelf: 'center' }}>
          <View className="flex-row items-center mb-3">
            <Text className="text-base font-semibold text-gray-900 dark:text-gray-100" numberOfLines={1}>
              매치 목록
            </Text>
            {filteredMatches.length > 0 && (
              <View className="bg-green-500 px-2 py-0.5 rounded-full ml-2">
                <Text className="text-xs text-white font-semibold" numberOfLines={1}>
                  {filteredMatches.length}
                </Text>
              </View>
            )}
          </View>

          {filteredMatches.length > 0 ? (
            <FlatList
              data={filteredMatches}
              keyExtractor={(item) => item.id}
              renderItem={renderMatchItem}
              scrollEnabled={false}
            />
          ) : (
            <EmptySection
              title={selectedTab === 'interest' ? '매치가 없습니다' : '친구 매치가 없습니다'}
              description={selectedTab === 'interest'
                ? '서로 관심을 등록하면 매치가 됩니다'
                : '서로 친구로 등록하면 매치가 됩니다'}
              type="match"
              colors={colors}
              t={t}
            />
          )}
        </View>

        {/* 구독 상태 카드 */}
        <View
          className="mx-4 mb-6 p-4 bg-white dark:bg-gray-800 rounded-xl"
          style={{ width: '100%', maxWidth: 760, alignSelf: 'center' }}
        >
          <View className="flex-row items-center">
            <Icon name="star-outline" size={20} color={colors.TEXT.SECONDARY} />
            <View className="flex-1 ml-3">
              <Text className="text-sm font-semibold text-gray-900 dark:text-gray-100" numberOfLines={1}>
                {subscriptionTier === 'PREMIUM' ? '프리미엄 플랜' : '무료 플랜'} 이용 중
              </Text>
              <Text className="text-xs text-gray-500 dark:text-gray-400 mt-0.5" numberOfLines={1}>
                등록 가능: {3 - filteredSearches.length}개 남음 • 유효기간: 3일
              </Text>
            </View>
            {subscriptionTier === 'BASIC' && (
              <TouchableOpacity
                className="bg-red-500 px-3 py-1.5 rounded-full"
                onPress={() => navigation.navigate('PricingScreen' as any)}
              >
                <Text className="text-xs text-white font-semibold" numberOfLines={1}>
                  업그레이드
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </ScrollView>

      {/* 성공 스토리 모달 */}
      {storyModalVisible && selectedMatch && (
        <CreateStoryModal
          visible={storyModalVisible}
          onClose={() => setStoryModalVisible(false)}
          onSubmit={handleSaveSuccessStory}
          matchInfo={{
            partnerNickname: selectedMatch.partnerNickname || selectedMatch.nickname || '매칭 상대',
            matchId: selectedMatch.id || selectedMatch.matchId || '',
          }}
        />
      )}
    </SafeAreaView>
  );
};