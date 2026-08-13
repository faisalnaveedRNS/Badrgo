import { Module } from '@nestjs/common';
import { AdminModule } from '@modules/admin/admin/admin.module';
import { AdminAuthController } from './auth.controller';
import { AdminAuthService } from './auth.service';

@Module({
  imports: [AdminModule],
  controllers: [AdminAuthController],
  providers: [AdminAuthService],
  exports: [AdminAuthService],
})
export class AdminAuthModule {}
