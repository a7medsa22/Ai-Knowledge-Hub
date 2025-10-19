import { Test, TestingModule } from '@nestjs/testing';
import { McpController } from './mcp.controller';
import { McpService } from './mcp.service';

describe('McpController', () => {
  let controller: McpController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [McpController],
      providers: [McpService],
    }).compile();

    controller = module.get<McpController>(McpController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
