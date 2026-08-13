import { Module } from '@nestjs/common';
import { RoleModule } from '@modules/role/role.module';
import { SeedService } from './seeder.service';

@Module({
  imports: [RoleModule],
  providers: [SeedService],
  exports: [SeedService],
})
export class SeedModule {}
