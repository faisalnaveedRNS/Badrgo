import { Injectable } from '@nestjs/common';
import { AdminService } from '@modules/admin/admin/admin.service';
import { Admin } from '@modules/admin/admin/entities/admin.entity';
import { AdminView } from '@modules/admin/admin/views/admin.view';
import { InactiveAdmin, InvalidAdminCredentials } from '@modules/admin/admin/admin.exception';
import { EStatus, UserRoles } from '@utils/enum';
import { Hash } from '@utils/hash';
import { AuthToken } from '@utils/jwt';
import { AdminLoginDto, CreateAdminDto } from './commons/auth.dtos';

@Injectable()
export class AdminAuthService {
  constructor(private readonly adminService: AdminService) {}

  async login(payload: AdminLoginDto): Promise<{ admin: AdminView; token: string }> {
    const credentials = await this.adminService.findByEmailWithPassword(payload.email);
    if (!credentials || !(await Hash.compare(payload.password, credentials.password))) new InvalidAdminCredentials();
    if (credentials.status !== EStatus.ACTIVE) new InactiveAdmin();

    const admin = await this.adminService.findById(credentials.id);
    return { admin, token: AuthToken.generate({ user: { id: admin.id, email: admin.email, role: admin.roleName ?? UserRoles.ADMIN } }) };
  }

  async createAdmin(payload: CreateAdminDto): Promise<Admin> {
    return this.adminService.create(payload.email, payload.password, payload.name);
  }
}
