import { Test, TestingModule } from '@nestjs/testing';
import { DocsController } from './docs.controller';
import { DocsService } from './docs.service';
import { CreateDocDto } from './dto/create-doc.dto';
import { UpdateDocDto } from './dto/update-doc.dto';
import { SearchDocDto } from './dto/search-doc.dto';

describe('DocsController', () => {
  let controller: DocsController;
  let service: DocsService;

  const mockDocsService = {
    create: jest.fn(),
    findUserDocs: jest.fn(),
    getAllTags: jest.fn(),
    getDocStats: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  const mockUser = {
    sub: 'user-id',
    email: 'test@test.com',
    name: 'Test User',
    role: 'USER',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DocsController],
      providers: [
        {
          provide: DocsService,
          useValue: mockDocsService,
        },
      ],
    }).compile();

    controller = module.get<DocsController>(DocsController);
    service = module.get<DocsService>(DocsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should call service.create with correct parameters', async () => {
      const dto: CreateDocDto = { title: 'Test Doc', content: 'Some text' };
      const expectedResult = { document: { id: 'doc-id', ...dto } };
      mockDocsService.create.mockResolvedValue(expectedResult);

      const result = await controller.create(mockUser, dto);

      expect(service.create).toHaveBeenCalledWith(mockUser.sub, dto, undefined);
      expect(result).toEqual(expectedResult);
    });
  });

  describe('findUserDocs', () => {
    it('should call service.findUserDocs', async () => {
      const searchDto: SearchDocDto = { query: 'test' };
      mockDocsService.findUserDocs.mockResolvedValue({ data: [] });

      const result = await controller.findUserDocs(mockUser, searchDto);

      expect(service.findUserDocs).toHaveBeenCalledWith(searchDto, mockUser.sub);
      expect(result).toEqual({ data: [] });
    });
  });

  describe('findOne', () => {
    it('should call service.findOne', async () => {
      mockDocsService.findOne.mockResolvedValue({ id: 'doc-id' });

      const result = await controller.findOne('doc-id', mockUser);

      expect(service.findOne).toHaveBeenCalledWith('doc-id', mockUser.sub);
      expect(result).toEqual({ id: 'doc-id' });
    });
  });

  describe('update', () => {
    it('should call service.update', async () => {
      const dto: UpdateDocDto = { title: 'Updated' };
      mockDocsService.update.mockResolvedValue({ id: 'doc-id', title: 'Updated' });

      const result = await controller.update('doc-id', mockUser, dto);

      expect(service.update).toHaveBeenCalledWith('doc-id', mockUser.sub, dto);
      expect(result).toEqual({ id: 'doc-id', title: 'Updated' });
    });
  });

  describe('remove', () => {
    it('should call service.remove', async () => {
      mockDocsService.remove.mockResolvedValue({ id: 'doc-id' });

      const result = await controller.remove('doc-id', mockUser);

      expect(service.remove).toHaveBeenCalledWith('doc-id', mockUser.sub);
      expect(result).toEqual({ id: 'doc-id' });
    });
  });
});
