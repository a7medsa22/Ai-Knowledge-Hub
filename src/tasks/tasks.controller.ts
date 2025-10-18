import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Query } from '@nestjs/common';
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

   @Get('stats')
  @ApiOperation({ 
    summary: 'Get tasks statistics',
    description: 'Get statistics about current user tasks' 
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Tasks statistics retrieved successfully' 
  })
  getStats(@GetUser() user: JwtUser) {
    return this.tasksService.getTasksStats(user.sub);
  }

  @Get('upcoming')
  @ApiOperation({ 
    summary: 'Get upcoming tasks',
    description: 'Get upcoming tasks for the current user' 
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Upcoming tasks retrieved successfully' 
  })
  getUpcomingTasks(@GetUser() user: JwtUser, @Query('days') days: number = 7) {
    return this.tasksService.getUpcomingTasks(user.sub, days);
  }
  
  @Get('overdue')
  @ApiOperation({ 
    summary: 'Get overdue tasks',
    description: 'Get all overdue tasks that are not completed' 
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Overdue tasks retrieved successfully' 
  })
  getOverdueTasks(@GetUser() user: JwtUser) {
    return this.tasksService.getOverdueTasks(user.sub);
  }






}
