import { Body, Controller, HttpStatus, Post, Res, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Response } from 'express';
import { AuthGuard } from '@modules/auth/auth.guard';
import { HasRoles } from '@modules/common/decorator/role.decorator';
import { Forbidden, InvalidInput } from '@modules/common/responses';
import { AdminAlreadyExists, InactiveAdmin, InvalidAdminCredentials } from '@modules/admin/admin/admin.exception';
import { ResponseCode, ResponseMessage, UserRoles } from '@utils/enum';
import { AdminLoginResponse, AdminResponse } from './auth.response';
import { AdminAuthService } from './auth.service';
import { AdminLoginDto, CreateAdminDto } from './commons/auth.dtos';

@ApiTags('Admin Auth')
@Controller('admin/auth')
export class AdminAuthController {
  constructor(private readonly service: AdminAuthService) {}

  @Post('login')
  @ApiOperation({ summary: 'Login an admin' })
  @ApiOkResponse({ description: ResponseMessage.SUCCESS, type: AdminLoginResponse })
  @ApiResponse({ status: ResponseCode.INVALID_ADMIN_CREDENTIALS, type: InvalidAdminCredentials })
  @ApiResponse({ status: ResponseCode.INACTIVE_ADMIN, type: InactiveAdmin })
  @ApiResponse({ status: ResponseCode.INVALID_INPUT, type: InvalidInput })
  async login(@Body() payload: AdminLoginDto, @Res({ passthrough: true }) res: Response) {
    const { admin, token } = await this.service.login(payload);

    res.status(HttpStatus.OK);
    return new AdminLoginResponse(admin, token);
  }

  @Post()
  @ApiBearerAuth()
  @UseGuards(AuthGuard)
  @HasRoles(UserRoles.SUPER_ADMIN)
  @ApiOperation({ summary: 'Create an admin (super admin only)' })
  @ApiOkResponse({ description: ResponseMessage.CREATED_SUCCESSFULLY, type: AdminResponse })
  @ApiResponse({ status: ResponseCode.ADMIN_ALREADY_EXISTS, type: AdminAlreadyExists })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, type: Forbidden })
  async createAdmin(@Body() payload: CreateAdminDto, @Res({ passthrough: true }) res: Response) {
    const admin = await this.service.createAdmin(payload);

    res.status(HttpStatus.CREATED);
    return new AdminResponse(admin);
  }
}
