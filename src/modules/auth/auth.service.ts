import { Injectable } from '@nestjs/common';
import { UserService } from '@modules/user/user.service';
import { InactiveAccount } from '@modules/user/user.exception';
import { EStatus, UserRoles } from '@utils/enum';
import { Hash } from '@utils/hash';
import { AuthToken } from '@utils/jwt';
import { InvalidCredentials } from './auth.exception';
import { LoginDto, RegisterDto } from './common/auth.dto';
import { LoginResult } from './common/auth.interface';

@Injectable()
export class AuthService {
  constructor(private readonly userService: UserService) {}

  async register(payload: RegisterDto): Promise<LoginResult> {
    const user = await this.userService.create(payload.email, payload.password);
    return { user, token: this.sign(user.id, user.email) };
  }

  async login(payload: LoginDto): Promise<LoginResult> {
    const credentials = await this.userService.findByEmailWithPassword(payload.email);
    if (!credentials || !(await Hash.compare(payload.password, credentials.password))) new InvalidCredentials();
    if (credentials.status !== EStatus.ACTIVE) new InactiveAccount();

    const user = await this.userService.findById(credentials.id);
    return { user, token: this.sign(user.id, user.email) };
  }

  private sign(id: string, email: string): string {
    return AuthToken.generate({ user: { id, email, role: UserRoles.USER } });
  }
}
