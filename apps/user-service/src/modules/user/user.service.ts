import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, ILike, Repository } from 'typeorm';
import { PaginationDto } from '@common/dtos/index.dtos';
import { PaginationMeta } from '@common/responses';
import { RoleService } from '@modules/role/role.service';
import { EStatus, UserRoles } from '@utils/enum';
import { Hash } from '@utils/hash';
import { paginationMeta } from '@utils/helper';
import { ChangePasswordDto, UpdateProfileDto } from './common/user.dto';
import { User } from './entities/user.entity';
import { IncorrectCurrentPassword, SameAsOldPassword, UserAlreadyExists, UserNotFound } from './user.exception';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User) private readonly userRepository: Repository<User>,
    private readonly roleService: RoleService,
  ) {}

  async create(email: string, password: string): Promise<User> {
    if (await this.userRepository.exists({ where: { email } })) new UserAlreadyExists();

    const user = this.userRepository.create({
      email,
      password: await Hash.make(password),
      role: await this.roleService.findByName(UserRoles.USER),
    });

    const saved = await this.userRepository.save(user);
    delete saved.password;
    return saved;
  }

  /**
   * Loads a user together with the (normally hidden) password column — only
   * used by the authentication flows.
   */
  async findByEmailWithPassword(email: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { email }, select: { id: true, email: true, password: true, status: true } });
  }

  async findById(id: string): Promise<User> {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) new UserNotFound();
    return user;
  }

  async findAll(query: PaginationDto): Promise<{ data: User[]; meta: PaginationMeta }> {
    const where: FindOptionsWhere<User> = {};
    if (query.search) where.email = ILike(`%${query.search}%`);

    const [data, count] = await this.userRepository.findAndCount({
      where,
      order: { createdAt: query.sort === 'asc' ? 'ASC' : 'DESC' },
      skip: query.skip,
      take: query.pageSize,
    });

    return { data, meta: paginationMeta(count, data.length, query.page, query.pageSize) };
  }

  async updateProfile(id: string, payload: UpdateProfileDto): Promise<User> {
    const user = await this.findById(id);
    Object.assign(user, payload);
    return this.userRepository.save(user);
  }

  async changePassword(id: string, payload: ChangePasswordDto): Promise<void> {
    const user = await this.userRepository.findOne({ where: { id }, select: { id: true, password: true } });
    if (!user) new UserNotFound();

    if (!(await Hash.compare(payload.currentPassword, user.password))) new IncorrectCurrentPassword();
    if (await Hash.compare(payload.newPassword, user.password)) new SameAsOldPassword();

    await this.userRepository.update(id, { password: await Hash.make(payload.newPassword) });
  }

  async updateStatus(id: string, status: EStatus): Promise<User> {
    const user = await this.findById(id);
    user.status = status;
    return this.userRepository.save(user);
  }

  async remove(id: string): Promise<void> {
    await this.findById(id);
    await this.userRepository.softDelete(id);
  }
}
