import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';
import { UserMapper } from '../common/infrastructure/mappers/user.mapper';
import { UserEntity } from './entities/user.entity';
import { CreateUserDto } from './dto/user.dto';
import { UserStatus } from '../common/enums/user-status.enum';
import { BaseSearchService } from '../common/utils/base-search.service';
import { SearchUserDto } from './dto/search-user.dto';

@Injectable()
export class UsersService extends BaseSearchService {
  constructor(protected readonly prisma: PrismaService) {
    super(prisma);
  }

  async create(data: CreateUserDto): Promise<UserEntity> {
    const user = await this.prisma.user.create({
      data: data as Prisma.UserCreateInput,
    });
    if (!user) throw new Error('Error creating user');
    return UserMapper.toDomain(user);
  }

  async findAll(search?: SearchUserDto) {
    const { query } = search || {};
    const where: Prisma.UserWhereInput = {};

    if (query) {
      where.OR = [
        { name: { contains: query, mode: 'insensitive' } },
        { email: { contains: query, mode: 'insensitive' } },
      ];
    }

    const orderBy = this.buildOrderBy(search, 'createdAt');

    return this.executePaginatedQuery(
      'user',
      where,
      search,
      undefined,
      orderBy,
    );
  }
  async findOne(id: string): Promise<UserEntity | null> {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new Error('User not found');
    return UserMapper.toDomain(user);
  }

  async findByEmail(email: string): Promise<UserEntity | null> {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) {
      return null;
    }
    return UserMapper.toDomain(user);
  }
  async findByEmailWithPassword(email: string) {
    const user = await this.prisma.user.findUniqueOrThrow({ where: { email } });
    return user;
  }

  async update(id: string, data: Prisma.UserUpdateInput): Promise<UserEntity> {
    const user = await this.prisma.user.update({
      where: { id },
      data,
    });
    return UserMapper.toDomain(user);
  }

  async updateStatus(email: string, status: UserStatus) {
    const user = await this.prisma.user.update({
      where: { email },
      data: { status },
    });
    return UserMapper.toDomain(user);
  }

  async updateLastActivity(userId: string) {
    return this.prisma.user.update({
      where: { id: userId },
      data: { updatedAt: new Date() },
    });
  }

  async delete(id: string): Promise<UserEntity> {
    const user = await this.prisma.user.delete({
      where: { id },
    });
    return UserMapper.toDomain(user);
  }
}
