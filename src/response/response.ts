import { ApiProperty } from '@nestjs/swagger';
import { ResponseCode, ResponseMessage } from '@utils/enum';

/**
 * Every successful payload extends this class, so each response carries
 * `statusCode` + `message` on top of its own fields.
 */
export class Response {
  @ApiProperty({ example: ResponseCode.SUCCESS })
  statusCode: number;

  @ApiProperty({ example: ResponseMessage.SUCCESS })
  message: string;

  constructor(statusCode: ResponseCode = ResponseCode.SUCCESS, message: ResponseMessage = ResponseMessage.SUCCESS) {
    this.statusCode = statusCode;
    this.message = message;
  }
}
