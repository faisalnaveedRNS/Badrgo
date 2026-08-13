import { HttpException } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom, timeout } from 'rxjs';
import { ResponseCode, ResponseMessage } from '@utils/enum';

const REQUEST_TIMEOUT = +(process.env.SERVICE_TIMEOUT_MS || 5000);

/**
 * Calls a downstream service and rethrows its error as if it had been raised
 * here — the `{ statusCode, message }` body the client already understands.
 *
 * A service that is down or slow surfaces as SERVICE_UNAVAILABLE rather than a
 * stack trace, so the gateway never leaks internals it doesn't own.
 */
export const send = async <T>(client: ClientProxy, pattern: string, payload: unknown): Promise<T> => {
  try {
    return await firstValueFrom(client.send<T>(pattern, payload).pipe(timeout(REQUEST_TIMEOUT)));
  } catch (error: any) {
    if (error?.statusCode) throw new HttpException(error, ResponseCode.BAD_REQUEST);

    throw new HttpException({ statusCode: ResponseCode.SERVICE_UNAVAILABLE, message: ResponseMessage.SERVICE_UNAVAILABLE }, ResponseCode.BAD_REQUEST);
  }
};
