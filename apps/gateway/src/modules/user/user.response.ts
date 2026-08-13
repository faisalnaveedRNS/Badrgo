import { ApiProperty } from '@nestjs/swagger';
import { Response } from '@response';
import { EStatus, Language, UserRoles } from '@utils/enum';

/**
 * The wire shape of a user at the edge — mirrors `user_view` in the user
 * service. The gateway holds no entities, so the contract is declared here.
 */
export class UserModel {
  @ApiProperty({ example: '5a9d8056-fffd-49a7-b215-40df44873d7d' })
  id: string;

  @ApiProperty({ example: 'john@example.com' })
  email: string;

  @ApiProperty({ example: 'John' })
  firstName: string;

  @ApiProperty({ example: 'Doe' })
  lastName: string;

  @ApiProperty({ example: 'John Doe' })
  fullName: string;

  @ApiProperty({ example: '+923001234567' })
  phoneNo: string;

  @ApiProperty({ enum: EStatus, example: EStatus.ACTIVE })
  status: EStatus;

  @ApiProperty({ example: false })
  emailVerified: boolean;

  @ApiProperty({ enum: Language, example: Language.EN_US })
  language: Language;

  @ApiProperty({ enum: UserRoles, example: UserRoles.USER })
  roleName: UserRoles;

  @ApiProperty({ example: '2024-01-29T08:12:24.980Z' })
  createdAt: Date;
}

export class UserResponse extends Response {
  @ApiProperty({ type: UserModel })
  data: UserModel;

  constructor(user: UserModel) {
    super();
    this.data = user;
  }
}
