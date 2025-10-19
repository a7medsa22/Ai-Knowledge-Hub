import { Module } from '@nestjs/common';
import { McpService } from './mcp.service';
import { McpController } from './mcp.controller';

@Module({
  controllers: [McpController],
  providers: [McpService],
})
export class McpModule {}
