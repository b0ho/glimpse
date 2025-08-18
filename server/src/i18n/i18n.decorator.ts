import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { getUserLanguage } from './i18n.config';

/**
 * Custom decorator to get i18n instance from request
 */
export const I18n = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return request.t;
  },
);

/**
 * Custom decorator to get user's language
 */
export const UserLang = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return getUserLanguage(request);
  },
);
