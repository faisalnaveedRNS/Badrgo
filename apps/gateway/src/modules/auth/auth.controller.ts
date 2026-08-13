import { Body, Controller, HttpStatus, Inject, Post, Res, UseGuards } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { ApiCreatedResponse, ApiOkResponse, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Response as ExpressResponse } from 'express';
import { InvalidInput } from '@common/responses';
import { RateLimitGuard, Throttle } from '@cache/index';
import { LoginDto, RegisterDto } from '@contracts/auth.dto';
import { AuthPattern } from '@contracts/patterns';
import { ResponseCode, ResponseMessage } from '@utils/enum';
import { USER_SERVICE } from '@gateway/modules/client/client.module';
import { send } from '@gateway/modules/client/service.client';
import { UserModel } from '@gateway/modules/user/user.response';
import { LoginResponse } from './auth.response';

/**
 * Public entry point. These are the only two unauthenticated routes on the
 * gateway, so they are rate limited harder than the rest — credential stuffing
 * and signup floods both arrive here first.
 */
@ApiTags('Auth')
@UseGuards(RateLimitGuard)
@Throttle(10, 60)
@Controller('auth')
export class AuthController {
  constructor(@Inject(USER_SERVICE) private readonly userService: ClientProxy) {}

  @Post('register')
  @ApiOperation({ summary: 'Register a user' })
  @ApiCreatedResponse({ description: ResponseMessage.CREATED_SUCCESSFULLY, type: LoginResponse })
  @ApiResponse({ status: ResponseCode.USER_ALREADY_EXISTS, type: InvalidInput })
  @ApiResponse({ status: ResponseCode.INVALID_INPUT, type: InvalidInput })
  async register(@Body() payload: RegisterDto, @Res({ passthrough: true }) res: ExpressResponse) {
    const { user, token } = await send<{ user: UserModel; token: string }>(this.userService, AuthPattern.REGISTER, payload);

    res.status(HttpStatus.CREATED);
    return new LoginResponse(user, token);
  }

  @Post('login')
  @ApiOperation({ summary: 'Login a user' })
  @ApiOkResponse({ description: ResponseMessage.SUCCESS, type: LoginResponse })
  @ApiResponse({ status: ResponseCode.INVALID_CREDENTIALS, type: InvalidInput })
  @ApiResponse({ status: ResponseCode.INACTIVE_ACCOUNT, type: InvalidInput })
  async login(@Body() payload: LoginDto, @Res({ passthrough: true }) res: ExpressResponse) {
    const { user, token } = await send<{ user: UserModel; token: string }>(this.userService, AuthPattern.LOGIN, payload);

    res.status(HttpStatus.OK);
    return new LoginResponse(user, token);
  }
}
