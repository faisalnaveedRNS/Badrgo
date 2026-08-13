import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PaginationDto } from '@common/dtos/index.dtos';
import { PaginationMeta } from '@common/responses';
import { ReportStatus, ReportType } from '@utils/enum';
import { paginationMeta } from '@utils/helper';
import { Report } from './entities/report.entity';
import { WalletProjection } from './entities/wallet-projection.entity';
import { ReportNotFound } from './report.exception';

@Injectable()
export class ReportService {
  constructor(
    @InjectRepository(Report) private readonly reportRepository: Repository<Report>,
    @InjectRepository(WalletProjection) private readonly projectionRepository: Repository<WalletProjection>,
  ) {}

  /**
   * Queues a report. Reads come from the local projection, so generating one
   * never touches the wallet service.
   */
  async request(type: ReportType, requestedBy: string, params: Record<string, any>): Promise<Report> {
    const report = await this.reportRepository.save(this.reportRepository.create({ type, requestedBy, params, status: ReportStatus.PENDING }));
    return this.generate(report);
  }

  async findById(id: string): Promise<Report> {
    const report = await this.reportRepository.findOne({ where: { id } });
    if (!report) new ReportNotFound();
    return report;
  }

  async findAll(query: PaginationDto): Promise<{ data: Report[]; meta: PaginationMeta }> {
    const page = query?.page || 1;
    const pageSize = query?.pageSize || 10;

    const [data, count] = await this.reportRepository.findAndCount({
      order: { createdAt: query?.sort === 'asc' ? 'ASC' : 'DESC' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });

    return { data, meta: paginationMeta(count, data.length, page, pageSize) };
  }

  /** Placeholder generation: aggregates the projection the consumer maintains. */
  private async generate(report: Report): Promise<Report> {
    const where = report.params?.userId ? { userId: report.params.userId } : {};
    const projections = await this.projectionRepository.find({ where });

    report.result = {
      wallets: projections.length,
      totalBalance: projections.reduce((sum, row) => sum + Number(row.balance), 0).toFixed(8),
      transactionCount: projections.reduce((sum, row) => sum + row.transactionCount, 0),
    };
    report.status = ReportStatus.READY;
    report.generatedAt = new Date();

    return this.reportRepository.save(report);
  }
}
