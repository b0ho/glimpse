/**
 * i18n 타입 확장
 * react-i18next의 TFunction 반환 타입을 string으로 단순화
 */

declare module 'react-i18next' {
  interface TFunction {
    (key: string, options?: any): string;
    (key: string[], options?: any): string;
  }
}

// i18next TFunction 타입 오버라이드
declare module 'i18next' {
  interface TFunction {
    (key: string, options?: any): string;
    (key: string[], options?: any): string;
  }
}

export {};