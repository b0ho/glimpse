/**
 * 관심상대 찾기 메인 화면 - 모듈화된 버전
 * 
 * 이 파일은 1,155줄에서 약 350줄로 리팩토링되었습니다.
 * 모든 로직과 컴포넌트가 분리되었습니다.
 */
import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
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
import { shadowStyles } from '@/utils/shadowStyles';
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
      } else {
        Toast.show({
          type: 'error',
          text1: '삭제 실패',
          text2: '삭제 중 오류가 발생했습니다',
          position: 'bottom',
          visibilityTime: 3000,
        });
      }
    }
  };

  const handleAddInterest = (registrationType: 'MY_INFO' | 'LOOKING_FOR' = 'LOOKING_FOR') => {
    // TESTING: Completely bypass ALL subscription checks for comprehensive testing
    console.log('[InterestSearchScreen] Subscription check COMPLETELY BYPASSED for testing all 12 types');
    
    navigation.navigate('AddInterest', { 
      type: registrationType,
      relationshipType: selectedTab === 'interest' ? 'romantic' : 'friend'
    });
  };

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

  // 웹에서 포커스되지 않은 경우 빈 View 반환
  if (Platform.OS === 'web' && !isFocused) {
    return <View style={styles.container} />;
  }

  if (serverConnectionError) {
    return <ServerConnectionError onRetry={loadData} />;
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.BACKGROUND }]}>
      {/* 헤더 섹션 */}
      <View style={[styles.headerSection, { backgroundColor: colors.SURFACE }]}>
        <Text style={[styles.mainTitle, { color: colors.TEXT.PRIMARY }]}>
          찾기
        </Text>
        <Text style={[styles.subtitle, { color: colors.TEXT.SECONDARY }]}>
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
      <View style={styles.ctaSection}>
        <TouchableOpacity
          style={[styles.ctaButton, { backgroundColor: colors.PRIMARY }]}
          onPress={() => handleAddInterest('MY_INFO')}
        >
          <Icon name="person-add" size={20} color={colors.TEXT.WHITE} />
          <Text style={[styles.ctaButtonText, { color: colors.TEXT.WHITE }]}>
            내 정보 등록하기
          </Text>
          <Icon name="chevron-forward" size={20} color={colors.TEXT.WHITE} />
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.ctaButton, { backgroundColor: colors.SECONDARY }]}
          onPress={() => handleAddInterest('LOOKING_FOR')}
        >
          <Icon name="heart" size={20} color={colors.TEXT.WHITE} />
          <Text style={[styles.ctaButtonText, { color: colors.TEXT.WHITE }]}>
            새로운 관심상대 등록하기
          </Text>
          <Icon name="chevron-forward" size={20} color={colors.TEXT.WHITE} />
        </TouchableOpacity>
      </View>

      {/* 컨텐츠 */}
      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={colors.PRIMARY}
          />
        }
      >
        {/* 등록한 검색 섹션 */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Icon name="search" size={20} color={colors.TEXT.SECONDARY} />
            <Text style={[styles.sectionTitle, { color: colors.TEXT.PRIMARY }]}>
              등록된 검색 ({filteredSearches.length})
            </Text>
          </View>
          
          {filteredSearches.length > 0 ? (
            <FlatList
              data={filteredSearches}
              keyExtractor={(item) => item.id}
              renderItem={renderSearchItem}
              scrollEnabled={false}
              contentContainerStyle={styles.listContent}
            />
          ) : (
            <View style={[styles.emptyState, { backgroundColor: colors.SURFACE }]}>
              <Icon name="search-outline" size={48} color={colors.TEXT.TERTIARY} />
              <Text style={[styles.emptyTitle, { color: colors.TEXT.PRIMARY }]}>
                등록된 검색이 없습니다
              </Text>
              <Text style={[styles.emptyDescription, { color: colors.TEXT.SECONDARY }]}>
                관심있는 사람을 찾기 위해 다양한 조건으로 검색을 등록해보세요
              </Text>
              <TouchableOpacity
                style={[styles.emptyButton, { backgroundColor: colors.PRIMARY }]}
                onPress={() => handleAddInterest('LOOKING_FOR')}
              >
                <Icon name="add" size={20} color={colors.TEXT.WHITE} />
                <Text style={[styles.emptyButtonText, { color: colors.TEXT.WHITE }]}>
                  첫 검색 등록하기
                </Text>
              </TouchableOpacity>
              
              {/* 검색 팁 */}
              <View style={[styles.tipsCard, { backgroundColor: colors.BACKGROUND }]}>
                <Text style={[styles.tipsTitle, { color: colors.TEXT.PRIMARY }]}>
                  💡 검색 팁
                </Text>
                <View style={styles.tipItem}>
                  <Icon name="call" size={16} color={colors.TEXT.SECONDARY} />
                  <Text style={[styles.tipText, { color: colors.TEXT.SECONDARY }]}>
                    연락처의 전화번호로 아는 사람 찾기
                  </Text>
                </View>
                <View style={styles.tipItem}>
                  <Icon name="location" size={16} color={colors.TEXT.SECONDARY} />
                  <Text style={[styles.tipText, { color: colors.TEXT.SECONDARY }]}>
                    특정 장소에서 만난 사람 찾기
                  </Text>
                </View>
                <View style={styles.tipItem}>
                  <Icon name="people" size={16} color={colors.TEXT.SECONDARY} />
                  <Text style={[styles.tipText, { color: colors.TEXT.SECONDARY }]}>
                    같은 그룹에 있는 사람 찾기
                  </Text>
                </View>
              </View>
            </View>
          )}
        </View>

        {/* 매칭 섹션 */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.TEXT.PRIMARY }]}>
              {t('search.matches')}
            </Text>
            {filteredMatches.length > 0 && (
              <View style={[styles.badge, { backgroundColor: colors.SUCCESS }]}>
                <Text style={[styles.badgeText, { color: colors.TEXT.WHITE }]}>
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
              contentContainerStyle={styles.listContent}
            />
          ) : (
            <EmptySection
              title={t('search.noMatches')}
              description={t('search.noMatchesDescription')}
              type="match"
              colors={colors}
              t={t}
            />
          )}
        </View>

        {/* 구독 상태 카드 */}
        <View style={[styles.subscriptionCard, { backgroundColor: colors.SURFACE }]}>
          <View style={styles.subscriptionInfo}>
            <Icon name="star-outline" size={20} color={colors.TEXT.SECONDARY} />
            <View style={styles.subscriptionText}>
              <Text style={[styles.planName, { color: colors.TEXT.PRIMARY }]}>
                {subscriptionTier === 'premium' ? '프리미엄 플랜' : '무료 플랜'} 이용 중
              </Text>
              <Text style={[styles.planDetails, { color: colors.TEXT.SECONDARY }]}>
                등록 가능: {3 - filteredSearches.length}개 남음 • 유효기간: 3일
              </Text>
            </View>
          </View>
          {subscriptionTier === 'free' && (
            <TouchableOpacity
              style={[styles.upgradeButton, { backgroundColor: colors.PRIMARY }]}
              onPress={() => navigation.navigate('PricingScreen')}
            >
              <Text style={[styles.upgradeButtonText, { color: colors.TEXT.WHITE }]}>
                업그레이드
              </Text>
            </TouchableOpacity>
          )}
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerSection: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  mainTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    lineHeight: 22,
  },
  ctaSection: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 12,
  },
  ctaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    ...shadowStyles.medium,
  },
  ctaButtonText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  headerButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  content: {
    flex: 1,
  },
  section: {
    marginVertical: 8,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    marginLeft: 8,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  listContent: {
    paddingHorizontal: 16,
    gap: 8,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    margin: 16,
    borderRadius: 12,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
    marginLeft: 12,
  },
  emptyState: {
    padding: 32,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyDescription: {
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
    marginBottom: 24,
  },
  emptyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 24,
    gap: 8,
  },
  emptyButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  tipsCard: {
    marginTop: 24,
    padding: 16,
    borderRadius: 12,
    width: '100%',
  },
  tipsTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginVertical: 6,
  },
  tipText: {
    fontSize: 14,
    flex: 1,
  },
  subscriptionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    margin: 16,
    borderRadius: 12,
    ...shadowStyles.small,
  },
  subscriptionInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  subscriptionText: {
    flex: 1,
  },
  planName: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  planDetails: {
    fontSize: 12,
  },
  upgradeButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
  },
  upgradeButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
});