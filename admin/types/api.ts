// API 타입 정의 (railway-api-client에서 재정의)

export interface User {
  id: string;
  anonymousId: string;
  phoneNumber?: string;
  nickname?: string;
  profileImage?: string;
  isPremium: boolean;
  premiumUntil?: Date;
  createdAt: Date;
  lastActive: Date;
  deletedAt?: Date;
  matchCount?: number;
  reportCount?: number;
}

export interface Group {
  id: string;
  name: string;
  type: string;
  description?: string;
  isActive: boolean;
  memberCount?: number;
  createdAt: Date;
}

export interface Match {
  id: string;
  user1Id: string;
  user2Id: string;
  groupId: string;
  status: string;
  createdAt: Date;
}