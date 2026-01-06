import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { User, Prisma } from '@prisma/client';
import { UserMapper } from 'src/common/infrastructure/mappers/user.mapper';
import { UserEntity } from './entities/user.entity';
import { CreateUserDto } from './dto/user.dto';
import { UserStatus } from 'src/common/enums/user-status.enum';


@Injectable()
export class UsersService {
  constructor(private prisma:PrismaService){}


   async create(data: CreateUserDto): Promise<UserEntity> {
    const user = await this.prisma.user.create({ data: data as Prisma.UserCreateInput });
    if(!user) throw new Error('Error creating user');
    return UserMapper.toDomain(user);
  }

      async findAll() {
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
 async findOne(id: string): Promise<UserEntity | null>{
    const user = await this.prisma.user.findUnique({where:{id}});
    if(!user) throw new Error('User not found');
    return UserMapper.toDomain(user);
  }

  async findByEmail(email:string): Promise<UserEntity | null>{
    const user = await this.prisma.user.findUniqueOrThrow({where:{email}});
    return UserMapper.toDomain(user);
  }
  async findByEmailValidat(email:string){
    const user = await this.prisma.user.findUniqueOrThrow({where:{email}});
    return user;
  }

   async update(id: string, data: Prisma.UserUpdateInput): Promise<UserEntity> {
   const user = await this.prisma.user.update({
      where: { id },
      data,
    });
      return UserMapper.toDomain(user);
  }

  async updateStatus(id:string,status:UserStatus){
    const user = await this.prisma.user.update({
      where: { id },
      data: { status },
    });
    return UserMapper.toDomain(user);
  }

  async delete(id: string): Promise<UserEntity> {
    const user = await this.prisma.user.delete({
      where: { id },
    });
    return UserMapper.toDomain(user);
  }

}

