import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { User, Prisma } from '@prisma/client';
export type UserWithoutPassword = Omit<User, 'password'>;


@Injectable()
export class UsersService {
  constructor(private prisma:PrismaService){}

  
   create(data:Prisma.UserCreateInput): Promise<User> {
    return this.prisma.user.create({data});
  }

      async findAll(): Promise<UserWithoutPassword[]> {
     return this.prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }
 async findOne(id: string): Promise<User | null>{
    const user = await this.prisma.user.findUnique({where:{id}});
    if(!user) throw new Error('User not found');
    return user
  }
  async findByEmail(email:string): Promise<User | null>{
    return this.prisma.user.findUnique({where:{email}});
  }

   async update(id: string, data: Prisma.UserUpdateInput): Promise<User> {
    return this.prisma.user.update({
      where: { id },
      data,
    });
  }

  async delete(id: string): Promise<User> {
    return this.prisma.user.delete({
      where: { id },
    });
  }

}
