import { ApiProperty } from '@nestjs/swagger';
import { Response } from '@response';
import { UserView } from '@modules/user/views/user.view';

export class LoginResponse extends Response {
  @ApiProperty({ type: UserView })
  user: UserView;

  @ApiProperty({ example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' })
  token: string;

  constructor(user: UserView, token: string) {
    super();
    this.user = user;
    this.token = token;
  }
}
