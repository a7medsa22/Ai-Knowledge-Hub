import { Test, TestingModule } from '@nestjs/testing';
import { CategoriesService } from './categories.service';
import { PrismaService } from '../prisma/prisma.service';
import { ForbiddenException, NotFoundException, BadRequestException } from '@nestjs/common';

describe('CategoriesService', () => {
  let service: CategoriesService;
  let prisma: PrismaService;

  const mockPrismaService = {
    category: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    doc: {
      findUnique: jest.fn(),
    },
    categoryDoc: {
      create: jest.fn(),
      delete: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CategoriesService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<CategoriesService>(CategoriesService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a category successfully', async () => {
      const mockCategory = { id: 'cat-id', name: 'College', authorId: 'user-id' };
      mockPrismaService.category.create.mockResolvedValue(mockCategory);

      const result = await service.create('user-id', {
        name: 'College',
      });

      expect(result).toEqual(mockCategory);
      expect(prisma.category.create).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('should return category if owned by user', async () => {
      const mockCategory = { id: 'cat-id', name: 'College', authorId: 'user-id', isPublic: false };
      mockPrismaService.category.findUnique.mockResolvedValue(mockCategory);

      const result = await service.findOne('cat-id', 'user-id');
      expect(result).toEqual(mockCategory);
    });

    it('should throw ForbiddenException if private category accessed by another user', async () => {
      const mockCategory = { id: 'cat-id', name: 'College', authorId: 'other-user-id', isPublic: false };
      mockPrismaService.category.findUnique.mockResolvedValue(mockCategory);

      await expect(service.findOne('cat-id', 'user-id')).rejects.toThrow(ForbiddenException);
    });

    it('should return public category to anyone', async () => {
      const mockCategory = { id: 'cat-id', name: 'College', authorId: 'other-user-id', isPublic: true };
      mockPrismaService.category.findUnique.mockResolvedValue(mockCategory);

      const result = await service.findOne('cat-id', 'user-id');
      expect(result).toEqual(mockCategory);
    });
  });

  describe('addDocument', () => {
    it('should link document to category if user owns the category and has access to document', async () => {
      const mockCategory = { id: 'cat-id', authorId: 'user-id' };
      const mockDoc = { id: 'doc-id', authorId: 'user-id', isPublic: false };
      
      mockPrismaService.category.findUnique.mockResolvedValue(mockCategory);
      mockPrismaService.doc.findUnique.mockResolvedValue(mockDoc);
      mockPrismaService.categoryDoc.findUnique.mockResolvedValue(null);
      mockPrismaService.categoryDoc.create.mockResolvedValue({ categoryId: 'cat-id', docId: 'doc-id' });

      const result = await service.addDocument('cat-id', 'doc-id', 'user-id');

      expect(result).toBeDefined();
      expect(prisma.categoryDoc.create).toHaveBeenCalled();
    });

    it('should throw ForbiddenException if user does not own category', async () => {
      const mockCategory = { id: 'cat-id', authorId: 'other-user-id' };
      mockPrismaService.category.findUnique.mockResolvedValue(mockCategory);

      await expect(
        service.addDocument('cat-id', 'doc-id', 'user-id'),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw ForbiddenException if user has no access to the document', async () => {
      const mockCategory = { id: 'cat-id', authorId: 'user-id' };
      const mockDoc = { id: 'doc-id', authorId: 'other-user-id', isPublic: false };

      mockPrismaService.category.findUnique.mockResolvedValue(mockCategory);
      mockPrismaService.doc.findUnique.mockResolvedValue(mockDoc);

      await expect(
        service.addDocument('cat-id', 'doc-id', 'user-id'),
      ).rejects.toThrow(ForbiddenException);
    });
  });
});
