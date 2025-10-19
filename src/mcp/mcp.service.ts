import { Injectable } from '@nestjs/common';
import { CreateMcpDto } from './dto/create-mcp.dto';
import { UpdateMcpDto } from './dto/update-mcp.dto';

@Injectable()
export class McpService {
  create(createMcpDto: CreateMcpDto) {
    return 'This action adds a new mcp';
  }

  findAll() {
    return `This action returns all mcp`;
  }

  findOne(id: number) {
    return `This action returns a #${id} mcp`;
  }

  update(id: number, updateMcpDto: UpdateMcpDto) {
    return `This action updates a #${id} mcp`;
  }

  remove(id: number) {
    return `This action removes a #${id} mcp`;
  }
}
