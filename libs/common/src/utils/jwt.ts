import { UnauthorizedException } from '@nestjs/common';
import { isJWT } from 'class-validator';
import { randomUUID } from 'crypto';
import { JwtPayload, sign, SignOptions, verify } from 'jsonwebtoken';
import { ResponseMessage } from '@utils/enum';

export class AuthToken {
  /**
   * Generate a signed authentication token.
   */
  static generate(payload: JwtPayload, options?: SignOptions): string {
    return sign(payload, process.env.JWT_SECRET_KEY, {
      jwtid: randomUUID(),
      algorithm: 'HS256',
      expiresIn: (process.env.JWT_EXPIRES_IN || '7d') as SignOptions['expiresIn'],
      ...options,
    });
  }

  /**
   * Verify a token. Throws `UnauthorizedException` for malformed tokens and
   * `TokenExpiredError` (handled by AuthGuard) for expired ones.
   */
  static verify(token: string): JwtPayload {
    if (!isJWT(token)) throw new UnauthorizedException(ResponseMessage.UNAUTHENTICATED, { cause: new Error(ResponseMessage.INVALID_TOKEN) });
    return verify(token, process.env.JWT_SECRET_KEY) as JwtPayload;
  }
}
