import { UserRoles } from '@utils/enum';

export interface UserPayload {
  id: string;
  email?: string;
  role: UserRoles;
}

declare module 'jsonwebtoken' {
  interface JwtPayload {
    user: UserPayload;
  }
}

export type Sort = 'asc' | 'desc';

export enum SortType {
  ASC = 'asc',
  DESC = 'desc',
}

export interface ApiQueryFilters<SortBy = string> {
  search?: string;
  page?: number;
  pageSize?: number;
  sortBy?: SortBy;
  sort?: Sort;
}
