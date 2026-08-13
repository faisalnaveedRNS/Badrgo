import { Controller, UseFilters } from '@nestjs/common';
import { MessagePattern, Payload, Transport } from '@nestjs/microservices';
import { RpcAllExceptionsFilter } from '@common/filters/rpc-exception.filter';
import { LoginDto, RegisterDto } from '@contracts/auth.dto';
import { AuthPattern } from '@contracts/patterns';
import { LoginResult } from './common/auth.interface';
import { AuthService } from './auth.service';

/**
 * TCP face of the auth flows, called by the gateway. Token signing stays here —
 * the gateway verifies tokens but never issues them, so `JWT_SECRET_KEY` is only
 * needed for signing in one place.
 */
@UseFilters(RpcAllExceptionsFilter)
@Controller()
export class AuthRpcController {
  constructor(private readonly service: AuthService) {}

  @MessagePattern(AuthPattern.REGISTER, Transport.TCP)
  async register(@Payload() payload: RegisterDto): Promise<LoginResult> {
    return this.service.register(payload);
  }

  @MessagePattern(AuthPattern.LOGIN, Transport.TCP)
  async login(@Payload() payload: LoginDto): Promise<LoginResult> {
    return this.service.login(payload);
  }
}
