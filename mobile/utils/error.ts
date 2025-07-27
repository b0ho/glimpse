export class AppError extends Error {
  code: number;
  
  constructor(code: number, message: string) {
    super(message);
    this.code = code;
    this.name = 'AppError';
  }
}

export const createError = (code: number, message: string): AppError => {
  return new AppError(code, message);
};