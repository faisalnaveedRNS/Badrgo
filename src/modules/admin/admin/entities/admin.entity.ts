import { ApiProperty } from '@nestjs/swagger';
import { Exclude } from 'class-transformer';
import { Column, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { BaseEntity } from '@modules/common/entity/base.entity';
import { Role } from '@modules/role/entities/role.entity';
import { EStatus } from '@utils/enum';

@Entity({ name: 'admins' })
export class Admin extends BaseEntity {
  @ApiProperty({ example: '5a9d8056-fffd-49a7-b215-40df44873d7d' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ example: 'admin@badrgo.dev' })
  @Index({ unique: true })
  @Column({ length: 255 })
  email: string;

  @Exclude()
  @Column({ nullable: true, select: false })
  password: string;

  @ApiProperty({ example: 'Jane Admin' })
  @Column({ nullable: true, length: 255 })
  name: string;

  @ApiProperty({ enum: EStatus, example: EStatus.ACTIVE })
  @Column({ type: 'varchar', length: 32, default: EStatus.ACTIVE })
  status: EStatus;

  @ApiProperty({ type: () => Role })
  @ManyToOne(() => Role, { eager: true, nullable: true })
  @JoinColumn()
  role: Role;
}
