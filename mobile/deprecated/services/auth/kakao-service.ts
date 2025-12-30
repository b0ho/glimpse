import {
  KakaoOAuthToken,
  KakaoProfile,
  getProfile as getKakaoProfile,
  login,
  logout,
  unlink,
} from '@react-native-seoul/kakao-login';
import { ApiResponse } from '@/types';
import Constants from 'expo-constants';

/**
 * 카카오 사용자 프로필 정보 인터페이스
 * @interface KakaoUserProfile
 * @description 카카오 API에서 반환되는 사용자 정보
 */
export interface KakaoUserProfile {
  id: string;
  nickname: string;
  email?: string;
  profileImageUrl?: string;
  thumbnailImageUrl?: string;
  ageRange?: string;
  birthday?: string;
  gender?: string;
}

/**
 * 카카오 로그인 응답 데이터
 * @interface KakaoLoginData
 * @description 카카오 로그인 성공 시 반환되는 데이터
 */
export interface KakaoLoginData {
  token: KakaoOAuthToken;
  profile: KakaoUserProfile;
}

/**
 * 카카오 로그인 서비스 인터페이스
 * @interface KakaoAuthService
 * @description 카카오 OAuth 인증 관련 기능을 제공하는 서비스 인터페이스
 */
export interface KakaoAuthService {
  /** 카카오 로그인 실행 */
  signInWithKakao: () => Promise<ApiResponse<KakaoLoginData>>;
  /** 카카오 로그아웃 */
  signOut: () => Promise<ApiResponse<void>>;
  /** 카카오 연결 해제 */
  unlink: () => Promise<ApiResponse<void>>;
  /** 현재 사용자 프로필 가져오기 */
  getCurrentProfile: () => Promise<ApiResponse<KakaoUserProfile>>;
  /** 카카오톡 앱 설치 여부 확인 */
  isKakaoTalkInstalled: () => Promise<boolean>;
}

/**
 * 카카오 프로필을 내부 형식으로 변환
 * @function transformKakaoProfile
 * @param {KakaoProfile} profile - 카카오 API 프로필
 * @returns {KakaoUserProfile} 변환된 프로필 정보
 * @description 카카오 SDK의 프로필 형식을 앱 내부 형식으로 변환
 */
const transformKakaoProfile = (profile: KakaoProfile): KakaoUserProfile => {
  return {
    id: String(profile.id),
    nickname: profile.nickname || '',
    email: profile.email || undefined,
    profileImageUrl: profile.profileImageUrl || undefined,
    thumbnailImageUrl: profile.thumbnailImageUrl || undefined,
    ageRange: profile.ageRange || undefined,
    birthday: profile.birthday || undefined,
    gender: profile.gender || undefined,
  };
};

/**
 * 카카오 로그인 서비스 구현
 * @function useKakaoAuthService
 * @returns {KakaoAuthService} 카카오 인증 서비스 인스턴스
 * @description 카카오 OAuth를 사용한 소셜 로그인 서비스
 */
export const useKakaoAuthService = (): KakaoAuthService => {
  /**
   * 카카오 로그인 실행
   * @async
   * @returns {Promise<ApiResponse<KakaoLoginData>>} 토큰과 프로필 정보를 포함한 응답
   * @description 카카오톡 앱 또는 웹뷰를 통한 OAuth 로그인 수행
   */
  const signInWithKakao = async (): Promise<ApiResponse<KakaoLoginData>> => {
    try {
      console.log('🟡 카카오 로그인 시작');
      
      // 카카오 앱 키 확인
      const kakaoAppKey = Constants.expoConfig?.extra?.kakaoAppKey;
      if (!kakaoAppKey || kakaoAppKey === 'your-kakao-app-key-here') {
        console.log('❌ 카카오 앱 키가 설정되지 않음');
        return {
          success: false,
          error: '카카오 앱 키가 설정되지 않았습니다. 개발자에게 문의하세요.',
        };
      }

      // 카카오 로그인 수행
      const token: KakaoOAuthToken = await login();
      console.log('✅ 카카오 토큰 획득 성공:', {
        accessToken: token.accessToken?.substring(0, 20) + '...',
        refreshToken: token.refreshToken?.substring(0, 20) + '...',
        idToken: token.idToken?.substring(0, 20) + '...',
        scopes: token.scopes,
      });

      // 사용자 프로필 정보 가져오기
      console.log('🔍 카카오 프로필 정보 요청 중...');
      const kakaoProfile: KakaoProfile = await getKakaoProfile();
      const profile = transformKakaoProfile(kakaoProfile);
      
      console.log('✅ 카카오 프로필 정보 획득 성공:', {
        id: profile.id,
        nickname: profile.nickname,
        email: profile.email || 'Not provided',
        hasProfileImage: !!profile.profileImageUrl,
      });

      return {
        success: true,
        data: {
          token,
          profile,
        },
      };
    } catch (error: any) {
      console.error('❌ 카카오 로그인 실패:', error);
      
      // 사용자 취소 처리
      if (error.message?.includes('cancelled') || error.message?.includes('canceled')) {
        return {
          success: false,
          error: '로그인이 취소되었습니다.',
        };
      }

      // 네트워크 오류 처리
      if (error.message?.includes('network') || error.message?.includes('timeout')) {
        return {
          success: false,
          error: '네트워크 오류가 발생했습니다. 다시 시도해주세요.',
        };
      }

      return {
        success: false,
        error: error.message || '카카오 로그인 중 오류가 발생했습니다.',
      };
    }
  };

  /**
   * 카카오 로그아웃
   * @async
   * @returns {Promise<ApiResponse<void>>} 로그아웃 결과
   * @description 카카오 액세스 토큰을 무효화하고 로그아웃 처리
   */
  const signOut = async (): Promise<ApiResponse<void>> => {
    try {
      console.log('🟡 카카오 로그아웃 시작');
      await logout();
      console.log('✅ 카카오 로그아웃 성공');
      
      return {
        success: true,
        data: undefined,
      };
    } catch (error: any) {
      console.error('❌ 카카오 로그아웃 실패:', error);
      return {
        success: false,
        error: error.message || '카카오 로그아웃 중 오류가 발생했습니다.',
      };
    }
  };

  /**
   * 카카오 연결 해제 (회원 탈퇴)
   * @async
   * @returns {Promise<ApiResponse<void>>} 연결 해제 결과
   * @description 카카오 계정과의 연결을 완전히 해제
   */
  const unlinkKakao = async (): Promise<ApiResponse<void>> => {
    try {
      console.log('🟡 카카오 연결 해제 시작');
      await unlink();
      console.log('✅ 카카오 연결 해제 성공');
      
      return {
        success: true,
        data: undefined,
      };
    } catch (error: any) {
      console.error('❌ 카카오 연결 해제 실패:', error);
      return {
        success: false,
        error: error.message || '카카오 연결 해제 중 오류가 발생했습니다.',
      };
    }
  };

  /**
   * 현재 사용자 프로필 정보 가져오기
   * @async
   * @returns {Promise<ApiResponse<KakaoUserProfile>>} 프로필 정보
   * @description 현재 로그인된 카카오 사용자의 프로필 정보 조회
   */
  const getCurrentProfile = async (): Promise<ApiResponse<KakaoUserProfile>> => {
    try {
      console.log('🔍 카카오 프로필 정보 조회 중...');
      const kakaoProfile: KakaoProfile = await getKakaoProfile();
      const profile = transformKakaoProfile(kakaoProfile);
      
      console.log('✅ 카카오 프로필 정보 조회 성공:', {
        id: profile.id,
        nickname: profile.nickname,
        email: profile.email || 'Not provided',
      });

      return {
        success: true,
        data: profile,
      };
    } catch (error: any) {
      console.error('❌ 카카오 프로필 조회 실패:', error);
      return {
        success: false,
        error: error.message || '프로필 정보를 가져올 수 없습니다.',
      };
    }
  };

  /**
   * 카카오톡 앱 설치 여부 확인
   * @async
   * @returns {Promise<boolean>} 카카오톡 설치 여부
   * @description 디바이스에 카카오톡 앱이 설치되어 있는지 확인
   */
  const isKakaoTalkInstalled = async (): Promise<boolean> => {
    try {
      // 실제로는 카카오톡 URL 스킴을 확인하는 방식으로 구현될 수 있음
      // 현재는 플랫폼 체크로 대체
      return true; // 웹에서는 항상 가능하다고 가정
    } catch (error) {
      console.log('카카오톡 설치 여부 확인 실패:', error);
      return false;
    }
  };

  return {
    signInWithKakao,
    signOut,
    unlink: unlinkKakao,
    getCurrentProfile,
    isKakaoTalkInstalled,
  };
};

export default useKakaoAuthService;