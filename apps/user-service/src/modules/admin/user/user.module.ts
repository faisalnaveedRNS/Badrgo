import { Module } from '@nestjs/common';
import { UserModule } from '@modules/user/user.module';
import { AdminUserController } from './user.controller';

@Module({
  imports: [UserModule],
  controllers: [AdminUserController],
})
export class AdminUserModule {}
