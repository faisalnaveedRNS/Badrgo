import { ApiProperty } from '@nestjs/swagger';
import { ViewColumn, ViewEntity } from 'typeorm';
import { EStatus, UserRoles } from '@utils/enum';

/** Read model for admin GETs. The password column is not selected at all. */
@ViewEntity({
  name: 'admin_view',
  expression: `
  SELECT
    a.id,
    a.email,
    a.name,
    a.status,
    r.id                                   AS role_id,
    r.role_name                            AS role_name,
    a.created_at,
    a.updated_at

  FROM admins a
  LEFT JOIN roles r
    ON r.id = a.role_id

  WHERE a.deleted_at IS NULL
`,
})
export class AdminView {
  @ViewColumn()
  @ApiProperty({ example: '5a9d8056-fffd-49a7-b215-40df44873d7d' })
  id: string;

  @ViewColumn()
  @ApiProperty({ example: 'admin@badrgo.dev' })
  email: string;

  @ViewColumn()
  @ApiProperty({ example: 'Super Admin' })
  name: string;

  @ViewColumn()
  @ApiProperty({ enum: EStatus, example: EStatus.ACTIVE })
  status: EStatus;

  @ViewColumn()
  @ApiProperty({ example: '5a9d8056-fffd-49a7-b215-40df44873d7d' })
  roleId: string;

  @ViewColumn()
  @ApiProperty({ enum: UserRoles, example: UserRoles.SUPER_ADMIN })
  roleName: UserRoles;

  @ViewColumn()
  @ApiProperty({ example: '2024-01-29T08:12:24.980Z' })
  createdAt: Date;

  @ViewColumn()
  @ApiProperty({ example: '2024-01-29T08:12:24.980Z' })
  updatedAt: Date;
}
