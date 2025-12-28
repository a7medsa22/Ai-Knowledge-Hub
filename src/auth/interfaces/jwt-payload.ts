import { UserRole, UserStatus } from "@prisma/client";

export interface JwtPayload {
  sub: string;
  email: string;
  role: UserRole;
  status:UserStatus;
  iat?: number;
  exp?: number;
}
export interface RefreshJwtPayload {
  sub: string;
  tokenId: string;
}