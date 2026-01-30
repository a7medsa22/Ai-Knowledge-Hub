import { UserRole } from 'src/common/enums/user-role.enum';
import { UserStatus } from 'src/common/enums/user-status.enum';

export interface JwtPayload {
  sub: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  iat?: number;
  exp?: number;
}
export interface RefreshJwtPayload {
  sub: string;
  tokenId: string;
}
