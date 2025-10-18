import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { TasksService } from './tasks.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { ApiBearerAuth, ApiResponse, ApiTags,ApiOperation } from '@nestjs/swagger';
import { GetUser, JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { TaskResponseDto } from './dto/response-task.dto';
import type {JwtUser} from 'src/common/interfaces/jwt-user.interface';

@ApiTags('Tasks')
@Controller('tasks')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Post()
  @ApiOperation({ 
    summary: 'Create a new task',
    description: 'Create a new task for the current user' 
  })
  @ApiResponse({ 
    status: 201, 
    description: 'Task created successfully',
    type: TaskResponseDto 
  })
  @ApiResponse({ 
    status: 401, 
    description: 'Unauthorized' 
  })
  create(@GetUser() user: JwtUser, @Body() body: CreateTaskDto) {
    return this.tasksService.create(user.sub, body);
  }



}
