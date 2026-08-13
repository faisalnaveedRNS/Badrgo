import { ApiProperty } from '@nestjs/swagger';
import { Response } from '@response';
import { PaginatedResponse, PaginationMeta } from '@common/responses';
import { User } from './entities/user.entity';

export class UserResponse extends Response {
  @ApiProperty({ type: User })
  data: User;

  constructor(user: User) {
    super();
    this.data = user;
  }
}

export class UserListResponse extends PaginatedResponse<User> {
  @ApiProperty({ type: [User] })
  data: User[];

  constructor(users: User[], meta: PaginationMeta) {
    super(users, meta);
  }
}
