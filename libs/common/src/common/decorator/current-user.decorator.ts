import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { UserPayload } from '@models';

/**
 * Injects the JWT payload attached to the request by `AuthGuard`.
 */
export const CurrentUser = createParamDecorator((data: keyof UserPayload | undefined, ctx: ExecutionContext) => {
  const user = ctx.switchToHttp().getRequest().user as UserPayload;
  return data ? user?.[data] : user;
});
