import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus, LoggerService } from '@nestjs/common';
import { Response } from 'express';
import { ResponseCode, ResponseMessage } from '@utils/enum';

/**
 * Single exit point for every error leaving the application.
 *
 * - `Exception` subclasses arrive as an HttpException carrying an object body
 *   ({ statusCode, message }) and are passed through untouched.
 * - ValidationPipe failures (plain 400) are remapped to the INVALID_INPUT
 *   application code, with the field errors moved to `errors`.
 * - Anything unexpected is logged and reported as a 500 without leaking internals.
 */
@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  constructor(private readonly loggerService: LoggerService) {}

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    const status: HttpStatus = exception instanceof HttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;
    const body: any = exception instanceof HttpException ? exception.getResponse() : ResponseMessage.INTERNAL_SERVER_ERROR;

    if (status === HttpStatus.INTERNAL_SERVER_ERROR) this.loggerService.error(exception);

    if (typeof body === 'object') {
      if (body.statusCode === ResponseCode.BAD_REQUEST) {
        return response.status(status).send({
          statusCode: ResponseCode.INVALID_INPUT,
          message: ResponseMessage.INVALID_INPUT,
          errors: Array.isArray(body.message) ? body.message : [body.message],
        });
      }

      return response.status(status).send(body);
    }

    return response.status(status).send({
      statusCode: status,
      message: body,
    });
  }
}
