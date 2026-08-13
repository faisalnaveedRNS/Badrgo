import { Module } from '@nestjs/common';
import { AdminModule } from '@modules/admin/admin/admin.module';
import { RoleModule } from '@modules/role/role.module';
import { SeedService } from './seeder.service';

@Module({
  imports: [RoleModule, AdminModule],
  providers: [SeedService],
  exports: [SeedService],
})
export class SeedModule {}
