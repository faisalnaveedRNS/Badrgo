import { User } from '@modules/user/entities/user.entity';

export interface LoginResult {
  user: User;
  token: string;
}
