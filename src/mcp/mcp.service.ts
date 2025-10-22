import { Injectable } from '@nestjs/common';
import { ExecuteToolDto } from './dto/mcp.dto';

@Injectable()
export class McpService {
  tools: any[] = [];
  
  async executeTool(dto: ExecuteToolDto) {
    const toolName = dto.toolName;
    const parameters = dto.parameters;
    
    const tool = this.tools.find((tool) => tool.name === toolName);
    if (!tool) {
      throw new Error(`Tool ${toolName} not found`);
    }
    
    const result = await tool.execute(parameters);
    return result;    
  }

  findOne(id: number) {
    return `This action returns a #${id} mcp`;
  }

  update(id: number) {
    return `This action updates a #${id} mcp`;
  }

  remove(id: number) {
    return `This action removes #${id} mcp`;
  }
}
