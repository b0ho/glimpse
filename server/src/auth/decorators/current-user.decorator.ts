import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/**
 * 현재 사용자 데코레이터
 * 
 * 요청 객체에서 현재 인증된 사용자 정보를 추출합니다.
 * 
 * @example
 * ```typescript
 * @Get('profile')
 * getProfile(@CurrentUser() user: any) {
 *   return user;
 * }
 * ```
 */
export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
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
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return request.user?.userId;
  },
);