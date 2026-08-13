import { ApiProperty } from '@nestjs/swagger';
import { Response } from '@response';
import { UserModel } from '@gateway/modules/user/user.response';

export class LoginResponse extends Response {
  @ApiProperty({ type: UserModel })
  user: UserModel;

  @ApiProperty({ example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' })
  token: string;

  constructor(user: UserModel, token: string) {
    super();
    this.user = user;
    this.token = token;
  }
}
