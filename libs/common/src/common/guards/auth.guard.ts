import { CanActivate, ExecutionContext, ForbiddenException, Injectable, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { JsonWebTokenError, TokenExpiredError } from 'jsonwebtoken';
import { ROLES_KEY } from '@common/decorator/role.decorator';
import { ResponseMessage, UserRoles } from '@utils/enum';
import { AuthToken } from '@utils/jwt';

/**
 * Verifies the bearer token and enforces `@HasRoles`. The decoded payload is
 * attached to the request and read back through `@CurrentUser()`.
 */
@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    try {
      const requiredRoles = this.reflector.getAllAndOverride<UserRoles[]>(ROLES_KEY, [context.getHandler(), context.getClass()]);
      const request: Request = context.switchToHttp().getRequest();
      const token = request.headers.authorization?.replace('Bearer', '').trim();

      if (!token) throw new UnauthorizedException(ResponseMessage.UNAUTHENTICATED);

      const payload = AuthToken.verify(token);
      if (typeof payload !== 'object' || !payload.user) throw new UnauthorizedException(ResponseMessage.UNAUTHENTICATED);

      if (requiredRoles?.length && !requiredRoles.includes(payload.user.role)) throw new ForbiddenException(ResponseMessage.FORBIDDEN_ACCESS);

      request['user'] = payload.user;
      return true;
    } catch (error) {
      if (error instanceof TokenExpiredError) throw new UnauthorizedException(ResponseMessage.TOKEN_EXPIRED);

      // A tampered or malformed token is the caller's problem, not a server
      // fault — without this it escapes as an unhandled error and reports 500.
      if (error instanceof JsonWebTokenError) throw new UnauthorizedException(ResponseMessage.INVALID_TOKEN);

      throw error;
    }
  }
}
