import { UserRole as PrismaUserRole } from '.prisma/client';
import { UserStatus as PrismaUserStatus } from '.prisma/client';
import { UserRole } from 'src/common/enums/user-role.enum';

export interface JwtPayload {
  sub: string;
  email: string;
  role: PrismaUserRole;
  status: PrismaUserStatus;
  iat?: number;
  exp?: number;
}
export interface RefreshJwtPayload {
  sub: string;
  tokenId: string;
}
export interface UserRoleType {
  role: UserRole;
}
