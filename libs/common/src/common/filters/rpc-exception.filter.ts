import { Catch, HttpException, RpcExceptionFilter } from '@nestjs/common';
import { Observable, throwError } from 'rxjs';
import { ResponseCode, ResponseMessage } from '@utils/enum';

/**
 * Keeps domain errors intact across a service boundary.
 *
 * Services throw the same `Exception` subclasses they always have; without this
 * filter Nest would flatten them to "Internal server error" on the way out, and
 * the gateway would lose the application `statusCode`.
 */
@Catch()
export class RpcAllExceptionsFilter implements RpcExceptionFilter {
  catch(exception: unknown): Observable<never> {
    if (exception instanceof HttpException) {
      const body = exception.getResponse();
      return throwError(() => (typeof body === 'object' ? body : { statusCode: exception.getStatus(), message: body }));
    }

    return throwError(() => ({
      statusCode: ResponseCode.INTERNAL_ERROR,
      message: (exception as Error)?.message || ResponseMessage.INTERNAL_SERVER_ERROR,
    }));
  }
}
