import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

export class BaseSearchService {
  constructor(protected readonly prisma: PrismaService) {}

  // Build generic order by clause
  protected buildOrderBy<T extends { sortBy?: string; order?: 'asc' | 'desc' }>(
    searchDto?: T,
    defaultSort: string = 'createdAt'
  ): Record<string, 'asc' | 'desc'> {
    const { sortBy = defaultSort, order = 'desc' } = searchDto || {};
    return { [sortBy]: order };
  }

  // Generic paginated query
  protected async executePaginatedQuery<T>(
    model: keyof PrismaService,
    where: any,
    searchDto?: { limit?: number; offset?: number },
    include?: any,
    orderBy?: any
  ) {
    const { limit = 20, offset = 0 } = searchDto || {};

    const [data, total] = await Promise.all([
      (this.prisma[model] as any).findMany({
        where,
        include,
        orderBy,
        take: limit,
        skip: offset,
      }),
      (this.prisma[model] as any).count({ where }),
    ]);

    return {
      data,
      meta: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total,
      },
    };
  }

  // Generic ownership check
  protected async checkOwnership(
    model: keyof PrismaService,
    id: string,
    userId: string,
    ownerField: string = 'ownerId'
  ) {
    const record = await (this.prisma[model] as any).findUnique({
      where: { id },
      select: { id: true, [ownerField]: true },
    });

    if (!record) throw new NotFoundException(`${String(model)} not found`);
    if (record[ownerField] !== userId)
      throw new ForbiddenException(`You can only modify your own ${String(model)}s`);

    return record;
  }
}
