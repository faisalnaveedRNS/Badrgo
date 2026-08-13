import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserRoles } from '@utils/enum';
import { RoleNotFound } from './role.exception';
import { Role } from './entities/role.entity';

@Injectable()
export class RoleService {
  constructor(@InjectRepository(Role) private readonly roleRepository: Repository<Role>) {}

  async findAll(): Promise<Role[]> {
    return this.roleRepository.find();
  }

  async findByName(name: UserRoles): Promise<Role> {
    const role = await this.roleRepository.findOne({ where: { name } });
    if (!role) new RoleNotFound();
    return role;
  }

  /**
   * Idempotently creates a role — used by the seeder on boot.
   */
  async ensure(name: UserRoles, description: string): Promise<Role> {
    const existing = await this.roleRepository.findOne({ where: { name } });
    if (existing) return existing;

    return this.roleRepository.save(this.roleRepository.create({ name, description }));
  }
}
