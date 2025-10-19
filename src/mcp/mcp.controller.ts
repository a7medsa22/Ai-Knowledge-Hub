import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { McpService } from './mcp.service';
import { CreateMcpDto } from './dto/create-mcp.dto';
import { UpdateMcpDto } from './dto/update-mcp.dto';

@Controller('mcp')
export class McpController {
  constructor(private readonly mcpService: McpService) {}

  @Post()
  create(@Body() createMcpDto: CreateMcpDto) {
    return this.mcpService.create(createMcpDto);
  }

  @Get()
  findAll() {
    return this.mcpService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.mcpService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateMcpDto: UpdateMcpDto) {
    return this.mcpService.update(+id, updateMcpDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.mcpService.remove(+id);
  }
}
