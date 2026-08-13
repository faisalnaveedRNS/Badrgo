import { UserView } from '@modules/user/views/user.view';

export interface LoginResult {
  user: UserView;
  token: string;
}
