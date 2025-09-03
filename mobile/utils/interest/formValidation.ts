/**
 * 관심 등록 폼 유효성 검사 유틸리티
 */
import { InterestType, Gender } from '@/types/interest';

/**
 * 전화번호 유효성 검사
 */
export const validatePhoneNumber = (phone: string): boolean => {
  const phoneRegex = /^010-?\d{4}-?\d{4}$/;
  const cleanPhone = phone.replace(/-/g, '');
  return phoneRegex.test(phone) || /^010\d{8}$/.test(cleanPhone);
};

/**
 * 이메일 유효성 검사
 */
export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * 생년월일 유효성 검사
 */
export const validateBirthdate = (birthdate: string): boolean => {
  // YYYY-MM-DD 또는 YYYY/MM/DD 형식
  const dateRegex = /^\d{4}[-/]\d{2}[-/]\d{2}$/;
  if (!dateRegex.test(birthdate)) return false;

  const date = new Date(birthdate.replace(/\//g, '-'));
  const now = new Date();
  const minDate = new Date(now.getFullYear() - 100, now.getMonth(), now.getDate());
  const maxDate = new Date(now.getFullYear() - 14, now.getMonth(), now.getDate());

  return date >= minDate && date <= maxDate;
};

/**
 * 소셜 ID 유효성 검사
 */
export const validateSocialId = (id: string, platform: string): boolean => {
  if (!id || !platform) return false;
  
  // 플랫폼별 특별한 규칙 적용
  switch (platform) {
    case 'instagram':
    case 'twitter':
      // @ 기호로 시작할 수 있고, 영문, 숫자, 언더스코어, 점만 허용
      return /^@?[\w.]+$/.test(id) && id.replace('@', '').length >= 3;
    case 'kakao':
      // 카카오톡 ID는 최소 4자 이상
      return id.length >= 4;
    default:
      // 기본적으로 최소 3자 이상
      return id.length >= 3;
  }
};

/**
 * 게임 ID 유효성 검사
 */
export const validateGameId = (id: string, game: string): boolean => {
  if (!id || !game) return false;
  
  // 게임별 특별한 규칙 적용
  switch (game) {
    case 'lol':
    case 'valorant':
      // 라이엇 게임즈: 3-16자, 특수문자 불가
      return /^[a-zA-Z0-9가-힣]{3,16}$/.test(id);
    case 'steam':
      // 스팀: URL 또는 ID
      return id.length >= 3;
    default:
      // 기본적으로 최소 2자 이상
      return id.length >= 2;
  }
};

/**
 * 회사명 유효성 검사
 */
export const validateCompanyName = (name: string): boolean => {
  return name.length >= 2;
};

/**
 * 학교명 유효성 검사
 */
export const validateSchoolName = (name: string): boolean => {
  return name.length >= 2;
};

/**
 * 닉네임 유효성 검사
 */
export const validateNickname = (nickname: string): boolean => {
  return nickname.length >= 2 && nickname.length <= 20;
};

/**
 * 폼 전체 유효성 검사
 */
export interface FormValidationParams {
  selectedType: InterestType | null;
  value: string;
  metadata: any;
  selectedGender: Gender | null;
  name?: string;
  birthdate?: string;
  companyName?: string;
  department?: string;
}

export interface FormValidationResult {
  isValid: boolean;
  errorMessage?: string;
}

export const validateInterestForm = (params: FormValidationParams): FormValidationResult => {
  const { selectedType, value, metadata, selectedGender, name, birthdate, companyName, department } = params;

  if (!selectedType) {
    return {
      isValid: false,
      errorMessage: '관심상대 유형을 선택해주세요',
    };
  }

  if (!value.trim()) {
    return {
      isValid: false,
      errorMessage: '정보를 입력해주세요',
    };
  }

  // 타입별 유효성 검사
  switch (selectedType) {
    case InterestType.PHONE:
      if (!validatePhoneNumber(value)) {
        return {
          isValid: false,
          errorMessage: '올바른 전화번호 형식이 아닙니다',
        };
      }
      break;

    case InterestType.EMAIL:
      if (!validateEmail(value)) {
        return {
          isValid: false,
          errorMessage: '올바른 이메일 형식이 아닙니다',
        };
      }
      break;

    case InterestType.SOCIAL_ID:
      if (!metadata.platform) {
        return {
          isValid: false,
          errorMessage: '플랫폼을 선택해주세요',
        };
      }
      if (!validateSocialId(value, metadata.platform)) {
        return {
          isValid: false,
          errorMessage: '올바른 소셜 ID 형식이 아닙니다',
        };
      }
      break;

    case InterestType.BIRTHDATE:
      if (!validateBirthdate(value)) {
        return {
          isValid: false,
          errorMessage: '올바른 생년월일 형식이 아닙니다 (YYYY-MM-DD)',
        };
      }
      if (!selectedGender) {
        return {
          isValid: false,
          errorMessage: '성별을 선택해주세요',
        };
      }
      break;

    case InterestType.COMPANY:
      if (!validateCompanyName(companyName || value)) {
        return {
          isValid: false,
          errorMessage: '회사명을 입력해주세요',
        };
      }
      break;

    case InterestType.SCHOOL:
      if (!validateSchoolName(companyName || value)) {
        return {
          isValid: false,
          errorMessage: '학교명을 입력해주세요',
        };
      }
      if (!metadata.level) {
        return {
          isValid: false,
          errorMessage: '학교 구분을 선택해주세요',
        };
      }
      break;

    case InterestType.GAME_ID:
      if (!metadata.game) {
        return {
          isValid: false,
          errorMessage: '게임을 선택해주세요',
        };
      }
      if (!validateGameId(value, metadata.game)) {
        return {
          isValid: false,
          errorMessage: '올바른 게임 ID를 입력해주세요',
        };
      }
      break;

    case InterestType.NICKNAME:
      if (!validateNickname(value)) {
        return {
          isValid: false,
          errorMessage: '닉네임은 2-20자로 입력해주세요',
        };
      }
      break;

    case InterestType.PLATFORM:
      if (!metadata.platformName) {
        return {
          isValid: false,
          errorMessage: '플랫폼명을 입력해주세요',
        };
      }
      break;

    case InterestType.PART_TIME_JOB:
      if (!companyName) {
        return {
          isValid: false,
          errorMessage: '알바 장소를 입력해주세요',
        };
      }
      break;

    case InterestType.LOCATION:
      if (value.length < 10) {
        return {
          isValid: false,
          errorMessage: '장소나 인상착의를 더 자세히 설명해주세요 (최소 10자)',
        };
      }
      break;
  }

  return { isValid: true };
};

/**
 * 생년월일 포맷터
 */
export const formatBirthdate = (text: string): string => {
  // 숫자만 추출
  const numbers = text.replace(/[^0-9]/g, '');
  
  // YYYY-MM-DD 형식으로 자동 포맷팅
  if (numbers.length <= 4) {
    return numbers;
  } else if (numbers.length <= 6) {
    return `${numbers.slice(0, 4)}-${numbers.slice(4)}`;
  } else {
    return `${numbers.slice(0, 4)}-${numbers.slice(4, 6)}-${numbers.slice(6, 8)}`;
  }
};

/**
 * 전화번호 포맷터
 */
export const formatPhoneNumber = (text: string): string => {
  // 숫자만 추출
  const numbers = text.replace(/[^0-9]/g, '');
  
  // 010-XXXX-XXXX 형식으로 자동 포맷팅
  if (numbers.length <= 3) {
    return numbers;
  } else if (numbers.length <= 7) {
    return `${numbers.slice(0, 3)}-${numbers.slice(3)}`;
  } else {
    return `${numbers.slice(0, 3)}-${numbers.slice(3, 7)}-${numbers.slice(7, 11)}`;
  }
};