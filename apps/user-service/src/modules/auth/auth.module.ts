import { Module } from '@nestjs/common';
import { UserModule } from '@modules/user/user.module';
import { AuthController } from './auth.controller';
import { AuthRpcController } from './auth.rpc.controller';
import { AuthService } from './auth.service';

@Module({
  imports: [UserModule],
  controllers: [AuthController, AuthRpcController],
  providers: [AuthService],
  exports: [AuthService],
})
export class AuthModule {}
