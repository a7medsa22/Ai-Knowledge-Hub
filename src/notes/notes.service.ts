import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateNoteDto } from './dto/create-note.dto';
import { Note, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { SearchNoteDto } from './dto/search-note.dto';
import { UpdateNoteDto } from './dto/update-note.dto';

@Injectable()
export class NotesService {
  constructor(private readonly prisma: PrismaService) {}

  public async create(userId: string, dto: CreateNoteDto): Promise<Note> {
    const { content, docId } = dto;
    if (docId) {
      await this.validateDocumentAccess(docId, userId);
    }

    return this.prisma.note.create({
      data: {
        content,
        authorId: userId,
        docId: docId || null,
      },
      include: this.gerNoteInclude(),
    });
  }
  public findAll(userId: string, search?: SearchNoteDto) {
    const where = this.buildWhereClause(userId, search);
    return this.executeSearchQuery(where, search);
  }

  public async findOne(id: string, userId: string): Promise<Note> {
    const note = await this.prisma.note.findFirstOrThrow({
      where: {
        id,
        authorId: userId,
      },
      include: this.gerNoteInclude(),
    });

    return note;
  }

  async findByDocument(userId: string, docId: string, search?: SearchNoteDto) {
    await this.validateDocumentAccess(docId, userId);

    const where = this.buildWhereClause(userId, { ...search, docId });
    return this.executeSearchQuery(where, search);
  }

  async update(id: string, userId: string, dto: UpdateNoteDto): Promise<Note> {
    // Check ownership
    await this.checkNoteOwnership(id, userId);

    return this.prisma.note.update({
      where: { id },
      data: dto,
      include: this.gerNoteInclude(),
    });
  }

  async remove(id: string, userId: string): Promise<Note> {
    // Check ownership
    await this.checkNoteOwnership(id, userId);

    return this.prisma.note.delete({
      where: { id },
      include: this.gerNoteInclude(),
    });
  }

  // Utility methods
  async getNotesStats(userId: string) {
    const [totalNotes, notesWithDocs, standaloneNotes] = await Promise.all([
      this.prisma.note.count({
        where: { authorId: userId },
      }),
      this.prisma.note.count({
        where: {
          authorId: userId,
          docId: { not: null },
        },
      }),
      this.prisma.note.count({
        where: {
          authorId: userId,
          docId: null,
        },
      }),
    ]);

    return {
      totalNotes,
      notesWithDocs,
      standaloneNotes,
    };
  }

  // Get recent notes for dashboard
  async getRecentNotes(userId: string, limit: number = 5) {
    return this.prisma.note.findMany({
      where: { authorId: userId },
      include: this.gerNoteInclude(),
      orderBy: { updatedAt: 'desc' },
      take: limit,
    });
  }

  //Standard include for note queries
  private gerNoteInclude() {
    return {
      author: {
        select: { id: true, email: true, name: true },
      },
      doc: {
        select: { id: true, title: true, isPublic: true, authorId: true },
      },
    };
  }
  // Validate document access for note operations
  private async validateDocumentAccess(docId: string, userId: string) {
    const doc = await this.prisma.doc.findUniqueOrThrow({
      where: { id: docId },
      select: {
        id: true,
        authorId: true,
        isPublic: true,
      },
    });

    // User can add notes to their own docs or public docs
    if (!doc.isPublic && doc.authorId !== userId) {
      throw new ForbiddenException(
        'Cannot add notes to private documents you do not own',
      );
    }

    return doc;
  }
  //Build where clause for search
  private buildWhereClause(
    userId: string,
    search?: SearchNoteDto,
    additionalWhere?: Prisma.NoteWhereInput,
  ): Prisma.NoteWhereInput {
    const where: Prisma.NoteWhereInput = {
      authorId: userId,
      ...(additionalWhere || {}),
    };
    if (search?.query) {
      where.OR = [
        { content: { contains: search.query, mode: 'insensitive' } },
        { doc: { title: { contains: search.query, mode: 'insensitive' } } },
      ];
    }
    if (search?.docId) {
      where.docId = search.docId;
    }
    return where;
  }

  //Build order by clause
  private buildOrderBy(
    search?: SearchNoteDto,
  ): Prisma.NoteOrderByWithRelationInput {
    const { sortBy = 'updatedAt', order = 'desc' } = search || {};

    return {
      [sortBy]: order,
    };
  }

  // Execute paginated query
  private async executeSearchQuery(
    where: Prisma.NoteWhereInput,
    searchDto?: SearchNoteDto,
  ) {
    const { limit = 20, offset = 0 } = searchDto || {};

    const [notes, total] = await Promise.all([
      this.prisma.note.findMany({
        where,
        include: this.gerNoteInclude(),
        orderBy: this.buildOrderBy(searchDto),
        take: limit,
        skip: offset,
      }),
      this.prisma.note.count({ where }),
    ]);

    return {
      data: notes,
      meta: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total,
      },
    };
  }
  // Check note ownership
  private async checkNoteOwnership(noteId: string, userId: string) {
    const note = await this.prisma.note.findUniqueOrThrow({
      where: { id: noteId },
      select: {
        id: true,
        authorId: true,
      },
    });

    if (note.authorId !== userId) {
      throw new ForbiddenException('You can only modify your own notes');
    }

    return note;
  }
}
