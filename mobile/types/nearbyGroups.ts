/**
 * 위치 기반 그룹 관련 타입 정의
 */

export interface LocationData {
  latitude: number;
  longitude: number;
  address?: string;
}

export interface LocationGroup {
  id: string;
  name: string;
  description: string;
  latitude: number;
  longitude: number;
  radius: number; // km
  distance?: number; // meters from user
  memberCount: number;
  activeMembers: number;
  createdBy: string;
  createdAt: Date;
  expiresAt?: Date;
  isJoined: boolean;
  qrCode?: string;
}

export interface NewGroupFormData {
  name: string;
  description: string;
  radius: string;
  duration: string;
}

export interface NearbyGroupsFilters {
  radius: number; // km
  sortBy: 'distance' | 'members' | 'recent';
  onlyJoined: boolean;
}