import { ApiProperty } from '@nestjs/swagger';
import { Response } from '@response';
import { Admin } from '@modules/admin/admin/entities/admin.entity';
import { AdminView } from '@modules/admin/admin/views/admin.view';

export class AdminLoginResponse extends Response {
  @ApiProperty({ type: AdminView })
  admin: AdminView;

  @ApiProperty({ example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' })
  token: string;

  constructor(admin: AdminView, token: string) {
    super();
    this.admin = admin;
    this.token = token;
  }
}

export class AdminResponse extends Response {
  @ApiProperty({ type: Admin })
  data: Admin;

  constructor(admin: Admin) {
    super();
    this.data = admin;
  }
}
