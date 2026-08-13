import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { EStatus } from '@utils/enum';

export class UpdateUserStatusDto {
  @ApiProperty({ enum: EStatus, example: EStatus.BLOCKED })
  @IsEnum(EStatus)
  status: EStatus;
}
