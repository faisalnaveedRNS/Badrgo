import { ApiProperty } from '@nestjs/swagger';
import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { BaseEntity } from '@modules/common/entity/base.entity';
import { UserRoles } from '@utils/enum';

@Entity({ name: 'roles' })
export class Role extends BaseEntity {
  @ApiProperty({ example: '5a9d8056-fffd-49a7-b215-40df44873d7d' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ enum: UserRoles, example: UserRoles.USER })
  @Column({ name: 'role_name', type: 'varchar', unique: true })
  name: UserRoles;

  @ApiProperty({ example: 'Standard application user' })
  @Column({ nullable: true })
  description: string;
}
