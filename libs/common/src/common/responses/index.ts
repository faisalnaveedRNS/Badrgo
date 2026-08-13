import { HttpStatus } from '@nestjs/common';
import { ApiProperty } from '@nestjs/swagger';
import { Response } from '@response';
import { ResponseCode, ResponseMessage } from '@utils/enum';

export class SuccessResponse extends Response {
  constructor(message: ResponseMessage = ResponseMessage.SUCCESS) {
    super(ResponseCode.SUCCESS, message);
  }
}

export class InternalServerError {
  @ApiProperty({ example: ResponseMessage.INTERNAL_SERVER_ERROR })
  message: string;

  @ApiProperty({ example: HttpStatus.INTERNAL_SERVER_ERROR })
  statusCode: number;
}

export class Unauthenticated {
  @ApiProperty({ example: ResponseMessage.UNAUTHENTICATED })
  message: string;

  @ApiProperty({ example: HttpStatus.UNAUTHORIZED })
  statusCode: number;
}

export class Forbidden {
  @ApiProperty({ example: ResponseMessage.FORBIDDEN_ACCESS })
  message: string;

  @ApiProperty({ example: HttpStatus.FORBIDDEN })
  statusCode: number;
}

export class InvalidInput {
  @ApiProperty({ example: ResponseMessage.INVALID_INPUT })
  message: string;

  @ApiProperty({ example: ResponseCode.INVALID_INPUT })
  statusCode: number;

  @ApiProperty({ example: ['email must be an email'] })
  errors: string[];
}

export class PaginationMeta {
  @ApiProperty({ example: 100 })
  totalItems: number;

  @ApiProperty({ example: 10 })
  itemCount: number;

  @ApiProperty({ example: 10 })
  itemsPerPage: number;

  @ApiProperty({ example: 10 })
  totalPages: number;

  @ApiProperty({ example: 1 })
  currentPage: number;
}

/**
 * Base class for every paginated list response. Concrete responses redeclare
 * `data` with `@ApiProperty({ type: [Entity] })` so Swagger renders the shape.
 */
export class PaginatedResponse<T> extends Response {
  @ApiProperty({ type: PaginationMeta })
  meta: PaginationMeta;

  data: T[];

  constructor(data: T[], meta: PaginationMeta) {
    super();
    this.data = data;
    this.meta = meta;
  }
}
