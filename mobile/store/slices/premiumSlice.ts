/**
 * 프리미엄 구독 상태 관리 Zustand 슬라이스
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { 
  PremiumPlan, 
  LikePackage, 
  SubscriptionInfo, 
  PaymentProduct, 
  PremiumFeatures,
  premiumService 
} from '@/services/payment/premium-service';

interface PremiumState {
  // 구독 정보
  subscription: SubscriptionInfo | null;
  
  // 좋아요 상태
  dailyLikesRemaining: number;
  totalPurchasedLikes: number;
  lastDailyReset: Date | null;
  
  // UI 상태
  isLoading: boolean;
  error: string | null;
  
  // 결제 상태
  isProcessingPayment: boolean;
  
  // 상품 목록
  paymentProducts: PaymentProduct[];
}

interface PremiumActions {
  // 구독 관련
  loadSubscription: (userId: string) => Promise<void>;
  updateSubscriptionStatus: (subscription: SubscriptionInfo) => void;
  
  // 결제 관련
  initiatePurchase: (productId: string, userId: string) => Promise<{clientSecret: string}>;
  confirmPayment: (userId: string, productId: string) => Promise<void>;
  cancelSubscription: (userId: string) => Promise<void>;
  
  // 좋아요 관련
  useLike: (userId: string) => Promise<boolean>;
  addPurchasedLikes: (amount: number) => void;
  checkDailyReset: (userId: string) => Promise<void>;
  
  // 기능 확인
  hasFeature: (feature: keyof PremiumFeatures) => boolean;
  canSendLike: () => boolean;
  getRemainingLikes: () => number;
  
  // 상품 관리
  loadPaymentProducts: () => void;
  
  // 유틸리티
  clearError: () => void;
  setLoading: (loading: boolean) => void;
  reset: () => void;
}

type PremiumStore = PremiumState & PremiumActions;

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

export const usePremiumStore = create<PremiumStore>()(
  persist(
    (set, get) => ({
      ...initialState,

      // 구독 정보 로드
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

      // 구독 상태 업데이트
      updateSubscriptionStatus: (subscription: SubscriptionInfo) => {
        set({ 
          subscription,
          dailyLikesRemaining: subscription.dailyLikesRemaining,
          totalPurchasedLikes: subscription.totalPurchasedLikes,
        });
      },

      // 구매 시작
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

      // 결제 확인
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

      // 구독 취소
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

      // 좋아요 사용
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

      // 구매한 좋아요 추가
      addPurchasedLikes: (amount: number) => {
        const state = get();
        set({ totalPurchasedLikes: state.totalPurchasedLikes + amount });
      },

      // 일일 리셋 확인
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

      // 기능 보유 여부 확인
      hasFeature: (feature: keyof PremiumFeatures) => {
        const subscription = get().subscription;
        return subscription?.features[feature] || false;
      },

      // 좋아요 전송 가능 여부
      canSendLike: () => {
        const state = get();
        
        // 무제한 좋아요가 있는 경우
        if (state.hasFeature('unlimitedLikes')) {
          return true;
        }
        
        // 일일 무료 좋아요나 구매한 좋아요가 있는 경우
        return state.dailyLikesRemaining > 0 || state.totalPurchasedLikes > 0;
      },

      // 남은 좋아요 수
      getRemainingLikes: () => {
        const state = get();
        
        if (state.hasFeature('unlimitedLikes')) {
          return 999; // 무제한을 나타내는 큰 수
        }
        
        return state.dailyLikesRemaining + state.totalPurchasedLikes;
      },

      // 결제 상품 로드
      loadPaymentProducts: () => {
        const products = premiumService.getPaymentProducts();
        set({ paymentProducts: products });
      },

      // 에러 클리어
      clearError: () => {
        set({ error: null });
      },

      // 로딩 상태 설정
      setLoading: (loading: boolean) => {
        set({ isLoading: loading });
      },

      // 상태 초기화
      reset: () => {
        set(initialState);
      },
    }),
    {
      name: 'premium-storage',
      storage: createJSONStorage(() => AsyncStorage),
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

// 선택자 함수들
export const premiumSelectors = {
  // 구독 활성 여부
  isSubscriptionActive: () => (state: PremiumStore) => 
    state.subscription?.isActive || false,
  
  // 현재 플랜
  getCurrentPlan: () => (state: PremiumStore) => 
    state.subscription?.plan || PremiumPlan.FREE,
  
  // 특정 기능 보유 여부
  hasFeature: (feature: keyof PremiumFeatures) => (state: PremiumStore) => 
    state.hasFeature(feature),
  
  // 좋아요 전송 가능 여부
  canSendLike: () => (state: PremiumStore) => 
    state.canSendLike(),
  
  // 남은 좋아요 수
  getRemainingLikes: () => (state: PremiumStore) => 
    state.getRemainingLikes(),
  
  // 프리미엄 사용자 여부
  isPremiumUser: () => (state: PremiumStore) => 
    state.subscription?.plan !== PremiumPlan.FREE && state.subscription?.isActive,
  
  // 구독 만료일까지 남은 일수
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