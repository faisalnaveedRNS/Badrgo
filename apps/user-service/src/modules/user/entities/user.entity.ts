import { ApiProperty } from '@nestjs/swagger';
import { Exclude } from 'class-transformer';
import { Column, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { BaseEntity } from '@common/entity/base.entity';
import { Role } from '@modules/role/entities/role.entity';
import { EStatus, Language } from '@utils/enum';

@Entity({ name: 'users' })
export class User extends BaseEntity {
  @ApiProperty({ example: '5a9d8056-fffd-49a7-b215-40df44873d7d' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ example: 'john@example.com' })
  @Index({ unique: true })
  @Column({ length: 255 })
  email: string;

  /** Never leaves the service layer: excluded from every serialized response. */
  @Exclude()
  @Column({ nullable: true, select: false })
  password: string;

  @ApiProperty({ example: 'John' })
  @Column({ nullable: true, length: 100 })
  firstName: string;

  @ApiProperty({ example: 'Doe' })
  @Column({ nullable: true, length: 100 })
  lastName: string;

  @ApiProperty({ example: '+923001234567' })
  @Column({ nullable: true, length: 32 })
  phoneNo: string;

  @ApiProperty({ enum: EStatus, example: EStatus.ACTIVE })
  @Column({ type: 'varchar', length: 32, default: EStatus.ACTIVE })
  status: EStatus;

  @ApiProperty({ example: false })
  @Column({ default: false })
  emailVerified: boolean;

  @ApiProperty({ enum: Language, example: Language.EN_US })
  @Column({ type: 'varchar', length: 16, default: Language.EN_US })
  language: Language;

  @ApiProperty({ type: () => Role })
  @ManyToOne(() => Role, { eager: true, nullable: true })
  @JoinColumn()
  role: Role;
}
