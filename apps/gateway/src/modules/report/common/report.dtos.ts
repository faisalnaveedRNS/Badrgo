import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsObject, IsOptional } from 'class-validator';
import { ReportType } from '@utils/enum';

export class RequestReportDto {
  @ApiProperty({ enum: ReportType, example: ReportType.WALLET_BALANCE })
  @IsEnum(ReportType)
  type: ReportType;

  @ApiPropertyOptional({ example: { userId: '5a9d8056-fffd-49a7-b215-40df44873d7d' } })
  @IsOptional()
  @IsObject()
  params?: Record<string, any>;
}
