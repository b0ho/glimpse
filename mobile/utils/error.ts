/**
 * 애플리케이션 에러 클래스
 * @class AppError
 * @extends Error
 * @description 커스텀 에러 클래스로 에러 코드를 포함
 */
export class AppError extends Error {
  /** 에러 코드 */
  code: number;
  
  /**
   * AppError 생성자
   * @param {number} code - 에러 코드
   * @param {string} message - 에러 메시지
   */
  constructor(code: number, message: string) {
    super(message);
    this.code = code;
    this.name = 'AppError';
  }
}

/**
 * 에러 생성 헬퍼 함수
 * @function createError
 * @param {number} code - 에러 코드
 * @param {string} message - 에러 메시지
 * @returns {AppError} 생성된 AppError 인스턴스
 * @description AppError 인스턴스를 생성하는 팩토리 함수
 */
export const createError = (code: number, message: string): AppError => {
  return new AppError(code, message);
};