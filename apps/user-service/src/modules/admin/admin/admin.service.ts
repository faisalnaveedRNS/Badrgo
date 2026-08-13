import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RoleService } from '@modules/role/role.service';
import { UserRoles } from '@utils/enum';
import { Hash } from '@utils/hash';
import { AdminAlreadyExists, AdminNotFound } from './admin.exception';
import { Admin } from './entities/admin.entity';
import { AdminView } from './views/admin.view';

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(Admin) private readonly adminRepository: Repository<Admin>,
    @InjectRepository(AdminView) private readonly adminView: Repository<AdminView>,
    private readonly roleService: RoleService,
  ) {}

  async create(email: string, password: string, name: string, role: UserRoles = UserRoles.ADMIN): Promise<Admin> {
    if (await this.adminRepository.exists({ where: { email } })) new AdminAlreadyExists();

    const admin = this.adminRepository.create({
      email,
      name,
      password: await Hash.make(password),
      role: await this.roleService.findByName(role),
    });

    const saved = await this.adminRepository.save(admin);
    delete saved.password;
    return saved;
  }

  async findByEmailWithPassword(email: string): Promise<Admin | null> {
    return this.adminRepository.findOne({ where: { email }, select: { id: true, email: true, password: true, status: true } });
  }

  /** Read path: served by the view, never the table. */
  async findById(id: string): Promise<AdminView> {
    const admin = await this.adminView.findOne({ where: { id } });
    if (!admin) new AdminNotFound();
    return admin;
  }

  /**
   * Creates the super admin on first boot; a no-op afterwards.
   */
  async ensureSuperAdmin(email: string, password: string): Promise<Admin> {
    const existing = await this.adminRepository.findOne({ where: { email } });
    if (existing) return existing;

    return this.create(email, password, 'Super Admin', UserRoles.SUPER_ADMIN);
  }
}
