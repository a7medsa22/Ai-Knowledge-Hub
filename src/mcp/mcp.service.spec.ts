import { Test, TestingModule } from '@nestjs/testing';
import { McpService } from './mcp.service';

describe('McpService', () => {
  let service: McpService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [McpService],
    }).compile();

    service = module.get<McpService>(McpService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
