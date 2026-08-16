import { ApiProperty } from '@nestjs/swagger';
import { ResponseCode, ResponseMessage } from '@utils/enum';
import { Exception } from '@utils/helper';

export class WalletNotFound extends Exception {
  @ApiProperty({ example: ResponseCode.WALLET_NOT_FOUND })
  statusCode: number;

  @ApiProperty({ example: ResponseMessage.WALLET_NOT_FOUND })
  message: string;

  constructor() {
    super(ResponseCode.WALLET_NOT_FOUND, ResponseMessage.WALLET_NOT_FOUND);
  }
}

export class WalletAlreadyExists extends Exception {
  @ApiProperty({ example: ResponseCode.WALLET_ALREADY_EXISTS })
  statusCode: number;

  @ApiProperty({ example: ResponseMessage.WALLET_ALREADY_EXISTS })
  message: string;

  constructor() {
    super(ResponseCode.WALLET_ALREADY_EXISTS, ResponseMessage.WALLET_ALREADY_EXISTS);
  }
}

export class WalletInactive extends Exception {
  @ApiProperty({ example: ResponseCode.WALLET_INACTIVE })
  statusCode: number;

  @ApiProperty({ example: ResponseMessage.WALLET_INACTIVE })
  message: string;

  constructor() {
    super(ResponseCode.WALLET_INACTIVE, ResponseMessage.WALLET_INACTIVE);
  }
}

export class InsufficientBalance extends Exception {
  @ApiProperty({ example: ResponseCode.INSUFFICIENT_BALANCE })
  statusCode: number;

  @ApiProperty({ example: ResponseMessage.INSUFFICIENT_BALANCE })
  message: string;

  constructor() {
    super(ResponseCode.INSUFFICIENT_BALANCE, ResponseMessage.INSUFFICIENT_BALANCE);
  }
}

export class InvalidAmount extends Exception {
  @ApiProperty({ example: ResponseCode.INVALID_AMOUNT })
  statusCode: number;

  @ApiProperty({ example: ResponseMessage.INVALID_AMOUNT })
  message: string;

  constructor() {
    super(ResponseCode.INVALID_AMOUNT, ResponseMessage.INVALID_AMOUNT);
  }
}

export class AmountLimitExceeded extends Exception {
  @ApiProperty({ example: ResponseCode.AMOUNT_LIMIT_EXCEEDED })
  statusCode: number;

  @ApiProperty({ example: ResponseMessage.AMOUNT_LIMIT_EXCEEDED })
  message: string;

  constructor() {
    super(ResponseCode.AMOUNT_LIMIT_EXCEEDED, ResponseMessage.AMOUNT_LIMIT_EXCEEDED);
  }
}

export class CurrencyMismatch extends Exception {
  @ApiProperty({ example: ResponseCode.CURRENCY_MISMATCH })
  statusCode: number;

  @ApiProperty({ example: ResponseMessage.CURRENCY_MISMATCH })
  message: string;

  constructor() {
    super(ResponseCode.CURRENCY_MISMATCH, ResponseMessage.CURRENCY_MISMATCH);
  }
}

export class DuplicateRequest extends Exception {
  @ApiProperty({ example: ResponseCode.DUPLICATE_REQUEST })
  statusCode: number;

  @ApiProperty({ example: ResponseMessage.DUPLICATE_REQUEST })
  message: string;

  constructor() {
    super(ResponseCode.DUPLICATE_REQUEST, ResponseMessage.DUPLICATE_REQUEST);
  }
}
