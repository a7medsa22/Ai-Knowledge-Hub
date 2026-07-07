import { Test, TestingModule } from '@nestjs/testing';
import { FilesController } from './files.controller';
import { FilesService } from './files.service';
import { DocsService } from 'src/docs/docs.service';

describe('FilesController', () => {
  let controller: FilesController;
  let service: FilesService;

  const mockFilesService = {
    uploadFile: jest.fn(),
    findUserFiles: jest.fn(),
    findOne: jest.fn(),
    deleteFile: jest.fn(),
  };

  const mockDocsService = {
    findOne: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [FilesController],
      providers: [
        {
          provide: FilesService,
          useValue: mockFilesService,
        },
        {
          provide: DocsService,
          useValue: mockDocsService,
        },
      ],
    }).compile();

    controller = module.get<FilesController>(FilesController);
    service = module.get<FilesService>(FilesService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
