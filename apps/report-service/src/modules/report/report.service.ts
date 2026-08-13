import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ClickhouseService } from '@analytics/clickhouse.service';
import { PaginationDto } from '@common/dtos/index.dtos';
import { PaginationMeta } from '@common/responses';
import { ReportStatus, ReportType } from '@utils/enum';
import { paginationMeta } from '@utils/helper';
import { Report } from './entities/report.entity';
import { ReportNotFound } from './report.exception';
import { ReportView } from './views/report.view';

/** One row, already aggregated by `wallet_report_view`. Decimals arrive as strings. */
interface WalletSummaryRow {
  wallets: string;
  total_balance: string;
  total_credited: string;
  total_debited: string;
  transaction_count: string;
  last_event_at: string;
}

/** One row per wallet from `wallet_detail_view`. */
interface WalletDetailRow {
  wallet_id: string;
  user_id: string;
  currency: string;
  balance: string;
  total_credited: string;
  total_debited: string;
  transaction_count: string;
  last_event_at: string;
}

@Injectable()
export class ReportService {
  constructor(
    @InjectRepository(Report) private readonly reportRepository: Repository<Report>,
    @InjectRepository(ReportView) private readonly reportView: Repository<ReportView>,
    private readonly clickhouse: ClickhouseService,
  ) {}

  /**
   * Queues a report and generates it from ClickHouse. The wallet database is
   * never touched: every figure comes from the events Kafka delivered.
   */
  async request(type: ReportType, requestedBy: string, params: Record<string, any>): Promise<ReportView> {
    const report = await this.reportRepository.save(this.reportRepository.create({ type, requestedBy, params, status: ReportStatus.PENDING }));
    const generated = await this.generate(report);

    return this.findById(generated.id);
  }

  /** Read path: the view, which lifts the headline numbers out of `result`. */
  async findById(id: string): Promise<ReportView> {
    const report = await this.reportView.findOne({ where: { id } });
    if (!report) new ReportNotFound();
    return report;
  }

  async findAll(query: PaginationDto): Promise<{ data: ReportView[]; meta: PaginationMeta }> {
    const page = query?.page || 1;
    const pageSize = query?.pageSize || 10;

    const [data, count] = await this.reportView.findAndCount({
      order: { createdAt: query?.sort === 'asc' ? 'ASC' : 'DESC' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });

    return { data, meta: paginationMeta(count, data.length, page, pageSize) };
  }

  /**
   * Fetches the finished report.
   *
   * ClickHouse aggregates; this method stores. `wallet_report_view` is a
   * parameterized view that returns a single already-summed row, so no total is
   * ever computed in application code — nothing here adds, divides or rounds a
   * number. A failed query leaves the report FAILED rather than publishing
   * figures it could not compute.
   */
  private async generate(report: Report): Promise<Report> {
    try {
      const userId = report.params?.userId || '';

      const [summary] = await this.clickhouse.query<WalletSummaryRow>(`SELECT * FROM wallet_report_view(userId = {userId:String})`, { userId });

      // Statement style reports also want the per-wallet breakdown — likewise
      // aggregated by ClickHouse, one row per wallet.
      const detail =
        report.type === ReportType.TRANSACTION_HISTORY
          ? await this.clickhouse.query<WalletDetailRow>(`SELECT * FROM wallet_detail_view(userId = {userId:String})`, { userId })
          : undefined;

      report.result = {
        wallets: Number(summary.wallets),
        totalBalance: summary.total_balance,
        totalCredited: summary.total_credited,
        totalDebited: summary.total_debited,
        transactionCount: Number(summary.transaction_count),
        lastEventAt: summary.last_event_at,
        ...(detail ? { walletsDetail: detail } : {}),
      };
      report.status = ReportStatus.READY;
      report.generatedAt = new Date();
    } catch {
      report.status = ReportStatus.FAILED;
    }

    return this.reportRepository.save(report);
  }
}
