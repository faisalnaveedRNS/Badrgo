import { Controller, UseFilters } from '@nestjs/common';
import { MessagePattern, Payload, Transport } from '@nestjs/microservices';
import { RpcAllExceptionsFilter } from '@common/filters/rpc-exception.filter';
import { UserPattern } from '@contracts/patterns';
import { User } from './entities/user.entity';
import { UserService } from './user.service';

/**
 * TCP face of the user service, called by the gateway. The HTTP controllers in
 * this module stay as they are — same service, two transports.
 */
@UseFilters(RpcAllExceptionsFilter)
@Controller()
export class UserRpcController {
  constructor(private readonly service: UserService) {}

  @MessagePattern(UserPattern.FIND_BY_ID, Transport.TCP)
  async findById(@Payload() payload: { id: string }): Promise<User> {
    return this.service.findById(payload.id);
  }

  @MessagePattern(UserPattern.EXISTS, Transport.TCP)
  async exists(@Payload() payload: { id: string }): Promise<boolean> {
    const user = await this.service.findById(payload.id).catch(() => null);
    return Boolean(user);
  }
}
