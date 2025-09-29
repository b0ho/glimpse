/**
 * 관심상대 찾기 메인 화면 - NativeWind 버전
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

export const InterestSearchScreen: React.FC = () => {
  const isFocused = useIsFocused();
  const navigation = useNavigation<any>();
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
    // MY_INFO인 경우 간단한 프로필 수정 화면으로
    if (registrationType === 'MY_INFO') {
      navigation.navigate('MyInfoRegister');
    } else {
      // LOOKING_FOR인 경우 기존 복잡한 양식 화면으로
      console.log('[InterestSearchScreen] Navigating to AddInterest for LOOKING_FOR');
      navigation.navigate('AddInterest', { 
        type: registrationType,
        relationshipType: selectedTab === 'interest' ? 'romantic' : 'friend'
      });
    }
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
      <View className="px-4 py-3">
        <TouchableOpacity
          className="bg-red-500 flex-row items-center justify-between px-4 py-3 rounded-xl mb-2"
          onPress={() => handleAddInterest('MY_INFO')}
        >
          <View className="flex-row items-center">
            <Icon name="person-add" size={20} color="#FFFFFF" />
            <Text className="text-white font-semibold ml-3">
              내 정보 등록하기
            </Text>
          </View>
          <Icon name="chevron-forward" size={20} color="#FFFFFF" />
        </TouchableOpacity>
        
        <TouchableOpacity
          className="bg-teal-500 flex-row items-center justify-between px-4 py-3 rounded-xl"
          onPress={() => handleAddInterest('LOOKING_FOR')}
        >
          <View className="flex-row items-center">
            <Icon name="heart" size={20} color="#FFFFFF" />
            <Text className="text-white font-semibold ml-3">
              새로운 관심상대 등록하기
            </Text>
          </View>
          <Icon name="chevron-forward" size={20} color="#FFFFFF" />
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
        <View className="px-4 py-3">
          <View className="flex-row items-center mb-3">
            <Icon name="search" size={20} color={colors.TEXT.SECONDARY} />
            <Text className="text-base font-semibold text-gray-900 dark:text-gray-100 ml-2">
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
            <View className="bg-white dark:bg-gray-800 rounded-xl p-6 items-center">
              <Icon name="search-outline" size={48} color={colors.TEXT.TERTIARY} />
              <Text className="text-lg font-semibold text-gray-900 dark:text-gray-100 mt-3">
                {selectedTab === 'interest' ? '등록된 검색이 없습니다' : '등록된 친구 검색이 없습니다'}
              </Text>
              <Text className="text-sm text-gray-500 dark:text-gray-400 text-center mt-2">
                {selectedTab === 'interest' 
                  ? '관심있는 사람을 찾기 위해 다양한 조건으로 검색을 등록해보세요'
                  : '친구를 찾기 위해 다양한 조건으로 검색을 등록해보세요'}
              </Text>
              <TouchableOpacity
                className="bg-red-500 px-5 py-2.5 rounded-full flex-row items-center mt-4"
                onPress={() => handleAddInterest('LOOKING_FOR')}
              >
                <Icon name="add" size={20} color="#FFFFFF" />
                <Text className="text-white font-semibold ml-1">
                  첫 검색 등록하기
                </Text>
              </TouchableOpacity>
              
              {/* 검색 팁 */}
              <View className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 mt-4 w-full">
                <Text className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">
                  💡 검색 팁
                </Text>
                <View className="flex-row items-center mb-2">
                  <Icon name="call" size={16} color={colors.TEXT.SECONDARY} />
                  <Text className="text-xs text-gray-500 dark:text-gray-400 ml-2">
                    연락처의 전화번호로 아는 사람 찾기
                  </Text>
                </View>
                <View className="flex-row items-center mb-2">
                  <Icon name="location" size={16} color={colors.TEXT.SECONDARY} />
                  <Text className="text-xs text-gray-500 dark:text-gray-400 ml-2">
                    특정 장소에서 만난 사람 찾기
                  </Text>
                </View>
                <View className="flex-row items-center">
                  <Icon name="people" size={16} color={colors.TEXT.SECONDARY} />
                  <Text className="text-xs text-gray-500 dark:text-gray-400 ml-2">
                    같은 그룹에 있는 사람 찾기
                  </Text>
                </View>
              </View>
            </View>
          )}
        </View>

        {/* 매칭 섹션 */}
        <View className="px-4 py-3">
          <View className="flex-row items-center mb-3">
            <Text className="text-base font-semibold text-gray-900 dark:text-gray-100">
              매치 목록
            </Text>
            {filteredMatches.length > 0 && (
              <View className="bg-green-500 px-2 py-0.5 rounded-full ml-2">
                <Text className="text-xs text-white font-semibold">
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
        <View className="mx-4 mb-6 p-4 bg-white dark:bg-gray-800 rounded-xl">
          <View className="flex-row items-center">
            <Icon name="star-outline" size={20} color={colors.TEXT.SECONDARY} />
            <View className="flex-1 ml-3">
              <Text className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                {subscriptionTier === 'PREMIUM' ? '프리미엄 플랜' : '무료 플랜'} 이용 중
              </Text>
              <Text className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                등록 가능: {3 - filteredSearches.length}개 남음 • 유효기간: 3일
              </Text>
            </View>
            {subscriptionTier === 'FREE' && (
              <TouchableOpacity
                className="bg-red-500 px-3 py-1.5 rounded-full"
                onPress={() => navigation.navigate('PricingScreen')}
              >
                <Text className="text-xs text-white font-semibold">
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
          onSave={handleSaveSuccessStory}
          matchInfo={getSearchInfo(selectedMatch)}
        />
      )}
    </SafeAreaView>
  );
};