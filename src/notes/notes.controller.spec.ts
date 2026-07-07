import { Test, TestingModule } from '@nestjs/testing';
import { NotesController } from './notes.controller';
import { NotesService } from './notes.service';

describe('NotesController', () => {
  let controller: NotesController;
  let service: NotesService;

  const mockNotesService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    findByDocument: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
    getNotesStats: jest.fn(),
  };

  const mockUser = {
    sub: 'user-id',
    email: 'test@test.com',
    name: 'Test User',
    role: 'USER',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [NotesController],
      providers: [
        {
          provide: NotesService,
          useValue: mockNotesService,
        },
      ],
    }).compile();

    controller = module.get<NotesController>(NotesController);
    service = module.get<NotesService>(NotesService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should call service.create', async () => {
      const dto = { content: 'test note', docId: 'doc-id' };
      mockNotesService.create.mockResolvedValue({ id: 'note-id', ...dto });

      const result = await controller.create(mockUser, dto);

      expect(service.create).toHaveBeenCalledWith(mockUser.sub, dto);
      expect(result).toEqual({ id: 'note-id', ...dto });
    });
  });

  describe('findOne', () => {
    it('should call service.findOne', async () => {
      mockNotesService.findOne.mockResolvedValue({ id: 'note-id' });

      const result = await controller.findOne('note-id', mockUser);

      expect(service.findOne).toHaveBeenCalledWith('note-id', mockUser.sub);
      expect(result).toEqual({ id: 'note-id' });
    });
  });

  describe('update', () => {
    it('should call service.update', async () => {
      const dto = { content: 'updated content' };
      mockNotesService.update.mockResolvedValue({ id: 'note-id', content: 'updated content' });

      const result = await controller.update('note-id', mockUser, dto);

      expect(service.update).toHaveBeenCalledWith('note-id', mockUser.sub, dto);
      expect(result).toEqual({ id: 'note-id', content: 'updated content' });
    });
  });

  describe('remove', () => {
    it('should call service.remove', async () => {
      mockNotesService.remove.mockResolvedValue({ id: 'note-id' });

      const result = await controller.remove('note-id', mockUser);

      expect(service.remove).toHaveBeenCalledWith('note-id', mockUser.sub);
      expect(result).toEqual({ id: 'note-id' });
    });
  });
});
