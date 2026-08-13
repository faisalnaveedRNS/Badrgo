import { Global, Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';

/** Injection tokens for the downstream services. */
export const USER_SERVICE = 'USER_SERVICE';
export const WALLET_SERVICE = 'WALLET_SERVICE';
export const REPORT_SERVICE = 'REPORT_SERVICE';

/**
 * TCP clients for every service the gateway calls. Registered once, globally,
 * so feature modules only inject the token they need.
 */
@Global()
@Module({
  imports: [
    ClientsModule.register([
      {
        name: USER_SERVICE,
        transport: Transport.TCP,
        options: { host: process.env.USER_SERVICE_HOST || 'localhost', port: +(process.env.USER_SERVICE_PORT || 4001) },
      },
      {
        name: WALLET_SERVICE,
        transport: Transport.TCP,
        options: { host: process.env.WALLET_SERVICE_HOST || 'localhost', port: +(process.env.WALLET_SERVICE_PORT || 4002) },
      },
      {
        name: REPORT_SERVICE,
        transport: Transport.TCP,
        options: { host: process.env.REPORT_SERVICE_HOST || 'localhost', port: +(process.env.REPORT_SERVICE_PORT || 4003) },
      },
    ]),
  ],
  exports: [ClientsModule],
})
export class ServiceClientModule {}
