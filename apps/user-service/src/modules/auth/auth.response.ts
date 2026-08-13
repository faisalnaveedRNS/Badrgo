import { ApiProperty } from '@nestjs/swagger';
import { Response } from '@response';
import { User } from '@modules/user/entities/user.entity';

export class LoginResponse extends Response {
  @ApiProperty({ type: User })
  user: User;

  @ApiProperty({ example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' })
  token: string;

  constructor(user: User, token: string) {
    super();
    this.user = user;
    this.token = token;
  }
}
