import { Injectable } from '@nestjs/common';
import { DataSourceOptions } from 'typeorm';
import { Admin } from '@modules/admin/admin/entities/admin.entity';
import { Role } from '@modules/role/entities/role.entity';
import { User } from '@modules/user/entities/user.entity';
import { AppConfig } from '@utils/config';

/** Entities owned by the user service. */
export const entities = [User, Role, Admin];

@Injectable()
export class AppService {
  static typeormConfig(): DataSourceOptions {
    return AppConfig.typeorm(process.env.DB_DATABASE, entities);
  }

  static envConfiguration(): string {
    return AppConfig.envConfiguration();
  }

  static startup() {
    AppConfig.startup();
  }
}
