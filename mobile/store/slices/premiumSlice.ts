/**
 * 프리미엄 구독 상태 관리 Zustand 슬라이스
 * @module premiumSlice
 * @description 프리미엄 구독, 결제, 좋아요 관리
 */

import { create, persist, createJSONStorage } from '../zustandCompat';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { 
  PremiumPlan, 
  LikePackage, 
  SubscriptionInfo, 
  PaymentProduct, 
  PremiumFeatures,
  premiumService 
} from '@/services/payment/premium-service';

/**
 * 프리미엄 상태 인터페이스
 * @interface PremiumState
 * @description 구독 정보, 좋아요 상태, 결제 상태 관리
 */
interface PremiumState {
  // 구독 정보
  /** 현재 구독 정보 */
  subscription: SubscriptionInfo | null;
  
  // 좋아요 상태
  /** 남은 일일 무료 좋아요 */
  dailyLikesRemaining: number;
  /** 총 구매한 좋아요 수 */
  totalPurchasedLikes: number;
  /** 마지막 일일 리셋 시간 */
  lastDailyReset: Date | null;
  
  // UI 상태
  /** 로딩 상태 */
  isLoading: boolean;
  /** 에러 메시지 */
  error: string | null;
  
  // 결제 상태
  /** 결제 처리 중 여부 */
  isProcessingPayment: boolean;
  
  // 상품 목록
  /** 결제 상품 목록 */
  paymentProducts: PaymentProduct[];
}

/**
 * 프리미엄 액션 인터페이스
 * @interface PremiumActions
 * @description 프리미엄 관련 모든 액션 메서드
 */
interface PremiumActions {
  // 구독 관련
  /** 구독 정보 로드 */
  loadSubscription: (userId: string) => Promise<void>;
  /** 구독 상태 업데이트 */
  updateSubscriptionStatus: (subscription: SubscriptionInfo) => void;
  
  // 결제 관련
  /** 결제 시작 */
  initiatePurchase: (productId: string, userId: string) => Promise<{clientSecret: string}>;
  /** 결제 확인 */
  confirmPayment: (userId: string, productId: string) => Promise<void>;
  /** 구독 취소 */
  cancelSubscription: (userId: string) => Promise<void>;
  
  // 좋아요 관련
  /** 좋아요 사용 */
  useLike: (userId: string) => Promise<boolean>;
  /** 구매한 좋아요 추가 */
  addPurchasedLikes: (amount: number) => void;
  /** 일일 리셋 확인 */
  checkDailyReset: (userId: string) => Promise<void>;
  
  // 기능 확인
  /** 특정 기능 보유 여부 */
  hasFeature: (feature: keyof PremiumFeatures) => boolean;
  /** 좋아요 전송 가능 여부 */
  canSendLike: () => boolean;
  /** 남은 좋아요 수 */
  getRemainingLikes: () => number;
  
  // 상품 관리
  /** 결제 상품 로드 */
  loadPaymentProducts: () => void;
  
  // 유틸리티
  /** 에러 초기화 */
  clearError: () => void;
  /** 로딩 상태 설정 */
  setLoading: (loading: boolean) => void;
  /** 상태 초기화 */
  reset: () => void;
}

/**
 * 프리미엄 스토어 타입
 * @type PremiumStore
 * @description 프리미엄 상태와 액션을 포함한 전체 스토어 타입
 */
type PremiumStore = PremiumState & PremiumActions;

/**
 * 프리미엄 상태 초기값
 * @constant initialState
 * @description 프리미엄 스토어의 초기 상태
 */
const initialState: PremiumState = {
  subscription: null,
  dailyLikesRemaining: 1,
  totalPurchasedLikes: 0,
  lastDailyReset: null,
  isLoading: false,
  error: null,
  isProcessingPayment: false,
  paymentProducts: [],
};

/**
 * 프리미엄 상태 관리 스토어
 * @constant usePremiumStore
 * @description 프리미엄 구독, 결제, 좋아요 관리를 위한 Zustand 스토어
 * @example
 * ```typescript
 * const { subscription, hasFeature, useLike } = usePremiumStore();
 * ```
 */
export const usePremiumStore = create<PremiumStore>()(
  persist(
    (set, get) => ({
      ...initialState,

      /**
       * 구독 정보 로드
       * @async
       * @param {string} userId - 사용자 ID
       * @returns {Promise<void>}
       * @description 서버에서 현재 구독 상태를 가져와 업데이트
       */
      loadSubscription: async (userId: string) => {
        set({ isLoading: true, error: null });
        
        try {
          const subscription = await premiumService.getCurrentSubscription(userId);
          
          set({ 
            subscription,
            dailyLikesRemaining: subscription.dailyLikesRemaining,
            totalPurchasedLikes: subscription.totalPurchasedLikes,
            isLoading: false 
          });
          
          // 일일 리셋 확인
          await get().checkDailyReset(userId);
        } catch (error) {
          console.error('Failed to load subscription:', error);
          set({ 
            error: error instanceof Error ? error.message : '구독 정보를 불러오는데 실패했습니다.',
            isLoading: false 
          });
        }
      },

      /**
       * 구독 상태 업데이트
       * @param {SubscriptionInfo} subscription - 업데이트할 구독 정보
       * @description 구독 상태와 관련 데이터를 업데이트
       */
      updateSubscriptionStatus: (subscription: SubscriptionInfo) => {
        set({ 
          subscription,
          dailyLikesRemaining: subscription.dailyLikesRemaining,
          totalPurchasedLikes: subscription.totalPurchasedLikes,
        });
      },

      /**
       * 결제 시작
       * @async
       * @param {string} productId - 상품 ID
       * @param {string} userId - 사용자 ID
       * @returns {Promise<{clientSecret: string}>} 결제 클라이언트 시크릿
       * @description Stripe 결제를 위한 PaymentIntent 또는 Subscription 생성
       * @throws {Error} 결제 시작 실패 시
       */
      initiatePurchase: async (productId: string, userId: string) => {
        set({ isProcessingPayment: true, error: null });
        
        try {
          // 구독 상품인지 일회성 상품인지 확인
          const products = get().paymentProducts;
          const product = products.find(p => p.id === productId);
          
          if (!product) {
            throw new Error('상품을 찾을 수 없습니다.');
          }

          let result;
          if (product.type === 'subscription') {
            result = await premiumService.createSubscription(productId, userId);
          } else {
            result = await premiumService.createPaymentIntent(productId, userId);
          }
          
          return result;
        } catch (error) {
          console.error('Failed to initiate purchase:', error);
          set({ 
            error: error instanceof Error ? error.message : '결제를 시작하는데 실패했습니다.',
            isProcessingPayment: false 
          });
          throw error;
        }
      },

      /**
       * 결제 확인
       * @async
       * @param {string} userId - 사용자 ID
       * @param {string} productId - 상품 ID
       * @returns {Promise<void>}
       * @description 결제 성공 후 구독 정보 업데이트 및 좋아요 추가
       */
      confirmPayment: async (userId: string, productId: string) => {
        try {
          // 결제 성공 후 구독 정보 새로고침
          await get().loadSubscription(userId);
          
          // 좋아요 패키지인 경우 좋아요 수량 추가
          const products = get().paymentProducts;
          const product = products.find(p => p.id === productId);
          
          if (product && product.type === 'one_time') {
            let likesToAdd = 0;
            switch (productId as LikePackage) {
              case LikePackage.SMALL:
                likesToAdd = 5;
                break;
              case LikePackage.MEDIUM:
                likesToAdd = 10;
                break;
              case LikePackage.LARGE:
                likesToAdd = 20;
                break;
              case LikePackage.EXTRA:
                likesToAdd = 50;
                break;
            }
            
            if (likesToAdd > 0) {
              get().addPurchasedLikes(likesToAdd);
            }
          }
          
          set({ isProcessingPayment: false });
        } catch (error) {
          console.error('Failed to confirm payment:', error);
          set({ 
            error: error instanceof Error ? error.message : '결제 확인에 실패했습니다.',
            isProcessingPayment: false 
          });
        }
      },

      /**
       * 구독 취소
       * @async
       * @param {string} userId - 사용자 ID
       * @returns {Promise<void>}
       * @description 현재 활성 구독을 취소
       */
      cancelSubscription: async (userId: string) => {
        set({ isLoading: true, error: null });
        
        try {
          await premiumService.cancelSubscription(userId);
          
          // 구독 정보 새로고침
          await get().loadSubscription(userId);
        } catch (error) {
          console.error('Failed to cancel subscription:', error);
          set({ 
            error: error instanceof Error ? error.message : '구독 취소에 실패했습니다.',
            isLoading: false 
          });
        }
      },

      /**
       * 좋아요 사용
       * @async
       * @param {string} userId - 사용자 ID
       * @returns {Promise<boolean>} 사용 성공 여부
       * @description 좋아요를 사용하고 남은 좋아요 수 감소
       */
      useLike: async (userId: string) => {
        const state = get();
        
        // 사용 가능한 좋아요가 있는지 확인
        if (!state.canSendLike()) {
          return false;
        }

        try {
          // 무제한 좋아요가 있는 경우 서버 호출 없이 통과
          if (state.hasFeature('unlimitedLikes')) {
            return true;
          }

          // 서버에서 좋아요 사용 처리
          const result = await premiumService.useLike(userId);
          
          if (result.success) {
            // 로컬 상태 업데이트
            if (state.dailyLikesRemaining > 0) {
              set({ dailyLikesRemaining: state.dailyLikesRemaining - 1 });
            } else if (state.totalPurchasedLikes > 0) {
              set({ totalPurchasedLikes: state.totalPurchasedLikes - 1 });
            }
            
            return true;
          }
          
          return false;
        } catch (error) {
          console.error('Failed to use like:', error);
          return false;
        }
      },

      /**
       * 구매한 좋아요 추가
       * @param {number} amount - 추가할 좋아요 수
       * @description 좋아요 패키지 구매 시 좋아요 수 추가
       */
      addPurchasedLikes: (amount: number) => {
        const state = get();
        set({ totalPurchasedLikes: state.totalPurchasedLikes + amount });
      },

      /**
       * 일일 리셋 확인
       * @async
       * @param {string} userId - 사용자 ID
       * @returns {Promise<void>}
       * @description 매일 자정에 무료 좋아요를 리셋
       */
      checkDailyReset: async (userId: string) => {
        const state = get();
        const now = new Date();
        const lastReset = state.lastDailyReset;
        
        // 마지막 리셋이 없거나 다른 날인 경우 리셋
        if (!lastReset || 
            now.getDate() !== lastReset.getDate() || 
            now.getMonth() !== lastReset.getMonth() || 
            now.getFullYear() !== lastReset.getFullYear()) {
          
          try {
            await premiumService.checkDailyReset(userId);
            
            // 무료 사용자는 1개, 프리미엄은 무제한이므로 1개로 설정
            const dailyLikes = state.hasFeature('unlimitedLikes') ? 999 : 1;
            
            set({ 
              dailyLikesRemaining: dailyLikes,
              lastDailyReset: now,
            });
          } catch (error) {
            console.error('Failed to check daily reset:', error);
          }
        }
      },

      /**
       * 특정 기능 보유 여부 확인
       * @param {keyof PremiumFeatures} feature - 확인할 기능
       * @returns {boolean} 기능 보유 여부
       * @description 현재 구독 플랜에서 특정 기능을 사용할 수 있는지 확인
       */
      hasFeature: (feature: keyof PremiumFeatures) => {
        const subscription = get().subscription;
        return subscription?.features[feature] || false;
      },

      /**
       * 좋아요 전송 가능 여부
       * @returns {boolean} 전송 가능 여부
       * @description 무제한 좋아요, 일일 무료 좋아요, 구매 좋아요 확인
       */
      canSendLike: () => {
        const state = get();
        
        // 무제한 좋아요가 있는 경우
        if (state.hasFeature('unlimitedLikes')) {
          return true;
        }
        
        // 일일 무료 좋아요나 구매한 좋아요가 있는 경우
        return state.dailyLikesRemaining > 0 || state.totalPurchasedLikes > 0;
      },

      /**
       * 남은 좋아요 수
       * @returns {number} 남은 좋아요 수
       * @description 무제한인 경우 999, 아니면 일일 + 구매 좋아요 합계
       */
      getRemainingLikes: () => {
        const state = get();
        
        if (state.hasFeature('unlimitedLikes')) {
          return 999; // 무제한을 나타내는 큰 수
        }
        
        return state.dailyLikesRemaining + state.totalPurchasedLikes;
      },

      /**
       * 결제 상품 로드
       * @description 사용 가능한 모든 결제 상품 목록 로드
       */
      loadPaymentProducts: () => {
        const products = premiumService.getPaymentProducts();
        set({ paymentProducts: products });
      },

      /**
       * 에러 초기화
       * @description 에러 메시지를 초기화
       */
      clearError: () => {
        set({ error: null });
      },

      /**
       * 로딩 상태 설정
       * @param {boolean} loading - 로딩 여부
       */
      setLoading: (loading: boolean) => {
        set({ isLoading: loading });
      },

      /**
       * 상태 초기화
       * @description 모든 프리미엄 상태를 초기값으로 리셋
       */
      reset: () => {
        set(initialState);
      },
    }),
    {
      /** 저장소 키 이름 */
      name: 'premium-storage',
      /** AsyncStorage를 사용하는 커스텀 저장소 */
      storage: createJSONStorage(() => AsyncStorage),
      /**
       * 영속화할 상태 선택
       * @description 민감한 정보는 제외하고 필수 정보만 저장
       */
      partialize: (state) => ({
        // 민감한 정보는 제외하고 필요한 정보만 저장
        dailyLikesRemaining: state.dailyLikesRemaining,
        totalPurchasedLikes: state.totalPurchasedLikes,
        lastDailyReset: state.lastDailyReset,
        subscription: state.subscription ? {
          plan: state.subscription.plan,
          isActive: state.subscription.isActive,
          expiresAt: state.subscription.expiresAt,
          features: state.subscription.features,
        } : null,
      }),
    }
  )
);

/**
 * 프리미엄 선택자 함수들
 * @namespace premiumSelectors
 * @description 프리미엄 상태에서 특정 데이터를 선택하는 헬퍼 함수들
 */
export const premiumSelectors = {
  /**
   * 구독 활성 여부
   * @returns {Function} 선택자 함수
   */
  isSubscriptionActive: () => (state: PremiumStore) => 
    state.subscription?.isActive || false,
  
  /**
   * 현재 플랜
   * @returns {Function} 선택자 함수
   */
  getCurrentPlan: () => (state: PremiumStore) => 
    state.subscription?.plan || PremiumPlan.FREE,
  
  /**
   * 특정 기능 보유 여부
   * @param {keyof PremiumFeatures} feature - 확인할 기능
   * @returns {Function} 선택자 함수
   */
  hasFeature: (feature: keyof PremiumFeatures) => (state: PremiumStore) => 
    state.hasFeature(feature),
  
  /**
   * 좋아요 전송 가능 여부
   * @returns {Function} 선택자 함수
   */
  canSendLike: () => (state: PremiumStore) => 
    state.canSendLike(),
  
  /**
   * 남은 좋아요 수
   * @returns {Function} 선택자 함수
   */
  getRemainingLikes: () => (state: PremiumStore) => 
    state.getRemainingLikes(),
  
  /**
   * 프리미엄 사용자 여부
   * @returns {Function} 선택자 함수
   */
  isPremiumUser: () => (state: PremiumStore) => 
    state.subscription?.plan !== PremiumPlan.FREE && state.subscription?.isActive,
  
  /**
   * 구독 만료일까지 남은 일수
   * @returns {Function} 선택자 함수
   * @description 구독 만료일까지 남은 일수를 계산
   */
  getDaysUntilExpiry: () => (state: PremiumStore) => {
    const expiresAt = state.subscription?.expiresAt;
    if (!expiresAt) return 0;
    
    const now = new Date();
    const expiry = new Date(expiresAt);
    const diffTime = expiry.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return Math.max(0, diffDays);
  },
};