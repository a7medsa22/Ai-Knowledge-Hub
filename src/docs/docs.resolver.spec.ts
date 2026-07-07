import { Test, TestingModule } from '@nestjs/testing';
import { DocsResolver } from './docs.resolver';
import { DocsService } from './docs.service';

describe('DocsResolver', () => {
  let resolver: DocsResolver;
  let service: DocsService;

  const mockDocsService = {
    findOne: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DocsResolver,
        {
          provide: DocsService,
          useValue: mockDocsService,
        },
      ],
    }).compile();

    resolver = module.get<DocsResolver>(DocsResolver);
    service = module.get<DocsService>(DocsService);
  });

  it('should be defined', () => {
    expect(resolver).toBeDefined();
  });
});
