import { Test, TestingModule } from '@nestjs/testing';
import { CategoriesController } from './categories.controller';
import { CategoriesService } from './categories.service';

describe('CategoriesController', () => {
  let controller: CategoriesController;
  let service: CategoriesService;

  const mockCategoriesService = {
    create: jest.fn(),
    findUserCategories: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
    addDocument: jest.fn(),
    removeDocument: jest.fn(),
    findCategoryDocs: jest.fn(),
  };

  const mockUser = {
    sub: 'user-id',
    email: 'test@test.com',
    name: 'Test User',
    role: 'USER',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CategoriesController],
      providers: [
        {
          provide: CategoriesService,
          useValue: mockCategoriesService,
        },
      ],
    }).compile();

    controller = module.get<CategoriesController>(CategoriesController);
    service = module.get<CategoriesService>(CategoriesService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should call service.create', async () => {
      const dto = { name: 'College' };
      mockCategoriesService.create.mockResolvedValue({ id: 'cat-id', ...dto });

      const result = await controller.create(mockUser, dto);

      expect(service.create).toHaveBeenCalledWith(mockUser.sub, dto);
      expect(result).toEqual({ id: 'cat-id', ...dto });
    });
  });

  describe('findOne', () => {
    it('should call service.findOne', async () => {
      mockCategoriesService.findOne.mockResolvedValue({ id: 'cat-id' });

      const result = await controller.findOne('cat-id', mockUser);

      expect(service.findOne).toHaveBeenCalledWith('cat-id', mockUser.sub);
      expect(result).toEqual({ id: 'cat-id' });
    });
  });

  describe('addDocument', () => {
    it('should call service.addDocument', async () => {
      mockCategoriesService.addDocument.mockResolvedValue({ success: true });

      const result = await controller.addDocument('cat-id', 'doc-id', mockUser);

      expect(service.addDocument).toHaveBeenCalledWith('cat-id', 'doc-id', mockUser.sub);
      expect(result).toEqual({ success: true });
    });
  });

  describe('removeDocument', () => {
    it('should call service.removeDocument', async () => {
      mockCategoriesService.removeDocument.mockResolvedValue({ success: true });

      const result = await controller.removeDocument('cat-id', 'doc-id', mockUser);

      expect(service.removeDocument).toHaveBeenCalledWith('cat-id', 'doc-id', mockUser.sub);
      expect(result).toEqual({ success: true });
    });
  });
});
