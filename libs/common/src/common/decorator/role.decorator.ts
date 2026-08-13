import { SetMetadata } from '@nestjs/common';
import { UserRoles } from '@utils/enum';

export const ROLES_KEY = 'roles';

/**
 * Restricts a route to the given roles. Enforced by `AuthGuard`.
 */
export const HasRoles = (...roles: UserRoles[]) => SetMetadata(ROLES_KEY, roles);
