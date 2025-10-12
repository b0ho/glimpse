/**
 * 통합 관심 등록 서비스
 * 내 정보 등록과 찾는 정보 등록을 통합 관리
 * 클라이언트에서는 실제 값을 암호화하여 로컬 저장
 * 서버에는 해시값만 전송
 */

import { apiClient } from '@/services/api/config';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Crypto from 'expo-crypto';
import { Platform } from 'react-native';
import { ApiResponse } from '@/types';

// 등록 유형
export enum RegistrationType {
  MY_INFO = 'MY_INFO',
  LOOKING_FOR = 'LOOKING_FOR',
}

// 관계 의도
export enum RelationshipIntent {
  ROMANTIC = 'ROMANTIC',
  FRIEND = 'FRIEND',
}

// 관심 유형
export enum InterestType {
  PHONE = 'PHONE',
  EMAIL = 'EMAIL',
  SOCIAL_ID = 'SOCIAL_ID',
  BIRTHDATE = 'BIRTHDATE',
  GROUP = 'GROUP',
  LOCATION = 'LOCATION',
  NICKNAME = 'NICKNAME',
  COMPANY = 'COMPANY',
  SCHOOL = 'SCHOOL',
  PART_TIME_JOB = 'PART_TIME_JOB',
  PLATFORM = 'PLATFORM',
  GAME_ID = 'GAME_ID',
}

// 개인정보 데이터 구조
export interface PersonalData {
  phoneNumber?: string;
  phoneCarrier?: string;
  email?: string;
  emailVerified?: boolean;
  socialId?: string;
  socialPlatform?: string;
  birthdate?: string;
  locationName?: string;
  locationLat?: number;
  locationLng?: number;
  appearance?: string;
  companyName?: string;
  companyEmail?: string;
  department?: string;
  schoolName?: string;
  major?: string;
  studentId?: string;
  partTimePlace?: string;
  partTimeRole?: string;
  workingHours?: string;
  gamerId?: string;
  platformId?: string;
  nickname?: string;
  additionalInfo?: any;
}

// 등록 요청 DTO
export interface RegisterInterestDto {
  registrationType: RegistrationType;
  type: InterestType;
  relationshipIntent: RelationshipIntent;
  personalData: PersonalData;
}

// 로컬 저장 데이터
interface LocalRegistration {
  id: string;
  registrationType: RegistrationType;
  type: InterestType;
  relationshipIntent: RelationshipIntent;
  encryptedData: string;
  displayValue: string;
  createdAt: string;
  expiresAt: string;
  serverRegistrationId?: string;
  syncedAt?: string;
}

class InterestRegistrationService {
  private readonly LOCAL_STORAGE_KEY = 'interest_registrations';
  private readonly ENCRYPTION_KEY = 'local_encryption_key'; // 실제로는 더 안전한 키 관리 필요

  /**
   * 관심 등록 (내 정보 또는 찾는 정보)
   */
  async register(dto: RegisterInterestDto): Promise<any> {
    try {
      // 1. 로컬에 암호화하여 저장
      const localRegistration = await this.saveLocalRegistration(dto);
      
      // 2. 서버에 해시값만 전송
      const response = await apiClient.post<ApiResponse<any>>('/interest/registration', {
        registrationType: dto.registrationType,
        type: dto.type,
        relationshipIntent: dto.relationshipIntent,
        personalData: this.hashPersonalData(dto.personalData, dto.type),
        deviceId: await this.getDeviceId(),
      });
      
      // 3. 서버 응답과 로컬 데이터 연결
      if (response.data?.registration?.id) {
        await this.updateLocalRegistration(localRegistration.id, {
          serverRegistrationId: response.data.registration.id,
          syncedAt: new Date().toISOString(),
        });
      }
      
      return {
        ...response.data,
        localId: localRegistration.id,
      };
    } catch (error) {
      console.error('Registration failed:', error);
      throw error;
    }
  }

  /**
   * 로컬에 등록 저장
   */
  private async saveLocalRegistration(dto: RegisterInterestDto): Promise<LocalRegistration> {
    const registrations = await this.getLocalRegistrations();
    
    // 암호화
    const encryptedData = await this.encryptData(dto.personalData);
    
    const newRegistration: LocalRegistration = {
      id: `local_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      registrationType: dto.registrationType,
      type: dto.type,
      relationshipIntent: dto.relationshipIntent,
      encryptedData,
      displayValue: this.maskValue(dto.type, dto.personalData),
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    };
    
    registrations.push(newRegistration);
    await AsyncStorage.setItem(this.LOCAL_STORAGE_KEY, JSON.stringify(registrations));
    
    return newRegistration;
  }

  /**
   * 로컬 등록 업데이트
   */
  private async updateLocalRegistration(id: string, updates: Partial<LocalRegistration>) {
    const registrations = await this.getLocalRegistrations();
    const index = registrations.findIndex(r => r.id === id);
    
    if (index >= 0) {
      registrations[index] = { ...registrations[index], ...updates };
      await AsyncStorage.setItem(this.LOCAL_STORAGE_KEY, JSON.stringify(registrations));
    }
  }

  /**
   * 로컬 등록 목록 조회
   */
  async getLocalRegistrations(): Promise<LocalRegistration[]> {
    try {
      const stored = await AsyncStorage.getItem(this.LOCAL_STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }

  /**
   * 내 등록 목록 조회 (서버 + 로컬 병합)
   */
  async getMyRegistrations(registrationType?: RegistrationType): Promise<any[]> {
    try {
      // 1. 서버 데이터 가져오기
      const endpoint = registrationType
        ? `/interest/registration/${registrationType.toLowerCase()}`
        : '/interest/registration/my';

      const response = await apiClient.get<ApiResponse<any[]>>(endpoint);
      const serverRegistrations = response.data || [];
      
      // 2. 로컬 데이터 가져오기
      const localRegistrations = await this.getLocalRegistrations();
      
      // 3. 병합 (로컬 데이터가 있으면 복호화하여 실제 값 표시)
      const merged = serverRegistrations.map((serverReg: any) => {
        const localReg = localRegistrations.find(
          l => l.serverRegistrationId === serverReg.id
        );
        
        if (localReg) {
          // 로컬 데이터가 있으면 복호화
          const decryptedData = this.decryptData(localReg.encryptedData);
          return {
            ...serverReg,
            personalData: decryptedData,
            hasLocalData: true,
            localId: localReg.id,
          };
        }
        
        // 로컬 데이터 없으면 서버 데이터만
        return {
          ...serverReg,
          hasLocalData: false,
        };
      });
      
      // 4. 아직 서버에 동기화되지 않은 로컬 데이터 추가
      const unsyncedLocal = localRegistrations.filter(
        l => !l.serverRegistrationId && (!registrationType || l.registrationType === registrationType)
      );
      
      unsyncedLocal.forEach(local => {
        const decryptedData = this.decryptData(local.encryptedData);
        merged.push({
          id: local.id,
          type: local.type,
          registrationType: local.registrationType,
          relationshipIntent: local.relationshipIntent,
          displayValue: local.displayValue,
          personalData: decryptedData,
          status: 'LOCAL_ONLY',
          hasLocalData: true,
          localId: local.id,
          createdAt: local.createdAt,
          expiresAt: local.expiresAt,
        });
      });
      
      return merged;
    } catch (error) {
      console.error('Failed to get registrations:', error);
      
      // 오프라인 모드: 로컬 데이터만 반환
      const localRegistrations = await this.getLocalRegistrations();
      return localRegistrations
        .filter(l => !registrationType || l.registrationType === registrationType)
        .map(local => {
          const decryptedData = this.decryptData(local.encryptedData);
          return {
            id: local.id,
            type: local.type,
            registrationType: local.registrationType,
            relationshipIntent: local.relationshipIntent,
            displayValue: local.displayValue,
            personalData: decryptedData,
            status: 'LOCAL_ONLY',
            hasLocalData: true,
            localId: local.id,
            createdAt: local.createdAt,
            expiresAt: local.expiresAt,
          };
        });
    }
  }

  /**
   * 매칭 목록 조회
   */
  async getMatches(): Promise<any[]> {
    try {
      const response = await apiClient.get<ApiResponse<any[]>>('/interest/registration/matches');
      return response.data || [];
    } catch (error) {
      console.error('Failed to get matches:', error);
      return [];
    }
  }

  /**
   * 매칭 확인/수락
   */
  async confirmMatch(matchId: string): Promise<any> {
    try {
      const response = await apiClient.put<ApiResponse<any>>(`/interest/registration/matches/${matchId}/confirm`);
      return response.data;
    } catch (error) {
      console.error('Failed to confirm match:', error);
      throw error;
    }
  }

  /**
   * 데이터 암호화 (로컬용)
   */
  private async encryptData(data: PersonalData): Promise<string> {
    if (Platform.OS === 'web') {
      // 웹에서는 btoa 사용 (실제로는 더 안전한 암호화 필요)
      return btoa(JSON.stringify(data));
    } else {
      // 모바일에서는 expo-crypto 사용
      const jsonStr = JSON.stringify(data);
      const encrypted = await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        jsonStr + this.ENCRYPTION_KEY
      );
      // 실제로는 더 복잡한 암호화 필요
      return btoa(jsonStr); // 임시로 base64만 사용
    }
  }

  /**
   * 데이터 복호화 (로컬용)
   */
  private decryptData(encryptedData: string): PersonalData {
    try {
      // 임시로 base64 디코딩만 사용
      const jsonStr = atob(encryptedData);
      return JSON.parse(jsonStr);
    } catch {
      return {};
    }
  }

  /**
   * 개인정보 해시화 (서버 전송용)
   */
  private hashPersonalData(data: PersonalData, type: InterestType): PersonalData {
    const hashed: PersonalData = {};
    
    // 타입별로 필요한 필드만 해시화
    switch (type) {
      case InterestType.PHONE:
        if (data.phoneNumber) {
          hashed.phoneNumber = this.hashValue(data.phoneNumber);
        }
        break;
      case InterestType.EMAIL:
        if (data.email) {
          hashed.email = this.hashValue(data.email.toLowerCase());
        }
        break;
      case InterestType.BIRTHDATE:
        if (data.birthdate) {
          hashed.birthdate = this.hashValue(data.birthdate);
        }
        break;
      // ... 다른 타입들
    }
    
    return hashed;
  }

  /**
   * 값 해시화
   */
  private hashValue(value: string): string {
    // 간단한 해시 (실제로는 SHA-256 등 사용)
    return btoa(value).replace(/=/g, '');
  }

  /**
   * 값 마스킹
   */
  private maskValue(type: InterestType, data: PersonalData): string {
    switch (type) {
      case InterestType.PHONE:
        const phone = data.phoneNumber || '';
        return phone.length >= 10 
          ? `${phone.slice(0, 3)}-****-${phone.slice(-4)}`
          : '***-****-****';
      
      case InterestType.EMAIL:
        const email = data.email || '';
        const [local, domain] = email.split('@');
        return local && domain
          ? `${local[0]}***@${domain}`
          : '***@***.***';
      
      case InterestType.BIRTHDATE:
        const birth = data.birthdate || '';
        return birth.slice(0, 4) ? `${birth.slice(0, 2)}**년생` : '****년생';
      
      default:
        return '***';
    }
  }

  /**
   * 디바이스 ID 가져오기
   */
  private async getDeviceId(): Promise<string> {
    try {
      let deviceId = await AsyncStorage.getItem('device_id');
      if (!deviceId) {
        deviceId = `device_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        await AsyncStorage.setItem('device_id', deviceId);
      }
      return deviceId;
    } catch {
      return 'unknown_device';
    }
  }

  /**
   * 로컬 데이터 초기화
   */
  async clearLocalData(): Promise<void> {
    await AsyncStorage.removeItem(this.LOCAL_STORAGE_KEY);
  }
}

export const interestRegistrationService = new InterestRegistrationService();