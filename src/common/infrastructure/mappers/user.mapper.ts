import { User as PrismaUser } from '@prisma/client';
import { UserRole } from 'src/common/enums/user-role.enum';
import { UserStatus } from 'src/common/enums/user-status.enum';
import { UserEntity } from 'src/users/entities/user.entity';

export class UserMapper {
  static toDomain(user: PrismaUser): UserEntity {
    return new UserEntity({
      id: user.id,
      email: user.email,
      phone: user.phone as string,
      name: user.name,
      role: user.role as unknown as UserRole,
      isActive: user.isActive,
      status: user.status as unknown as UserStatus,
      approvedAt: user.approvedAt,
      createdAt: user.createdAt,
    });
  }
}
