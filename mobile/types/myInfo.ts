/**
 * 내 정보 타입 정의
 */

export interface InfoItem {
  value: string;
  metadata?: {
    [key: string]: string;
  };
}

export interface MyInfo {
  realName: string;
  profileNickname: string;
  phone: InfoItem[];
  email: InfoItem[];
  socialId: InfoItem[];
  birthdate: InfoItem[];
  group: InfoItem[];
  location: InfoItem[];
  nickname: InfoItem[];
  company: InfoItem[];
  school: InfoItem[];
  partTimeJob: InfoItem[];
  platform: InfoItem[];
  gameId: InfoItem[];
}

export type MyInfoFieldKey = keyof MyInfo;

export type InfoFieldKey = Exclude<MyInfoFieldKey, 'realName' | 'profileNickname'>;

export interface ModalInputState {
  [key: string]: string;
}