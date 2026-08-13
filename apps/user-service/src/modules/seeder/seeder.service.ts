import { Injectable, OnApplicationBootstrap } from '@nestjs/common';
import { RoleService } from '@modules/role/role.service';
import { NodeEnv, UserRoles } from '@utils/enum';
import { LoggerService } from '@utils/logger/logger.service';

/**
 * Seeds the rows the application cannot boot without: the role table.
 * Idempotent, so it is safe to run on every boot and from tests.
 */
@Injectable()
export class SeedService implements OnApplicationBootstrap {
  constructor(
    private readonly roleService: RoleService,
    private readonly logger: LoggerService,
  ) {}

  async onApplicationBootstrap() {
    if ((process.env.NODE_ENV as NodeEnv) === NodeEnv.TEST) return;
    await this.seedData();
  }

  async seedData(): Promise<void> {
    await this.roleService.ensure(UserRoles.USER, 'Standard application user');
    await this.roleService.ensure(UserRoles.ADMIN, 'Back office administrator');
    await this.roleService.ensure(UserRoles.SUPER_ADMIN, 'Administrator with full access');

    this.logger.log('Seed data ensured');
  }
}
