import { ApiProperty } from '@nestjs/swagger';
import { Response } from '@response';
import { PaginatedResponse, PaginationMeta } from '@common/responses';
import { UserView } from './views/user.view';

/** Responses are built from the view, so a read and a write return the same shape. */
export class UserResponse extends Response {
  @ApiProperty({ type: UserView })
  data: UserView;

  constructor(user: UserView) {
    super();
    this.data = user;
  }
}

export class UserListResponse extends PaginatedResponse<UserView> {
  @ApiProperty({ type: [UserView] })
  data: UserView[];

  constructor(users: UserView[], meta: PaginationMeta) {
    super(users, meta);
  }
}
