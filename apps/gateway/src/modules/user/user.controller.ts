import { Controller, Get, HttpStatus, Inject, Res, UseGuards } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Response as ExpressResponse } from 'express';
import { CurrentUser } from '@common/decorator/current-user.decorator';
import { HasRoles } from '@common/decorator/role.decorator';
import { AuthGuard } from '@common/guards/auth.guard';
import { InvalidInput, Unauthenticated } from '@common/responses';
import { RateLimitGuard, RedisService } from '@cache/index';
import { UserPattern } from '@contracts/patterns';
import { UserPayload } from '@models';
import { ResponseCode, ResponseMessage, UserRoles } from '@utils/enum';
import { USER_SERVICE } from '@gateway/modules/client/client.module';
import { send } from '@gateway/modules/client/service.client';
import { UserModel, UserResponse } from './user.response';

const PROFILE_CACHE_TTL = 30;

@ApiTags('User')
@ApiBearerAuth()
@UseGuards(AuthGuard, RateLimitGuard)
@HasRoles(UserRoles.USER)
@Controller('user')
export class UserController {
  constructor(
    @Inject(USER_SERVICE) private readonly userService: ClientProxy,
    private readonly redis: RedisService,
  ) {}

  @Get('me')
  @ApiOperation({ summary: 'Get the authenticated user profile' })
  @ApiOkResponse({ description: ResponseMessage.SUCCESS, type: UserResponse })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, type: Unauthenticated })
  @ApiResponse({ status: ResponseCode.USER_NOT_FOUND, type: InvalidInput })
  async me(@CurrentUser() currentUser: UserPayload, @Res({ passthrough: true }) res: ExpressResponse) {
    // The profile is read on nearly every screen and changes rarely.
    const user = await this.redis.remember(`user:${currentUser.id}`, PROFILE_CACHE_TTL, () => send<UserModel>(this.userService, UserPattern.FIND_BY_ID, { id: currentUser.id }));

    res.status(HttpStatus.OK);
    return new UserResponse(user);
  }
}
