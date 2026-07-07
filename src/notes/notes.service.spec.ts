import { Test, TestingModule } from '@nestjs/testing';
import { NotesService } from './notes.service';
import { PrismaService } from '../prisma/prisma.service';
import { ForbiddenException, NotFoundException } from '@nestjs/common';

describe('NotesService', () => {
  let service: NotesService;
  let prisma: PrismaService;

  const mockPrismaService = {
    note: {
      create: jest.fn(),
      findMany: jest.fn(),
      findFirstOrThrow: jest.fn(),
      findUniqueOrThrow: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    doc: {
      findUniqueOrThrow: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotesService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<NotesService>(NotesService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a note for a public document successfully', async () => {
      const mockDoc = { id: 'doc-id', authorId: 'other-user-id', isPublic: true };
      const mockNote = { id: 'note-id', content: 'test note', docId: 'doc-id', authorId: 'user-id' };
      mockPrismaService.doc.findUniqueOrThrow.mockResolvedValue(mockDoc);
      mockPrismaService.note.create.mockResolvedValue(mockNote);

      const result = await service.create('user-id', {
        content: 'test note',
        docId: 'doc-id',
      });

      expect(result).toEqual(mockNote);
      expect(prisma.note.create).toHaveBeenCalled();
    });

    it('should throw ForbiddenException if user tries to note on private document they do not own', async () => {
      const mockDoc = { id: 'doc-id', authorId: 'other-user-id', isPublic: false };
      mockPrismaService.doc.findUniqueOrThrow.mockResolvedValue(mockDoc);

      await expect(
        service.create('user-id', { content: 'test note', docId: 'doc-id' }),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('findOne', () => {
    it('should return note if owned by user', async () => {
      const mockNote = { id: 'note-id', content: 'test note', authorId: 'user-id' };
      mockPrismaService.note.findFirstOrThrow.mockResolvedValue(mockNote);

      const result = await service.findOne('note-id', 'user-id');
      expect(result).toEqual(mockNote);
    });
  });

  describe('update', () => {
    it('should update note if owned by user', async () => {
      const mockNote = { id: 'note-id', content: 'test note', authorId: 'user-id' };
      mockPrismaService.note.findUniqueOrThrow.mockResolvedValue(mockNote);
      mockPrismaService.note.update.mockResolvedValue({ ...mockNote, content: 'updated note' });

      const result = await service.update('note-id', 'user-id', { content: 'updated note' });
      expect(result.content).toBe('updated note');
    });

    it('should throw ForbiddenException if note not owned by user', async () => {
      const mockNote = { id: 'note-id', content: 'test note', authorId: 'other-user-id' };
      mockPrismaService.note.findUniqueOrThrow.mockResolvedValue(mockNote);

      await expect(
        service.update('note-id', 'user-id', { content: 'updated note' }),
      ).rejects.toThrow(ForbiddenException);
    });
  });
});
