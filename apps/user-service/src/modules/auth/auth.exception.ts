import { ApiProperty } from '@nestjs/swagger';
import { Exception } from '@utils/helper';
import { ResponseCode, ResponseMessage } from '@utils/enum';

export class InvalidCredentials extends Exception {
  @ApiProperty({ example: ResponseCode.INVALID_CREDENTIALS })
  statusCode: number;

  @ApiProperty({ example: ResponseMessage.INVALID_CREDENTIALS })
  message: string;

  constructor() {
    super(ResponseCode.INVALID_CREDENTIALS, ResponseMessage.INVALID_CREDENTIALS);
  }
}

export class FailedToCreateUser extends Exception {
  @ApiProperty({ example: ResponseCode.FAILED_TO_CREATE_USER })
  statusCode: number;

  @ApiProperty({ example: ResponseMessage.FAILED_TO_CREATE_USER })
  message: string;

  constructor() {
    super(ResponseCode.FAILED_TO_CREATE_USER, ResponseMessage.FAILED_TO_CREATE_USER);
  }
}
