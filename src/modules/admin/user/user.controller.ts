import { Body, Controller, Delete, Get, HttpStatus, Param, Patch, Query, Res, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Response } from 'express';
import { AuthGuard } from '@modules/auth/auth.guard';
import { HasRoles } from '@modules/common/decorator/role.decorator';
import { PaginationDto, UuidParamDto } from '@modules/common/dtos/index.dtos';
import { Forbidden, SuccessResponse, Unauthenticated } from '@modules/common/responses';
import { UserNotFound } from '@modules/user/user.exception';
import { UserListResponse, UserResponse } from '@modules/user/user.response';
import { UserService } from '@modules/user/user.service';
import { ResponseCode, ResponseMessage, UserRoles } from '@utils/enum';
import { UpdateUserStatusDto } from './commons/user.dtos';

/**
 * Admin side of the user resource. Same service, different surface: listing,
 * inspection and moderation instead of self-service.
 */
@ApiTags('Admin User')
@ApiBearerAuth()
@UseGuards(AuthGuard)
@HasRoles(UserRoles.ADMIN, UserRoles.SUPER_ADMIN)
@Controller('admin/user')
export class AdminUserController {
  constructor(private readonly service: UserService) {}

  @Get()
  @ApiOperation({ summary: 'List users' })
  @ApiOkResponse({ description: ResponseMessage.SUCCESS, type: UserListResponse })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, type: Unauthenticated })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, type: Forbidden })
  async findAll(@Query() query: PaginationDto, @Res({ passthrough: true }) res: Response) {
    const { data, meta } = await this.service.findAll(query);

    res.status(HttpStatus.OK);
    return new UserListResponse(data, meta);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a user by id' })
  @ApiOkResponse({ description: ResponseMessage.SUCCESS, type: UserResponse })
  @ApiResponse({ status: ResponseCode.USER_NOT_FOUND, type: UserNotFound })
  async findOne(@Param() params: UuidParamDto, @Res({ passthrough: true }) res: Response) {
    const user = await this.service.findById(params.id);

    res.status(HttpStatus.OK);
    return new UserResponse(user);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Activate, deactivate or block a user' })
  @ApiOkResponse({ description: ResponseMessage.UPDATED_SUCCESSFULLY, type: UserResponse })
  @ApiResponse({ status: ResponseCode.USER_NOT_FOUND, type: UserNotFound })
  async updateStatus(@Param() params: UuidParamDto, @Body() payload: UpdateUserStatusDto, @Res({ passthrough: true }) res: Response) {
    const user = await this.service.updateStatus(params.id, payload.status);

    res.status(HttpStatus.OK);
    return new UserResponse(user);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Soft delete a user' })
  @ApiOkResponse({ description: ResponseMessage.DELETED_SUCCESSFULLY, type: SuccessResponse })
  @ApiResponse({ status: ResponseCode.USER_NOT_FOUND, type: UserNotFound })
  async remove(@Param() params: UuidParamDto, @Res({ passthrough: true }) res: Response) {
    await this.service.remove(params.id);

    res.status(HttpStatus.OK);
    return new SuccessResponse(ResponseMessage.DELETED_SUCCESSFULLY);
  }
}
