import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { SearchCategoryDto } from './dto/search-category.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class CategoriesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, dto: CreateCategoryDto) {
    return this.prisma.category.create({
      data: {
        ...dto,
        authorId: userId,
      },
      include: {
        author: {
          select: { id: true, email: true, name: true },
        },
      },
    });
  }

  async findAll(search?: SearchCategoryDto) {
    const where = this.buildWhereClause(search, { isPublic: true });
    return this.executeQuery(where, search);
  }

  async findUserCategories(userId: string, search?: SearchCategoryDto) {
    const where = this.buildWhereClause(search, { authorId: userId });
    return this.executeQuery(where, search);
  }

  async findOne(id: string, userId?: string) {
    const category = await this.prisma.category.findUnique({
      where: { id },
      include: {
        author: {
          select: { id: true, email: true, name: true },
        },
        docs: {
          include: {
            doc: {
              select: {
                id: true,
                title: true,
                content: true,
                summary: true,
                isPublic: true,
                createdAt: true,
                updatedAt: true,
              },
            },
          },
        },
      },
    });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    if (!category.isPublic && category.authorId !== userId) {
      throw new ForbiddenException('Access denied to this private category');
    }

    return category;
  }

  async update(id: string, userId: string, dto: UpdateCategoryDto) {
    await this.checkCategoryOwnership(id, userId);

    return this.prisma.category.update({
      where: { id },
      data: dto,
      include: {
        author: {
          select: { id: true, email: true, name: true },
        },
      },
    });
  }

  async remove(id: string, userId: string) {
    await this.checkCategoryOwnership(id, userId);

    return this.prisma.category.delete({
      where: { id },
    });
  }

  async addDocument(categoryId: string, docId: string, userId: string) {
    // 1. User must own the category
    await this.checkCategoryOwnership(categoryId, userId);

    // 2. Document must exist and be accessible to the user (either owned by user or public)
    const doc = await this.prisma.doc.findUnique({
      where: { id: docId },
      select: { id: true, authorId: true, isPublic: true },
    });

    if (!doc) {
      throw new NotFoundException('Document not found');
    }

    if (!doc.isPublic && doc.authorId !== userId) {
      throw new ForbiddenException('You do not have access to this document');
    }

    // 3. Check if relationship already exists to prevent duplicate key error
    const exists = await this.prisma.categoryDoc.findUnique({
      where: {
        categoryId_docId: { categoryId, docId },
      },
    });

    if (exists) {
      throw new BadRequestException('Document is already in this category');
    }

    // 4. Link document
    return this.prisma.categoryDoc.create({
      data: {
        categoryId,
        docId,
      },
      include: {
        category: true,
        doc: true,
      },
    });
  }

  async removeDocument(categoryId: string, docId: string, userId: string) {
    // 1. User must own the category
    await this.checkCategoryOwnership(categoryId, userId);

    // 2. Check if relation exists
    const exists = await this.prisma.categoryDoc.findUnique({
      where: {
        categoryId_docId: { categoryId, docId },
      },
    });

    if (!exists) {
      throw new NotFoundException('Document is not linked to this category');
    }

    // 3. Unlink
    return this.prisma.categoryDoc.delete({
      where: {
        categoryId_docId: { categoryId, docId },
      },
    });
  }

  async findCategoryDocs(categoryId: string, userId?: string, limit = 20, offset = 0) {
    // Check if category exists and is accessible
    const category = await this.prisma.category.findUnique({
      where: { id: categoryId },
      select: { id: true, authorId: true, isPublic: true },
    });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    if (!category.isPublic && category.authorId !== userId) {
      throw new ForbiddenException('Access denied to this private category');
    }

    const [docs, total] = await Promise.all([
      this.prisma.categoryDoc.findMany({
        where: { categoryId },
        include: {
          doc: {
            include: {
              author: {
                select: { id: true, name: true, email: true },
              },
            },
          },
        },
        take: limit,
        skip: offset,
        orderBy: { addedAt: 'desc' },
      }),
      this.prisma.categoryDoc.count({
        where: { categoryId },
      }),
    ]);

    return {
      data: docs.map((cd) => cd.doc),
      total,
      limit,
      offset,
      hasMore: offset + limit < total,
    };
  }

  // Helpers
  private async checkCategoryOwnership(categoryId: string, userId: string) {
    const category = await this.prisma.category.findUnique({
      where: { id: categoryId },
      select: { id: true, authorId: true },
    });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    if (category.authorId !== userId) {
      throw new ForbiddenException('You do not own this category');
    }

    return category;
  }

  private buildWhereClause(
    search?: SearchCategoryDto,
    additionalWhere?: Prisma.CategoryWhereInput,
  ): Prisma.CategoryWhereInput {
    const { query } = search || {};
    const where: Prisma.CategoryWhereInput = { ...(additionalWhere || {}) };

    if (query) {
      where.OR = [
        { name: { contains: query, mode: 'insensitive' } },
        { description: { contains: query, mode: 'insensitive' } },
      ];
    }

    return where;
  }

  private async executeQuery(
    where: Prisma.CategoryWhereInput,
    search?: SearchCategoryDto,
  ) {
    const MAX_LIMIT = 100;
    const offset = search?.offset ?? 0;
    const limit = Math.min(search?.limit ?? 10, MAX_LIMIT);
    const sortBy = search?.sortBy ?? 'updatedAt';
    const order = search?.order ?? 'desc';

    const [categories, total] = await this.prisma.$transaction([
      this.prisma.category.findMany({
        where,
        include: {
          author: {
            select: { id: true, email: true, name: true },
          },
          _count: {
            select: { docs: true },
          },
        },
        orderBy: {
          [sortBy]: order,
        },
        take: limit,
        skip: offset,
      }),
      this.prisma.category.count({ where }),
    ]);

    return {
      data: categories,
      total,
      limit,
      offset,
      hasMore: offset + limit < total,
    };
  }
}
