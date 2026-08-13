import { ConsoleLogger, Injectable, Scope } from '@nestjs/common';
import { NodeEnv } from '@utils/enum';

@Injectable({ scope: Scope.TRANSIENT })
export class LoggerService extends ConsoleLogger {
  constructor() {
    super('App', { timestamp: true });
    if ((process.env.NODE_ENV as NodeEnv) === NodeEnv.TEST) this.setLogLevels(['error']);
  }
}
