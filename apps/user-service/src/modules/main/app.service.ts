import { Injectable } from '@nestjs/common';
import { DataSourceOptions } from 'typeorm';
import { Admin } from '@modules/admin/admin/entities/admin.entity';
import { Role } from '@modules/role/entities/role.entity';
import { User } from '@modules/user/entities/user.entity';
import { AdminView } from '@modules/admin/admin/views/admin.view';
import { UserView } from '@modules/user/views/user.view';
import { AppConfig } from '@utils/config';

/** Tables owned by the user service, plus the views every GET reads from. */
export const entities = [User, Role, Admin, UserView, AdminView];

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
