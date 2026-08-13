import { ApiProperty } from '@nestjs/swagger';
import { ViewColumn, ViewEntity } from 'typeorm';
import { EStatus, Language, UserRoles } from '@utils/enum';

/**
 * Read model for every user GET.
 *
 * The role is flattened to `roleName` so a read costs one scan instead of an
 * eager join per row, and soft-deleted users are excluded in the view itself —
 * callers cannot forget `withDeleted: false`.
 */
@ViewEntity({
  name: 'user_view',
  expression: `
  SELECT
    u.id,
    u.email,
    u.first_name,
    u.last_name,
    NULLIF(TRIM(CONCAT_WS(' ', u.first_name, u.last_name)), '') AS full_name,
    u.phone_no,
    u.status,
    u.email_verified,
    u.language,
    r.id                                   AS role_id,
    r.role_name                            AS role_name,
    u.created_at,
    u.updated_at

  FROM users u
  LEFT JOIN roles r
    ON r.id = u.role_id

  WHERE u.deleted_at IS NULL
`,
})
export class UserView {
  @ViewColumn()
  @ApiProperty({ example: '5a9d8056-fffd-49a7-b215-40df44873d7d' })
  id: string;

  @ViewColumn()
  @ApiProperty({ example: 'john@example.com' })
  email: string;

  @ViewColumn()
  @ApiProperty({ example: 'John' })
  firstName: string;

  @ViewColumn()
  @ApiProperty({ example: 'Doe' })
  lastName: string;

  @ViewColumn()
  @ApiProperty({ example: 'John Doe' })
  fullName: string;

  @ViewColumn()
  @ApiProperty({ example: '+923001234567' })
  phoneNo: string;

  @ViewColumn()
  @ApiProperty({ enum: EStatus, example: EStatus.ACTIVE })
  status: EStatus;

  @ViewColumn()
  @ApiProperty({ example: false })
  emailVerified: boolean;

  @ViewColumn()
  @ApiProperty({ enum: Language, example: Language.EN_US })
  language: Language;

  @ViewColumn()
  @ApiProperty({ example: '5a9d8056-fffd-49a7-b215-40df44873d7d' })
  roleId: string;

  @ViewColumn()
  @ApiProperty({ enum: UserRoles, example: UserRoles.USER })
  roleName: UserRoles;

  @ViewColumn()
  @ApiProperty({ example: '2024-01-29T08:12:24.980Z' })
  createdAt: Date;

  @ViewColumn()
  @ApiProperty({ example: '2024-01-29T08:12:24.980Z' })
  updatedAt: Date;
}
