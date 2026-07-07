import { Test, TestingModule } from '@nestjs/testing';
import { DocsService } from './docs.service';
import { PrismaService } from '../prisma/prisma.service';
import { FilesService } from '../files/files.service';
import { getQueueToken } from '@nestjs/bullmq';
import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { UserRole } from '@prisma/client';

describe('DocsService', () => {
  let service: DocsService;
  let prisma: PrismaService;
  let filesService: FilesService;
  let queue: any;

  const mockPrismaService = {
    doc: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      findUniqueOrThrow: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    file: {
      update: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  const mockFilesService = {
    canExtractText: jest.fn(),
    uploadFile: jest.fn(),
    getFilePath: jest.fn(),
    extractTextFromFile: jest.fn(),
    deleteFileFromDisk: jest.fn(),
  };

  const mockQueue = {
    add: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DocsService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: FilesService, useValue: mockFilesService },
        { provide: getQueueToken('embedding'), useValue: mockQueue },
      ],
    }).compile();

    service = module.get<DocsService>(DocsService);
    prisma = module.get<PrismaService>(PrismaService);
    filesService = module.get<FilesService>(FilesService);
    queue = module.get(getQueueToken('embedding'));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a document successfully with text content', async () => {
      const mockDoc = { id: 'doc-id', title: 'ML Intro', content: 'Machine learning is...' };
      mockPrismaService.doc.create.mockResolvedValue(mockDoc);

      const result = await service.create('author-id', {
        title: 'ML Intro',
        content: 'Machine learning is...',
      });

      expect(result.document).toEqual(mockDoc);
      expect(prisma.doc.create).toHaveBeenCalled();
      expect(queue.add).toHaveBeenCalledWith('generate', { docId: 'doc-id' });
    });

    it('should throw BadRequestException if no content or file is provided', async () => {
      await expect(
        service.create('author-id', { title: 'No Content' }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('findOne', () => {
    it('should return document if user is the author', async () => {
      const mockDoc = { id: 'doc-id', authorId: 'user-id', isPublic: false };
      mockPrismaService.doc.findUniqueOrThrow.mockResolvedValue(mockDoc);

      const result = await service.findOne('doc-id', 'user-id');
      expect(result).toEqual(mockDoc);
    });

    it('should throw ForbiddenException if private document is accessed by another user', async () => {
      const mockDoc = { id: 'doc-id', authorId: 'other-user-id', isPublic: false };
      mockPrismaService.doc.findUniqueOrThrow.mockResolvedValue(mockDoc);

      await expect(service.findOne('doc-id', 'user-id')).rejects.toThrow(ForbiddenException);
    });

    it('should return public document to anyone', async () => {
      const mockDoc = { id: 'doc-id', authorId: 'other-user-id', isPublic: true };
      mockPrismaService.doc.findUniqueOrThrow.mockResolvedValue(mockDoc);

      const result = await service.findOne('doc-id', 'user-id');
      expect(result).toEqual(mockDoc);
    });
  });

  describe('update', () => {
    it('should update document if user is the author', async () => {
      const mockDoc = { id: 'doc-id', authorId: 'user-id' };
      mockPrismaService.doc.findUniqueOrThrow.mockResolvedValue(mockDoc);
      mockPrismaService.doc.update.mockResolvedValue({ ...mockDoc, title: 'New Title' });

      const result = await service.update('doc-id', 'user-id', { title: 'New Title' });
      expect(result.title).toBe('New Title');
    });

    it('should throw ForbiddenException if user is not the author', async () => {
      const mockDoc = { id: 'doc-id', authorId: 'other-user-id' };
      mockPrismaService.doc.findUniqueOrThrow.mockResolvedValue(mockDoc);

      await expect(
        service.update('doc-id', 'user-id', { title: 'New Title' }),
      ).rejects.toThrow(ForbiddenException);
    });
  });
});
