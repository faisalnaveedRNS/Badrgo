import { Body, Controller, Get, HttpStatus, Patch, Res, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Response } from 'express';
import { AuthGuard } from '@common/guards/auth.guard';
import { CurrentUser } from '@common/decorator/current-user.decorator';
import { HasRoles } from '@common/decorator/role.decorator';
import { SuccessResponse, Unauthenticated } from '@common/responses';
import { UserPayload } from '@models';
import { ResponseCode, ResponseMessage, UserRoles } from '@utils/enum';
import { ChangePasswordDto, UpdateProfileDto } from './common/user.dto';
import { IncorrectCurrentPassword, SameAsOldPassword, UserNotFound } from './user.exception';
import { UserResponse } from './user.response';
import { UserService } from './user.service';

@ApiTags('User')
@ApiBearerAuth()
@UseGuards(AuthGuard)
@HasRoles(UserRoles.USER)
@Controller('user')
export class UserController {
  constructor(private readonly service: UserService) {}

  @Get('me')
  @ApiOperation({ summary: 'Get the authenticated user profile' })
  @ApiOkResponse({ description: ResponseMessage.SUCCESS, type: UserResponse })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, type: Unauthenticated })
  @ApiResponse({ status: ResponseCode.USER_NOT_FOUND, type: UserNotFound })
  async me(@CurrentUser() currentUser: UserPayload, @Res({ passthrough: true }) res: Response) {
    const user = await this.service.findById(currentUser.id);

    res.status(HttpStatus.OK);
    return new UserResponse(user);
  }

  @Patch('me')
  @ApiOperation({ summary: 'Update the authenticated user profile' })
  @ApiOkResponse({ description: ResponseMessage.SUCCESS, type: UserResponse })
  @ApiResponse({ status: ResponseCode.USER_NOT_FOUND, type: UserNotFound })
  async updateProfile(@CurrentUser() currentUser: UserPayload, @Body() payload: UpdateProfileDto, @Res({ passthrough: true }) res: Response) {
    const user = await this.service.updateProfile(currentUser.id, payload);

    res.status(HttpStatus.OK);
    return new UserResponse(user);
  }

  @Patch('change-password')
  @ApiOperation({ summary: 'Change the authenticated user password' })
  @ApiOkResponse({ description: ResponseMessage.SUCCESS, type: SuccessResponse })
  @ApiResponse({ status: ResponseCode.INCORRECT_CURRENT_PASSWORD, type: IncorrectCurrentPassword })
  @ApiResponse({ status: ResponseCode.SAME_AS_OLD_PASSWORD, type: SameAsOldPassword })
  async changePassword(@CurrentUser() currentUser: UserPayload, @Body() payload: ChangePasswordDto, @Res({ passthrough: true }) res: Response) {
    await this.service.changePassword(currentUser.id, payload);

    res.status(HttpStatus.OK);
    return new SuccessResponse(ResponseMessage.UPDATED_SUCCESSFULLY);
  }
}
