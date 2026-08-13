import { ApiProperty } from '@nestjs/swagger';
import { Exception } from '@utils/helper';
import { ResponseCode, ResponseMessage } from '@utils/enum';

export class UserNotFound extends Exception {
  @ApiProperty({ example: ResponseCode.USER_NOT_FOUND })
  statusCode: number;

  @ApiProperty({ example: ResponseMessage.USER_NOT_FOUND })
  message: string;

  constructor() {
    super(ResponseCode.USER_NOT_FOUND, ResponseMessage.USER_NOT_FOUND);
  }
}

export class UserAlreadyExists extends Exception {
  @ApiProperty({ example: ResponseCode.USER_ALREADY_EXISTS })
  statusCode: number;

  @ApiProperty({ example: ResponseMessage.USER_ALREADY_EXISTS })
  message: string;

  constructor() {
    super(ResponseCode.USER_ALREADY_EXISTS, ResponseMessage.USER_ALREADY_EXISTS);
  }
}

export class InactiveAccount extends Exception {
  @ApiProperty({ example: ResponseCode.INACTIVE_ACCOUNT })
  statusCode: number;

  @ApiProperty({ example: ResponseMessage.INACTIVE_ACCOUNT })
  message: string;

  constructor() {
    super(ResponseCode.INACTIVE_ACCOUNT, ResponseMessage.INACTIVE_ACCOUNT);
  }
}

export class IncorrectCurrentPassword extends Exception {
  @ApiProperty({ example: ResponseCode.INCORRECT_CURRENT_PASSWORD })
  statusCode: number;

  @ApiProperty({ example: ResponseMessage.INCORRECT_CURRENT_PASSWORD })
  message: string;

  constructor() {
    super(ResponseCode.INCORRECT_CURRENT_PASSWORD, ResponseMessage.INCORRECT_CURRENT_PASSWORD);
  }
}

export class SameAsOldPassword extends Exception {
  @ApiProperty({ example: ResponseCode.SAME_AS_OLD_PASSWORD })
  statusCode: number;

  @ApiProperty({ example: ResponseMessage.SAME_AS_OLD_PASSWORD })
  message: string;

  constructor() {
    super(ResponseCode.SAME_AS_OLD_PASSWORD, ResponseMessage.SAME_AS_OLD_PASSWORD);
  }
}

export class FailedToUpdateUser extends Exception {
  @ApiProperty({ example: ResponseCode.FAILED_TO_UPDATE_USER })
  statusCode: number;

  @ApiProperty({ example: ResponseMessage.FAILED_TO_UPDATE_USER })
  message: string;

  constructor() {
    super(ResponseCode.FAILED_TO_UPDATE_USER, ResponseMessage.FAILED_TO_UPDATE_USER);
  }
}
