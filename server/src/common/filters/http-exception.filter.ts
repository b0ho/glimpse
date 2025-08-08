import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

/**
 * HTTP 예외 필터
 *
 * 모든 HTTP 예외를 캐치하여 일관된 형식으로 응답합니다.
 * 404 에러를 적절한 상태 코드로 변환합니다.
 */
@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const status = exception.getStatus();
    const exceptionResponse = exception.getResponse();

    // 보호된 엔드포인트에 대한 404를 401로 변환
    const protectedPaths = [
      '/api/v1/users/me',
      '/api/v1/matches',
      '/api/v1/likes',
      '/api/v1/chats',
      '/api/v1/groups/create',
      '/api/v1/credits',
      '/api/v1/premium',
    ];

    const isProtectedPath = protectedPaths.some((path) =>
      request.url.startsWith(path),
    );

    const finalStatus = status === 404 && isProtectedPath ? 401 : status;

    const errorResponse = {
      statusCode: finalStatus,
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
      message: this.getErrorMessage(finalStatus, exceptionResponse),
      error: this.getErrorName(finalStatus),
    };

    // 에러 로깅
    if (finalStatus >= 500) {
      this.logger.error(
        `${request.method} ${request.url}`,
        exception.stack,
        'HttpExceptionFilter',
      );
    } else {
      this.logger.warn(
        `${request.method} ${request.url} - ${finalStatus}`,
        'HttpExceptionFilter',
      );
    }

    response.status(finalStatus).json(errorResponse);
  }

  private getErrorMessage(status: number, exceptionResponse: any): string {
    if (typeof exceptionResponse === 'string') {
      return exceptionResponse;
    }

    if (exceptionResponse?.message) {
      return Array.isArray(exceptionResponse.message)
        ? exceptionResponse.message[0]
        : exceptionResponse.message;
    }

    switch (status) {
      case 401:
        return '인증이 필요합니다';
      case 403:
        return '접근 권한이 없습니다';
      case 404:
        return '요청한 리소스를 찾을 수 없습니다';
      case 429:
        return '너무 많은 요청이 발생했습니다. 잠시 후 다시 시도해주세요';
      default:
        return '요청 처리 중 오류가 발생했습니다';
    }
  }

  private getErrorName(status: number): string {
    switch (status) {
      case 400:
        return 'Bad Request';
      case 401:
        return 'Unauthorized';
      case 403:
        return 'Forbidden';
      case 404:
        return 'Not Found';
      case 429:
        return 'Too Many Requests';
      case 500:
        return 'Internal Server Error';
      default:
        return 'Error';
    }
  }
}
