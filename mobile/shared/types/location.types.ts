/**
 * 위치 관련 타입 정의
 */

/**
 * 위치 체크인 (GPS 또는 QR코드를 통한 위치 확인)
 */
export interface LocationCheckIn {
  id: string;
  userId: string;
  groupId: string;
  latitude: number;
  longitude: number;
  accuracy: number;
  method: 'GPS' | 'QR_CODE';
  isValid: boolean;
  createdAt: Date;
}