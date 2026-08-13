import { Body, Controller, HttpStatus, Post, Res } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Response } from 'express';
import { InvalidInput } from '@common/responses';
import { UserAlreadyExists, InactiveAccount } from '@modules/user/user.exception';
import { ResponseCode, ResponseMessage } from '@utils/enum';
import { InvalidCredentials } from './auth.exception';
import { LoginResponse } from './auth.response';
import { AuthService } from './auth.service';
import { LoginDto, RegisterDto } from './common/auth.dto';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly service: AuthService) {}

  @Post('register')
  @ApiOperation({ summary: 'Register a user' })
  @ApiOkResponse({ description: ResponseMessage.SUCCESS, type: LoginResponse })
  @ApiResponse({ status: ResponseCode.USER_ALREADY_EXISTS, type: UserAlreadyExists })
  @ApiResponse({ status: ResponseCode.INVALID_INPUT, type: InvalidInput })
  async register(@Body() payload: RegisterDto, @Res({ passthrough: true }) res: Response) {
    const { user, token } = await this.service.register(payload);

    res.status(HttpStatus.CREATED);
    return new LoginResponse(user, token);
  }

  @Post('login')
  @ApiOperation({ summary: 'Login a user' })
  @ApiOkResponse({ description: ResponseMessage.SUCCESS, type: LoginResponse })
  @ApiResponse({ status: ResponseCode.INVALID_CREDENTIALS, type: InvalidCredentials })
  @ApiResponse({ status: ResponseCode.INACTIVE_ACCOUNT, type: InactiveAccount })
  async login(@Body() payload: LoginDto, @Res({ passthrough: true }) res: Response) {
    const { user, token } = await this.service.login(payload);

    res.status(HttpStatus.OK);
    return new LoginResponse(user, token);
  }
}
