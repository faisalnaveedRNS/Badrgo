import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RoleModule } from '@modules/role/role.module';
import { AdminService } from './admin.service';
import { Admin } from './entities/admin.entity';
import { AdminView } from './views/admin.view';

@Module({
  imports: [TypeOrmModule.forFeature([Admin, AdminView]), RoleModule],
  providers: [AdminService],
  exports: [AdminService],
})
export class AdminModule {}
