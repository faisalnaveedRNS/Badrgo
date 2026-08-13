import { ApiProperty } from '@nestjs/swagger';
import { Response } from '@response';
import { PaginatedResponse, PaginationMeta } from '@common/responses';
import { ReportStatus, ReportType } from '@utils/enum';

export class ReportModel {
  @ApiProperty({ example: '5a9d8056-fffd-49a7-b215-40df44873d7d' })
  id: string;

  @ApiProperty({ enum: ReportType, example: ReportType.TRANSACTION_HISTORY })
  type: ReportType;

  @ApiProperty({ enum: ReportStatus, example: ReportStatus.READY })
  status: ReportStatus;

  @ApiProperty({ example: { wallets: 3, totalBalance: '5250.00000000' } })
  result: Record<string, any>;
}

export class ReportResponse extends Response {
  @ApiProperty({ type: ReportModel })
  data: ReportModel;

  constructor(report: ReportModel) {
    super();
    this.data = report;
  }
}

export class ReportListResponse extends PaginatedResponse<ReportModel> {
  @ApiProperty({ type: [ReportModel] })
  data: ReportModel[];

  constructor(reports: ReportModel[], meta: PaginationMeta) {
    super(reports, meta);
  }
}
