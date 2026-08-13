import { Body, Controller, Get, HttpStatus, Inject, Param, Post, Query, Res, UseGuards } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { ApiBearerAuth, ApiCreatedResponse, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Response as ExpressResponse } from 'express';
import { CurrentUser } from '@common/decorator/current-user.decorator';
import { HasRoles } from '@common/decorator/role.decorator';
import { PaginationDto, UuidParamDto } from '@common/dtos/index.dtos';
import { AuthGuard } from '@common/guards/auth.guard';
import { ReportPattern } from '@contracts/patterns';
import { RateLimitGuard } from '@cache/index';
import { UserPayload } from '@models';
import { ResponseMessage, UserRoles } from '@utils/enum';
import { REPORT_SERVICE } from '@gateway/modules/client/client.module';
import { send } from '@gateway/modules/client/service.client';
import { RequestReportDto } from './common/report.dtos';
import { ReportListResponse, ReportModel, ReportResponse } from './report.response';

/** Back office surface: reports are read by operations, not by end users. */
@ApiTags('Report')
@ApiBearerAuth()
@UseGuards(AuthGuard, RateLimitGuard)
@HasRoles(UserRoles.ADMIN, UserRoles.SUPER_ADMIN)
@Controller('admin/report')
export class ReportController {
  constructor(@Inject(REPORT_SERVICE) private readonly reportService: ClientProxy) {}

  @Post()
  @ApiOperation({ summary: 'Request a report' })
  @ApiCreatedResponse({ description: ResponseMessage.CREATED_SUCCESSFULLY, type: ReportResponse })
  async request(@CurrentUser() currentUser: UserPayload, @Body() payload: RequestReportDto, @Res({ passthrough: true }) res: ExpressResponse) {
    const report = await send<ReportModel>(this.reportService, ReportPattern.REQUEST, {
      type: payload.type,
      params: payload.params || {},
      requestedBy: currentUser.id,
    });

    res.status(HttpStatus.CREATED);
    return new ReportResponse(report);
  }

  @Get()
  @ApiOperation({ summary: 'List reports' })
  @ApiOkResponse({ description: ResponseMessage.SUCCESS, type: ReportListResponse })
  async findAll(@Query() query: PaginationDto, @Res({ passthrough: true }) res: ExpressResponse) {
    const result = await send<{ data: ReportModel[]; meta: any }>(this.reportService, ReportPattern.FIND_ALL, {
      query: { page: query.page, pageSize: query.pageSize, sort: query.sort },
    });

    res.status(HttpStatus.OK);
    return new ReportListResponse(result.data, result.meta);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get one report' })
  @ApiOkResponse({ description: ResponseMessage.SUCCESS, type: ReportResponse })
  async findById(@Param() params: UuidParamDto, @Res({ passthrough: true }) res: ExpressResponse) {
    const report = await send<ReportModel>(this.reportService, ReportPattern.FIND_BY_ID, { id: params.id });

    res.status(HttpStatus.OK);
    return new ReportResponse(report);
  }
}
