import { User as PrismaUser } from "@prisma/client";
import { UserRole } from "src/common/enums/user-role.enum";
import { UserStatus } from "src/common/enums/user-status.enum";
import { UserEntity } from "src/users/entities/user.entity";

export class UserMapper {
    static toDomain(prismaUser: PrismaUser):UserEntity {
        return new UserEntity({
            id: prismaUser.id,
            email: prismaUser.email,
            phone: prismaUser.phone as string,
            name: prismaUser.name,
            role: prismaUser.role as unknown as UserRole,
            isActive: prismaUser.isActive,
            status: prismaUser.status as unknown as UserStatus,
            approvedAt: prismaUser.approvedAt,
            createdAt: prismaUser.createdAt
        })

    }
}