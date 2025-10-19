import { PartialType } from '@nestjs/swagger';
import { CreateMcpDto } from './create-mcp.dto';

export class UpdateMcpDto extends PartialType(CreateMcpDto) {}
