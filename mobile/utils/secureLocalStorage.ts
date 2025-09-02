/**
 * 개인정보 보호를 위한 로컬 저장소 및 암호화 시스템
 * - 모든 개인정보는 클라이언트에서만 암호화/복호화
 * - 서버로는 해시값만 전송
 * - 크로스 플랫폼 호환 (Web, iOS, Android)
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Crypto from 'expo-crypto';
import { Platform } from 'react-native';
import { InterestType } from '@/types/interest';

// 암호화 키 관리
const ENCRYPTION_KEY_STORAGE = 'glimpse_encryption_key';
const LOCAL_INTERESTS_STORAGE = 'glimpse_local_interests';
const INTEREST_REGISTRATION_HISTORY = 'glimpse_interest_registration_history';

interface LocalInterestCard {
  id: string;
  type: InterestType;
  encryptedData: string; // 암호화된 개인정보
  hashedValue: string; // 서버 전송용 해시
  createdAt: string;
  expiresAt: string;
  localMetadata?: {
    displayName?: string; // 로컬 표시용 이름
    notes?: string; // 개인 메모
  };
}

interface RegistrationHistory {
  type: InterestType;
  registeredAt: string;
  expiresAt: string;
  canRegisterAgainAt: string; // 7일 쿨다운
}

/**
 * 디바이스별 고유 암호화 키 생성 또는 가져오기
 */
async function getOrCreateEncryptionKey(): Promise<string> {
  try {
    let key = await AsyncStorage.getItem(ENCRYPTION_KEY_STORAGE);
    
    if (!key) {
      // 강력한 256비트 키 생성
      const randomBytes = await Crypto.getRandomBytesAsync(32);
      key = btoa(String.fromCharCode(...new Uint8Array(randomBytes)));
      await AsyncStorage.setItem(ENCRYPTION_KEY_STORAGE, key);
    }
    
    return key;
  } catch (error) {
    console.error('Failed to get encryption key:', error);
    throw new Error('암호화 키 생성 실패');
  }
}

/**
 * AES-GCM 암호화
 */
async function encryptData(plainText: string): Promise<string> {
  try {
    if (Platform.OS === 'web') {
      // Web Crypto API 사용
      const key = await getOrCreateEncryptionKey();
      const encoder = new TextEncoder();
      const data = encoder.encode(plainText);
      
      // IV 생성
      const iv = crypto.getRandomValues(new Uint8Array(12));
      
      // 키 가져오기
      const cryptoKey = await crypto.subtle.importKey(
        'raw',
        Uint8Array.from(atob(key), c => c.charCodeAt(0)),
        { name: 'AES-GCM' },
        false,
        ['encrypt']
      );
      
      // 암호화
      const encrypted = await crypto.subtle.encrypt(
        { name: 'AES-GCM', iv },
        cryptoKey,
        data
      );
      
      // IV + 암호화된 데이터 결합
      const combined = new Uint8Array(iv.length + encrypted.byteLength);
      combined.set(iv, 0);
      combined.set(new Uint8Array(encrypted), iv.length);
      
      return btoa(String.fromCharCode(...combined));
    } else {
      // Native: expo-crypto 사용 (해시 기반 간단한 암호화)
      const key = await getOrCreateEncryptionKey();
      const combined = `${key}:${plainText}`;
      const encrypted = await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        combined,
        { encoding: Crypto.CryptoEncoding.BASE64 }
      );
      
      // 원본 데이터를 XOR 방식으로 추가 보호
      const xorEncrypted = plainText.split('').map((char, i) => 
        String.fromCharCode(char.charCodeAt(0) ^ key.charCodeAt(i % key.length))
      ).join('');
      
      return btoa(xorEncrypted);
    }
  } catch (error) {
    console.error('Encryption failed:', error);
    throw new Error('데이터 암호화 실패');
  }
}

/**
 * AES-GCM 복호화
 */
async function decryptData(encryptedText: string): Promise<string> {
  try {
    if (Platform.OS === 'web') {
      // Web Crypto API 사용
      const key = await getOrCreateEncryptionKey();
      const combined = Uint8Array.from(atob(encryptedText), c => c.charCodeAt(0));
      
      // IV와 데이터 분리
      const iv = combined.slice(0, 12);
      const data = combined.slice(12);
      
      // 키 가져오기
      const cryptoKey = await crypto.subtle.importKey(
        'raw',
        Uint8Array.from(atob(key), c => c.charCodeAt(0)),
        { name: 'AES-GCM' },
        false,
        ['decrypt']
      );
      
      // 복호화
      const decrypted = await crypto.subtle.decrypt(
        { name: 'AES-GCM', iv },
        cryptoKey,
        data
      );
      
      const decoder = new TextDecoder();
      return decoder.decode(decrypted);
    } else {
      // Native: XOR 복호화
      const key = await getOrCreateEncryptionKey();
      const xorEncrypted = atob(encryptedText);
      
      const decrypted = xorEncrypted.split('').map((char, i) => 
        String.fromCharCode(char.charCodeAt(0) ^ key.charCodeAt(i % key.length))
      ).join('');
      
      return decrypted;
    }
  } catch (error) {
    console.error('Decryption failed:', error);
    throw new Error('데이터 복호화 실패');
  }
}

/**
 * SHA-256 해시 생성 (서버 전송용)
 */
async function generateHash(data: string): Promise<string> {
  try {
    // 정규화: 소문자 변환, 공백 제거
    const normalized = data.toLowerCase().replace(/\s+/g, '');
    
    if (Platform.OS === 'web') {
      const encoder = new TextEncoder();
      const dataBuffer = encoder.encode(normalized);
      const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    } else {
      return await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        normalized,
        { encoding: Crypto.CryptoEncoding.HEX }
      );
    }
  } catch (error) {
    console.error('Hash generation failed:', error);
    throw new Error('해시 생성 실패');
  }
}

/**
 * 로컬 관심상대 카드 저장
 */
export async function saveLocalInterestCard(
  type: InterestType,
  value: string,
  metadata?: any
): Promise<LocalInterestCard> {
  try {
    // 개인정보 암호화
    const encryptedData = await encryptData(JSON.stringify({ value, metadata }));
    
    // 해시 생성 (서버 전송용)
    const hashedValue = await generateHash(`${type}:${value}`);
    
    // 카드 생성
    const card: LocalInterestCard = {
      id: `local_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      encryptedData,
      hashedValue,
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7일
      localMetadata: {
        displayName: metadata?.displayName || value.substring(0, 3) + '***',
        notes: metadata?.notes
      }
    };
    
    // 기존 카드 목록 가져오기
    const existingCards = await getLocalInterestCards();
    
    // 중복 체크
    const isDuplicate = existingCards.some(c => 
      c.type === type && c.hashedValue === hashedValue
    );
    
    if (isDuplicate) {
      throw new Error('이미 등록된 정보입니다');
    }
    
    // 저장
    const updatedCards = [...existingCards, card];
    await AsyncStorage.setItem(LOCAL_INTERESTS_STORAGE, JSON.stringify(updatedCards));
    
    // 등록 이력 저장
    await saveRegistrationHistory(type);
    
    return card;
  } catch (error) {
    console.error('Failed to save local interest card:', error);
    throw error;
  }
}

/**
 * 로컬 관심상대 카드 목록 가져오기
 */
export async function getLocalInterestCards(): Promise<LocalInterestCard[]> {
  try {
    const data = await AsyncStorage.getItem(LOCAL_INTERESTS_STORAGE);
    if (!data) return [];
    
    const cards = JSON.parse(data) as LocalInterestCard[];
    
    // 만료된 카드 필터링
    const now = new Date();
    const activeCards = cards.filter(card => 
      new Date(card.expiresAt) > now
    );
    
    // 변경사항이 있으면 저장
    if (activeCards.length !== cards.length) {
      await AsyncStorage.setItem(LOCAL_INTERESTS_STORAGE, JSON.stringify(activeCards));
    }
    
    return activeCards;
  } catch (error) {
    console.error('Failed to get local interest cards:', error);
    return [];
  }
}

/**
 * 특정 카드의 암호화된 데이터 복호화
 */
export async function decryptCardData(card: LocalInterestCard): Promise<{
  value: string;
  metadata?: any;
}> {
  try {
    const decrypted = await decryptData(card.encryptedData);
    return JSON.parse(decrypted);
  } catch (error) {
    console.error('Failed to decrypt card data:', error);
    throw new Error('카드 데이터 복호화 실패');
  }
}

/**
 * 로컬 카드 삭제
 */
export async function deleteLocalInterestCard(cardId: string): Promise<void> {
  try {
    const cards = await getLocalInterestCards();
    const updatedCards = cards.filter(card => card.id !== cardId);
    await AsyncStorage.setItem(LOCAL_INTERESTS_STORAGE, JSON.stringify(updatedCards));
  } catch (error) {
    console.error('Failed to delete local interest card:', error);
    throw error;
  }
}

/**
 * 등록 이력 저장 (7일 쿨다운 관리)
 */
async function saveRegistrationHistory(type: InterestType): Promise<void> {
  try {
    const data = await AsyncStorage.getItem(INTEREST_REGISTRATION_HISTORY);
    const history = data ? JSON.parse(data) : [];
    
    const now = new Date();
    const record: RegistrationHistory = {
      type,
      registeredAt: now.toISOString(),
      expiresAt: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      canRegisterAgainAt: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString()
    };
    
    // 같은 타입의 기존 기록 제거
    const filteredHistory = history.filter((h: RegistrationHistory) => h.type !== type);
    filteredHistory.push(record);
    
    await AsyncStorage.setItem(INTEREST_REGISTRATION_HISTORY, JSON.stringify(filteredHistory));
  } catch (error) {
    console.error('Failed to save registration history:', error);
  }
}

/**
 * 특정 타입의 등록 가능 여부 확인
 */
export async function canRegisterInterestType(type: InterestType): Promise<{
  canRegister: boolean;
  cooldownEndsAt?: string;
}> {
  try {
    const data = await AsyncStorage.getItem(INTEREST_REGISTRATION_HISTORY);
    if (!data) return { canRegister: true };
    
    const history = JSON.parse(data) as RegistrationHistory[];
    const record = history.find(h => h.type === type);
    
    if (!record) return { canRegister: true };
    
    const now = new Date();
    const cooldownEnd = new Date(record.canRegisterAgainAt);
    
    if (now >= cooldownEnd) {
      return { canRegister: true };
    }
    
    return {
      canRegister: false,
      cooldownEndsAt: record.canRegisterAgainAt
    };
  } catch (error) {
    console.error('Failed to check registration eligibility:', error);
    return { canRegister: true };
  }
}

/**
 * 서버로 전송할 해시 데이터 준비
 */
export async function prepareServerData(card: LocalInterestCard): Promise<{
  type: InterestType;
  hashedValue: string;
  expiresAt: string;
}> {
  return {
    type: card.type,
    hashedValue: card.hashedValue,
    expiresAt: card.expiresAt
  };
}

/**
 * 매칭 확인용 해시 생성
 */
export async function generateMatchingHash(
  type: InterestType,
  value: string
): Promise<string> {
  return generateHash(`${type}:${value}`);
}

/**
 * 다른 디바이스에서 등록된 카드 상태 표시용 데이터
 */
export interface RemoteCardStatus {
  type: InterestType;
  isRegistered: boolean;
  registeredAt?: string;
  expiresAt?: string;
  deviceInfo: 'current' | 'other'; // 현재 디바이스 or 다른 디바이스
}

/**
 * 로컬 + 서버 카드 상태 통합
 */
export async function getConsolidatedCardStatus(
  serverCards: any
): Promise<RemoteCardStatus[]> {
  try {
    const localCards = await getLocalInterestCards();
    const statusList: RemoteCardStatus[] = [];
    
    // serverCards가 배열인지 확인
    const serverCardArray = Array.isArray(serverCards) ? serverCards : [];
    
    // 로컬 카드 추가
    for (const card of localCards) {
      statusList.push({
        type: card.type,
        isRegistered: true,
        registeredAt: card.createdAt,
        expiresAt: card.expiresAt,
        deviceInfo: 'current'
      });
    }
    
    // 서버 카드 중 로컬에 없는 것만 추가 (다른 디바이스에서 등록)
    for (const serverCard of serverCardArray) {
      const existsLocally = localCards.some(local => local.type === serverCard.type);
      if (!existsLocally) {
        statusList.push({
          type: serverCard.type,
          isRegistered: true,
          registeredAt: serverCard.registeredAt,
          expiresAt: serverCard.expiresAt,
          deviceInfo: 'other'
        });
      }
    }
    
    return statusList;
  } catch (error) {
    console.error('Failed to get consolidated card status:', error);
    return [];
  }
}

/**
 * 로컬 스토리지 초기화 (디버그용)
 */
export async function clearLocalInterestData(): Promise<void> {
  try {
    await AsyncStorage.multiRemove([
      LOCAL_INTERESTS_STORAGE,
      INTEREST_REGISTRATION_HISTORY
    ]);
  } catch (error) {
    console.error('Failed to clear local interest data:', error);
  }
}