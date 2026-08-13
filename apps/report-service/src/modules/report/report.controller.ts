import { Controller, UseFilters } from '@nestjs/common';
import { MessagePattern, Payload, Transport } from '@nestjs/microservices';
import { RpcAllExceptionsFilter } from '@common/filters/rpc-exception.filter';
import { ReportPattern } from '@contracts/patterns';
import { PaginationDto } from '@common/dtos/index.dtos';
import { ReportType } from '@utils/enum';
import { ReportView } from './views/report.view';
import { ReportService } from './report.service';

/** Query side of the report service; the write side is the Kafka consumer. */
@UseFilters(RpcAllExceptionsFilter)
@Controller()
export class ReportController {
  constructor(private readonly service: ReportService) {}

  @MessagePattern(ReportPattern.REQUEST, Transport.TCP)
  async request(@Payload() payload: { type: ReportType; requestedBy: string; params: Record<string, any> }): Promise<ReportView> {
    return this.service.request(payload.type, payload.requestedBy, payload.params);
  }

  @MessagePattern(ReportPattern.FIND_BY_ID, Transport.TCP)
  async findById(@Payload() payload: { id: string }): Promise<ReportView> {
    return this.service.findById(payload.id);
  }

  @MessagePattern(ReportPattern.FIND_ALL, Transport.TCP)
  async findAll(@Payload() payload: { query: PaginationDto }) {
    return this.service.findAll(payload.query);
  }
}
