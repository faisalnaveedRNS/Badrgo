import { ApiProperty } from '@nestjs/swagger';
import { ResponseCode, ResponseMessage } from '@utils/enum';
import { Exception } from '@utils/helper';

export class ReportNotFound extends Exception {
  @ApiProperty({ example: ResponseCode.REPORT_NOT_FOUND })
  statusCode: number;

  @ApiProperty({ example: ResponseMessage.REPORT_NOT_FOUND })
  message: string;

  constructor() {
    super(ResponseCode.REPORT_NOT_FOUND, ResponseMessage.REPORT_NOT_FOUND);
  }
}

export class ReportNotReady extends Exception {
  @ApiProperty({ example: ResponseCode.REPORT_NOT_READY })
  statusCode: number;

  @ApiProperty({ example: ResponseMessage.REPORT_NOT_READY })
  message: string;

  constructor() {
    super(ResponseCode.REPORT_NOT_READY, ResponseMessage.REPORT_NOT_READY);
  }
}
