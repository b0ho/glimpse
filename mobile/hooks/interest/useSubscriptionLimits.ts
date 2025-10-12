/**
 * 구독 제한 관련 커스텀 훅
 *
 * @description 사용자의 구독 티어에 따른 관심상대 등록 제한을 관리합니다.
 * 무료/고급/프리미엄 구독자별로 다른 제한 정책을 적용하며, 로컬 및 서버 데이터를 모두 고려합니다.
 *
 * @returns {Object} 구독 제한 관련 상태 및 함수들
 * @returns {SubscriptionTier} subscriptionTier - 현재 구독 티어
 * @returns {Object} features - 구독 티어별 기능 제한
 * @returns {Function} getDefaultExpiryDate - 구독별 기본 만료일 반환
 * @returns {Function} getInitialDuration - 초기 기간 설정 반환
 * @returns {Function} checkSubscriptionLimits - 타입별 등록 가능 여부 확인
 * @returns {Function} getRemainingSlots - 남은 등록 가능 슬롯 수 반환
 * @returns {Function} getLimitMessage - 제한 도달 메시지 반환
 * @returns {Function} getUpgradeMessage - 업그레이드 안내 메시지 반환
 *
 * @example
 * ```tsx
 * const { checkSubscriptionLimits, getRemainingSlots } = useSubscriptionLimits();
 *
 * const canRegister = await checkSubscriptionLimits(InterestType.PHONE);
 * const remaining = await getRemainingSlots();
 * ```
 */
import { useAuthStore } from '@/store/slices/authSlice';
import { useInterestStore } from '@/store/slices/interestSlice';
import { InterestType } from '@/types/interest';
import { SubscriptionTier, SUBSCRIPTION_FEATURES } from '@/types/subscription';
import { canRegisterInterestType, getLocalInterestCards } from '@/utils/secureLocalStorage';

export const useSubscriptionLimits = () => {
  const { getSubscriptionTier, getSubscriptionFeatures } = useAuthStore();
  const { searches } = useInterestStore();
  
  const subscriptionTier = getSubscriptionTier();
  const features = getSubscriptionFeatures();

  /**
   * 구독 티어별 기본 만료일 설정
   */
  const getDefaultExpiryDate = () => {
    const date = new Date();
    const days = features.interestSearchDuration || 7;
    date.setDate(date.getDate() + days);
    return date;
  };

  /**
   * 구독 티어별 초기 기간 설정
   */
  const getInitialDuration = () => {
    if (subscriptionTier === SubscriptionTier.BASIC) return '3days';
    if (subscriptionTier === SubscriptionTier.ADVANCED) return '2weeks';
    return 'unlimited';
  };

  /**
   * 구독 티어에 따른 제한 확인
   */
  const checkSubscriptionLimits = async (type: InterestType): Promise<boolean> => {
    console.log('[useSubscriptionLimits] checkSubscriptionLimits - type:', type);
    console.log('[useSubscriptionLimits] subscriptionTier:', subscriptionTier);
    console.log('[useSubscriptionLimits] current searches:', searches.length);

    // 프리미엄 사용자는 제한 없음
    if (subscriptionTier === SubscriptionTier.PREMIUM) {
      console.log('[useSubscriptionLimits] Premium user - no limits');
      return true;
    }

    try {
      // 로컬 저장소의 관심 카드 수 확인
      const localCards = await getLocalInterestCards();
      const localCardCount = localCards.filter(card => card.userId === 'current_user').length;
      
      // 서버 + 로컬 카드 총합
      const totalSearches = searches.length + localCardCount;
      console.log('[useSubscriptionLimits] Total searches (server + local):', totalSearches);
      
      // 일일 제한 확인 (타입별)
      const canRegister = await canRegisterInterestType(type);
      if (!canRegister) {
        console.log('[useSubscriptionLimits] Daily limit reached for type:', type);
        return false;
      }
      
      // 최대 관심상대 수 제한
      const maxSearches = features.maxInterestSearches || 5;
      
      if (totalSearches >= maxSearches) {
        console.log(`[useSubscriptionLimits] Max searches reached: ${totalSearches}/${maxSearches}`);
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('[useSubscriptionLimits] Error checking limits:', error);
      // 에러 발생 시 서버 데이터만으로 체크
      const maxSearches = features.maxInterestSearches || 5;
      return searches.length < maxSearches;
    }
  };

  /**
   * 남은 관심상대 등록 가능 수
   */
  const getRemainingSlots = async (): Promise<number> => {
    const maxSearches = features.maxInterestSearches || 5;
    
    try {
      const localCards = await getLocalInterestCards();
      const localCardCount = localCards.filter(card => card.userId === 'current_user').length;
      const totalSearches = searches.length + localCardCount;
      return Math.max(0, maxSearches - totalSearches);
    } catch (error) {
      console.error('[useSubscriptionLimits] Error getting remaining slots:', error);
      return Math.max(0, maxSearches - searches.length);
    }
  };

  /**
   * 구독 티어별 제한 메시지
   */
  const getLimitMessage = (): string => {
    const maxSearches = features.maxInterestSearches || 5;
    
    switch (subscriptionTier) {
      case SubscriptionTier.BASIC:
        return `무료 사용자는 최대 ${maxSearches}명까지만 등록할 수 있습니다.`;
      case SubscriptionTier.ADVANCED:
        return `고급 구독자는 최대 ${maxSearches}명까지 등록할 수 있습니다.`;
      case SubscriptionTier.PREMIUM:
        return '프리미엄 구독자는 무제한으로 등록할 수 있습니다.';
      default:
        return `최대 ${maxSearches}명까지 등록할 수 있습니다.`;
    }
  };

  /**
   * 업그레이드 안내 메시지
   */
  const getUpgradeMessage = (): string => {
    switch (subscriptionTier) {
      case SubscriptionTier.BASIC:
        return '더 많은 관심상대를 등록하려면 고급 구독을 구매하세요.';
      case SubscriptionTier.ADVANCED:
        return '무제한 관심상대를 등록하려면 프리미엄 구독을 구매하세요.';
      default:
        return '구독을 업그레이드하면 더 많은 관심상대를 등록할 수 있습니다.';
    }
  };

  return {
    subscriptionTier,
    features,
    getDefaultExpiryDate,
    getInitialDuration,
    checkSubscriptionLimits,
    getRemainingSlots,
    getLimitMessage,
    getUpgradeMessage,
  };
};