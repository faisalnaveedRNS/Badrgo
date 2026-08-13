import { ApiProperty } from '@nestjs/swagger';
import { Exception } from '@utils/helper';
import { ResponseCode, ResponseMessage } from '@utils/enum';

export class AdminNotFound extends Exception {
  @ApiProperty({ example: ResponseCode.ADMIN_NOT_FOUND })
  statusCode: number;

  @ApiProperty({ example: ResponseMessage.ADMIN_NOT_FOUND })
  message: string;

  constructor() {
    super(ResponseCode.ADMIN_NOT_FOUND, ResponseMessage.ADMIN_NOT_FOUND);
  }
}

export class AdminAlreadyExists extends Exception {
  @ApiProperty({ example: ResponseCode.ADMIN_ALREADY_EXISTS })
  statusCode: number;

  @ApiProperty({ example: ResponseMessage.ADMIN_ALREADY_EXISTS })
  message: string;

  constructor() {
    super(ResponseCode.ADMIN_ALREADY_EXISTS, ResponseMessage.ADMIN_ALREADY_EXISTS);
  }
}

export class InvalidAdminCredentials extends Exception {
  @ApiProperty({ example: ResponseCode.INVALID_ADMIN_CREDENTIALS })
  statusCode: number;

  @ApiProperty({ example: ResponseMessage.INVALID_ADMIN_CREDENTIALS })
  message: string;

  constructor() {
    super(ResponseCode.INVALID_ADMIN_CREDENTIALS, ResponseMessage.INVALID_ADMIN_CREDENTIALS);
  }
}

export class InactiveAdmin extends Exception {
  @ApiProperty({ example: ResponseCode.INACTIVE_ADMIN })
  statusCode: number;

  @ApiProperty({ example: ResponseMessage.INACTIVE_ADMIN })
  message: string;

  constructor() {
    super(ResponseCode.INACTIVE_ADMIN, ResponseMessage.INACTIVE_ADMIN);
  }
}
