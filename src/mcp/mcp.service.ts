import { Injectable } from '@nestjs/common';

@Injectable()
export class McpService {
  
  async executeTool(toolName: string, parameters: any) {
    return `This action returns all mcp`;
  }

  findOne(id: number) {
    return `This action returns a #${id} mcp`;
  }

  update(id: number) {
    return `This action updates a #${id} mcp`;
  }

  remove(id: number) {
    return `This action removes a #${id} mcp`;
  }
}
