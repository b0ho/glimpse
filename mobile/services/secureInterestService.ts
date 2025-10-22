/**
 * 보안 관심상대 서비스
 * 로컬 스토리지와 서버 API를 연동하여 개인정보 보호
 */

import { apiClient } from '@/services/api/config';
import { InterestType, InterestSearch, InterestMatch } from '@/types/interest';
import { ApiResponse } from '@/types';
import {
  saveLocalInterestCard,
  getLocalInterestCards,
  deleteLocalInterestCard,
  decryptCardData,
  canRegisterInterestType,
  prepareServerData,
  generateMatchingHash,
  getConsolidatedCardStatus,
  RemoteCardStatus,
  clearLocalInterestData,
} from '@/utils/secureLocalStorage';

export interface SecureInterestCard {
  id: string;
  type: InterestType;
  displayValue: string; // 마스킹된 표시용 값
  actualValue?: string; // 로컬에서만 복호화 가능
  status: 'local' | 'remote' | 'matched' | 'expired';
  registeredAt: string;
  expiresAt: string;
  deviceInfo: 'current' | 'other';
  matchedUser?: {
    nickname: string;
    profileImage?: string;
  };
  cooldownEndsAt?: string;
}

class SecureInterestService {
  /**
   * 관심상대 카드 등록
   * 1. 로컬에 암호화하여 저장
   * 2. 서버에 해시값만 전송
   */
  async registerInterestCard(
    type: InterestType,
    value: string,
    metadata?: {
      displayName?: string;
      notes?: string;
      additionalInfo?: any;
    }
  ): Promise<SecureInterestCard> {
    try {
      // 1. 쿨다운 체크
      const eligibility = await canRegisterInterestType(type);
      if (!eligibility.canRegister) {
        throw new Error(
          `이 유형은 ${new Date(eligibility.cooldownEndsAt!).toLocaleDateString()}까지 등록할 수 없습니다`
        );
      }

      // 2. 로컬에 암호화 저장
      const localCard = await (saveLocalInterestCard as any)(type, value, metadata);

      // 3. 서버에 해시값 전송
      const serverData = await prepareServerData(localCard);
      const response = await apiClient.post<ApiResponse<any>>('/interest/secure/register', {
        type: serverData.type,
        hashedValue: serverData.hashedValue,
        expiresAt: serverData.expiresAt,
        metadata: metadata?.additionalInfo ? {
          // 추가 정보도 해시화
          secondaryHash: await generateMatchingHash(type, JSON.stringify(metadata.additionalInfo))
        } : undefined
      });

      // 4. 매칭 확인
      const isMatched = response.data?.status === 'MATCHED';
      if (isMatched) {
        // 매칭 발생 시 로컬 카드 업데이트
        await this.handleMatchNotification(localCard.id);
      }

      return {
        id: localCard.id,
        type: localCard.type,
        displayValue: this.maskValue(type, value),
        actualValue: value, // 로컬에서만 사용 가능
        status: isMatched ? 'matched' : 'local',
        registeredAt: localCard.createdAt,
        expiresAt: localCard.expiresAt,
        deviceInfo: 'current',
        cooldownEndsAt: localCard.expiresAt,
      };
    } catch (error) {
      console.error('Failed to register interest card:', error);
      throw error;
    }
  }

  /**
   * 내 관심상대 카드 목록 조회
   * 로컬 + 서버 데이터 통합
   */
  async getMyInterestCards(): Promise<SecureInterestCard[]> {
    try {
      // 1. 로컬 카드 가져오기
      const localCards = await getLocalInterestCards();

      // 2. 서버 상태 가져오기
      const { useAuthStore } = await import('@/store/slices/authSlice');
      const { user } = useAuthStore.getState();

      if (!user?.id) {
        console.warn('[SecureInterestService] No user ID available');
        // Return only local cards if no user
        const cards: SecureInterestCard[] = [];
        for (const localCard of localCards) {
          const decrypted = await decryptCardData(localCard);
          cards.push({
            id: localCard.id,
            type: localCard.type,
            displayValue: this.maskValue(localCard.type, decrypted.value),
            isActive: localCard.isActive,
            createdAt: localCard.createdAt,
            expiresAt: localCard.expiresAt,
            deviceInfo: 'current',
            isLocal: true,
            canReveal: true,
          });
        }
        return cards;
      }

      const response = await apiClient.get<ApiResponse<any>>(`/interest/secure/my-status?userId=${user.id}`);
      const serverStatuses = response.data;

      // 3. 통합 상태 생성
      const consolidatedStatus = await getConsolidatedCardStatus(serverStatuses);
      
      // 4. 카드 목록 생성
      const cards: SecureInterestCard[] = [];

      for (const status of consolidatedStatus) {
        if (status.deviceInfo === 'current') {
          // 로컬 카드 - 실제 데이터 복호화 가능
          const localCard = localCards.find(c => c.type === status.type);
          if (localCard) {
            const decrypted = await decryptCardData(localCard);
            cards.push({
              id: localCard.id,
              type: localCard.type,
              displayValue: this.maskValue(localCard.type, decrypted.value),
              actualValue: decrypted.value,
              status: 'local',
              registeredAt: localCard.createdAt,
              expiresAt: localCard.expiresAt,
              deviceInfo: 'current',
            });
          }
        } else {
          // 다른 디바이스 카드 - 상태만 표시
          cards.push({
            id: `remote_${status.type}`,
            type: status.type,
            displayValue: this.getTypeDisplayName(status.type),
            status: 'remote',
            registeredAt: status.registeredAt!,
            expiresAt: status.expiresAt!,
            deviceInfo: 'other',
          });
        }
      }

      return cards;
    } catch (error) {
      console.error('Failed to get interest cards:', error);
      return [];
    }
  }

  /**
   * 매칭된 목록 조회
   */
  async getMatches(): Promise<InterestMatch[]> {
    try {
      const response = await apiClient.get<ApiResponse<InterestMatch[]>>('/interest/secure/matches');
      return response.data;
    } catch (error) {
      console.error('Failed to get matches:', error);
      return [];
    }
  }

  /**
   * 카드 삭제
   * 로컬 삭제 + 서버 취소 (쿨다운은 유지)
   */
  async deleteInterestCard(cardId: string): Promise<void> {
    try {
      // 로컬 카드 삭제
      await deleteLocalInterestCard(cardId);
      
      // 서버에 취소 요청 (쿨다운 유지)
      if (!cardId.startsWith('remote_')) {
        await apiClient.post(`/interest/secure/cancel/${cardId}`);
      }
    } catch (error) {
      console.error('Failed to delete interest card:', error);
      throw error;
    }
  }

  /**
   * 값 마스킹
   */
  private maskValue(type: InterestType, value: string): string {
    switch (type) {
      case InterestType.PHONE:
        // 010-****-5678
        if (value.length >= 10) {
          return `${value.slice(0, 3)}-****-${value.slice(-4)}`;
        }
        return '***';
        
      case InterestType.EMAIL:
        // a***@example.com
        const [local, domain] = value.split('@');
        if (local && domain) {
          return `${local[0]}***@${domain}`;
        }
        return '***';
        
      case InterestType.SOCIAL_ID:
        // @u***
        if (value.length > 2) {
          return `@${value[1]}***`;
        }
        return '@***';
        
      case InterestType.BIRTHDATE:
      case InterestType.NICKNAME:
        // 김** 또는 닉***
        if (value.length > 1) {
          return `${value[0]}${'*'.repeat(Math.min(value.length - 1, 3))}`;
        }
        return '***';
        
      default:
        // 기본 마스킹
        if (value.length > 3) {
          return `${value.slice(0, 2)}***`;
        }
        return '***';
    }
  }

  /**
   * 타입별 표시 이름
   */
  private getTypeDisplayName(type: InterestType): string {
    const displayNames: Record<InterestType, string> = {
      [InterestType.PHONE]: '전화번호로 등록 중',
      [InterestType.EMAIL]: '이메일로 등록 중',
      [InterestType.SOCIAL_ID]: 'SNS 아이디로 등록 중',
      [InterestType.BIRTHDATE]: '생년월일로 등록 중',
      [InterestType.GROUP]: '그룹으로 등록 중',
      [InterestType.LOCATION]: '장소로 등록 중',
      [InterestType.NICKNAME]: '닉네임으로 등록 중',
      [InterestType.COMPANY]: '회사로 등록 중',
      [InterestType.SCHOOL]: '학교로 등록 중',
      [InterestType.PART_TIME_JOB]: '알바로 등록 중',
      [InterestType.PLATFORM]: '플랫폼으로 등록 중',
      [InterestType.GAME_ID]: '게임 아이디로 등록 중',
    };
    
    return displayNames[type] || '등록 중';
  }

  /**
   * 매칭 알림 처리
   */
  private async handleMatchNotification(cardId: string): Promise<void> {
    // 로컬 알림 또는 UI 업데이트
    console.log('Match found for card:', cardId);
  }

  /**
   * 복합 조건 매칭 확인
   * 예: 회사 + 부서 + 이름
   */
  async checkComplexMatching(
    primaryType: InterestType,
    primaryValue: string,
    secondaryValue?: string,
    tertiaryValue?: string
  ): Promise<boolean> {
    try {
      const primaryHash = await generateMatchingHash(primaryType, primaryValue);
      const secondaryHash = secondaryValue ? 
        await generateMatchingHash(primaryType, secondaryValue) : undefined;
      const tertiaryHash = tertiaryValue ? 
        await generateMatchingHash(primaryType, tertiaryValue) : undefined;

      const response = await apiClient.post<ApiResponse<{ matched: boolean }>>('/interest/secure/check-multi', {
        primary: primaryHash,
        secondary: secondaryHash,
        tertiary: tertiaryHash,
      });

      return response.data?.matched || false;
    } catch (error) {
      console.error('Failed to check complex matching:', error);
      return false;
    }
  }

  /**
   * 디버그용: 로컬 데이터 초기화
   */
  async clearAllLocalData(): Promise<void> {
    if (__DEV__) {
      await clearLocalInterestData();
      console.log('Local interest data cleared');
    }
  }
}

export const secureInterestService = new SecureInterestService();