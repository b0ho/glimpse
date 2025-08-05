import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { User } from '@prisma/client';

/**
 * 현재 사용자 데코레이터
 *
 * 요청 객체에서 현재 인증된 사용자 정보를 추출합니다.
 *
 * @example
 * ```typescript
 * @Get('profile')
 * getProfile(@CurrentUser() user: User) {
 *   return user;
 * }
 * ```
 */
export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): User => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  },
);

/**
 * 현재 사용자 ID 데코레이터
 *
 * 요청 객체에서 현재 인증된 사용자의 ID만 추출합니다.
 *
 * @example
 * ```typescript
 * @Get('profile')
 * getProfile(@CurrentUserId() userId: string) {
 *   return this.userService.findById(userId);
 * }
 * ```
 */
export const CurrentUserId = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): string => {
    const request = ctx.switchToHttp().getRequest();
    return request.user?.id || request.user?.userId;
  },
);
