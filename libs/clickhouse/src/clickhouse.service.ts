import { Injectable, OnApplicationShutdown } from '@nestjs/common';
import { ClickHouseClient, createClient } from '@clickhouse/client';
import { LoggerService } from '@utils/logger/logger.service';

/**
 * Read access to the analytics store.
 *
 * Nothing here writes: rows arrive in ClickHouse straight from Kafka through its
 * own Kafka engine table (see `docker/clickhouse-init.sql`). Services only query.
 */
@Injectable()
export class ClickhouseService implements OnApplicationShutdown {
  private readonly client: ClickHouseClient;

  constructor(private readonly logger: LoggerService) {
    this.client = createClient({
      url: process.env.CLICKHOUSE_URL || 'http://localhost:8123',
      username: process.env.CLICKHOUSE_USER || 'default',
      password: process.env.CLICKHOUSE_PASSWORD || '',
      database: process.env.CLICKHOUSE_DATABASE || 'badrgo',
      request_timeout: +(process.env.CLICKHOUSE_TIMEOUT_MS || 10000),
      clickhouse_settings: {
        // Money must arrive as a scaled string ("879.50000000"), never as a JSON
        // number — a Decimal(38,8) through a JS float loses cents.
        output_format_decimal_trailing_zeros: 1,
        output_format_json_quote_decimals: 1,
      },
    });
  }

  async onApplicationShutdown(): Promise<void> {
    await this.client.close();
  }

  /**
   * Runs a parameterised query. Always pass values through `params` — string
   * interpolation into SQL is how an injection gets in.
   */
  async query<T>(query: string, params: Record<string, unknown> = {}): Promise<T[]> {
    const result = await this.client.query({ query, query_params: params, format: 'JSONEachRow' });
    return result.json<T>();
  }

  async ping(): Promise<boolean> {
    try {
      return (await this.client.ping()).success;
    } catch (error) {
      this.logger.error(error);
      return false;
    }
  }
}
