import { ApiProperty } from '@nestjs/swagger';
import { Exception } from '@utils/helper';
import { ResponseCode, ResponseMessage } from '@utils/enum';

export class RoleNotFound extends Exception {
  @ApiProperty({ example: ResponseCode.ROLE_NOT_FOUND })
  statusCode: number;

  @ApiProperty({ example: ResponseMessage.ROLE_NOT_FOUND })
  message: string;

  constructor() {
    super(ResponseCode.ROLE_NOT_FOUND, ResponseMessage.ROLE_NOT_FOUND);
  }
}

export class InvalidRole extends Exception {
  @ApiProperty({ example: ResponseCode.INVALID_ROLE })
  statusCode: number;

  @ApiProperty({ example: ResponseMessage.INVALID_ROLE })
  message: string;

  constructor() {
    super(ResponseCode.INVALID_ROLE, ResponseMessage.INVALID_ROLE);
  }
}
