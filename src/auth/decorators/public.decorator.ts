import { SetMetadata } from "@nestjs/common";
import { UserRole } from "@prisma/client";

export const IS_PUBLIC_KEY = 'isPublic';
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);

