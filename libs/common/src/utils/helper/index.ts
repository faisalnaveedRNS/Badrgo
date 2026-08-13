import { HttpException } from '@nestjs/common';
import { PaginationMeta } from '@common/responses';
import { ResponseCode, ResponseMessage } from '@utils/enum';

/**
 * Base class of every domain exception.
 *
 * Throwing `new UserNotFound()` raises an HttpException whose HTTP status is
 * 400 while the body carries the application `statusCode`. Subclasses only
 * declare `@ApiProperty` examples so they double as Swagger response types.
 */
export class Exception {
  constructor(responseCode?: ResponseCode, responseMessage?: ResponseMessage) {
    throw new HttpException(
      {
        statusCode: responseCode || ResponseCode.GENERIC_ERROR,
        message: responseMessage || ResponseMessage.GENERIC_ERROR,
      },
      ResponseCode.BAD_REQUEST,
    );
  }
}

export const generateOTP = (): number => Math.floor(100000 + Math.random() * 900000);

export const generateRandomString = (length: number, isNumeric = false): string => {
  const alphanumeric = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const numeric = '0123456789';
  const characters = isNumeric ? numeric : alphanumeric;

  let result = '';
  for (let i = 0; i < length; i++) result += characters[Math.floor(Math.random() * characters.length)];
  return result;
};

/**
 * Builds the pagination meta for a `[data, count]` result of `findAndCount`.
 */
export const paginationMeta = (count: number, itemCount: number, page: number, pageSize: number): PaginationMeta => ({
  totalItems: count,
  itemCount,
  itemsPerPage: Number(pageSize),
  totalPages: pageSize ? Math.ceil(count / pageSize) : 0,
  currentPage: Number(page),
});
