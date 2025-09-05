/**
 * 인증 관련 타입 정의
 */

import { User } from './user.types';

/**
 * 인증 상태
 */
export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  token: string | null;
  refreshToken?: string | null;
  isLoading: boolean;
  error: string | null;
}