import { Global, Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';

const tcp = (host: string, port: string, fallbackPort: number) => ({
  transport: Transport.TCP as const,
  options: { host: process.env[host] || 'localhost', port: +(process.env[port] || fallbackPort) },
});

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
    // `registerAsync` so the factories run at DI time — `register` would read
    // process.env while this file is still being imported, before ConfigModule
    // has loaded the env file.
    ClientsModule.registerAsync([
      { name: USER_SERVICE, useFactory: () => tcp('USER_SERVICE_HOST', 'USER_SERVICE_PORT', 4001) },
      { name: WALLET_SERVICE, useFactory: () => tcp('WALLET_SERVICE_HOST', 'WALLET_SERVICE_PORT', 4002) },
      { name: REPORT_SERVICE, useFactory: () => tcp('REPORT_SERVICE_HOST', 'REPORT_SERVICE_PORT', 4003) },
    ]),
  ],
  exports: [ClientsModule],
})
export class ServiceClientModule {}
