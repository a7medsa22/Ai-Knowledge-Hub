import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Query } from '@nestjs/common';
import { TasksService } from './tasks.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { ApiBearerAuth, ApiResponse, ApiTags,ApiOperation, ApiQuery } from '@nestjs/swagger';
import { GetUser, JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { TaskResponseDto } from './dto/response-task.dto';
import type {JwtUser} from 'src/common/interfaces/jwt-user.interface';
import { SearchTasksDto } from './dto/search-task.dto';
import { TaskStatus } from '@prisma/client';

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


    @Get()
  @ApiOperation({ 
    summary: 'Get user tasks',
    description: 'Get all tasks created by the current user with search and filter options' 
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Tasks retrieved successfully' 
  })
  @ApiQuery({ name: 'query', required: false, description: 'Search in task title and description' })
  @ApiQuery({ name: 'status', required: false, description: 'Filter by status', enum: TaskStatus })
  @ApiQuery({ name: 'priority', required: false, description: 'Filter by priority' })
  @ApiQuery({ name: 'overdue', required: false, description: 'Filter overdue tasks' })
  @ApiQuery({ name: 'limit', required: false, description: 'Number of results' })
  @ApiQuery({ name: 'offset', required: false, description: 'Skip results' })
  @ApiQuery({ name: 'sortBy', required: false, description: 'Sort by field' })
  @ApiQuery({ name: 'order', required: false, description: 'Sort order', enum: ['asc', 'desc'] })
  findAll(@GetUser() user: JwtUser, @Query() searchDto: SearchTasksDto) {
    return this.tasksService.findAll(user.sub, searchDto);
  }

  @Get(':id')
  @ApiOperation({ 
    summary: 'Get task by ID',
    description: 'Get a specific task by its ID' 
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Task retrieved successfully',
    type: TaskResponseDto 
  })
  @ApiResponse({ 
    status: 404, 
    description: 'Task not found or access denied' 
  })
  findOne(@Param('id') id: string, @GetUser() user: JwtUser) {
    return this.tasksService.findOne(user.sub,id);
  }

   @Patch(':id')
  @ApiOperation({ 
    summary: 'Update task',
    description: 'Update a task (only by owner)' 
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Task updated successfully',
    type: TaskResponseDto 
  })
  @ApiResponse({ 
    status: 404, 
    description: 'Task not found' 
  })
  @ApiResponse({ 
    status: 403, 
    description: 'You can only update your own tasks' 
  })
  update(@Param('id') id: string, @GetUser() user: JwtUser, @Body() body: UpdateTaskDto) {
    return this.tasksService.update(user.sub,id,body);
  }

  @Patch(':id/status')
  @ApiOperation({ 
    summary: 'Update task status',
    description: 'Quick update for task status only' 
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Task status updated successfully' 
  })
  updateStatus(
    @Param('id') id: string,
    @GetUser() user: JwtUser,
    @Body() body: { status: TaskStatus },
  ) {
    return this.tasksService.updateStatus(user.sub,id,body.status);
  }

  @Delete(':id')
  @ApiOperation({ 
    summary: 'Delete task',
    description: 'Delete a task (only by owner)' 
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Task deleted successfully' 
  })
  @ApiResponse({ 
    status: 404, 
    description: 'Task not found' 
  })
  @ApiResponse({ 
    status: 403, 
    description: 'You can only delete your own tasks' 
  })
  remove(@Param('id') id: string, @GetUser() user: JwtUser) {
    return this.tasksService.deleteTask(user.sub,id);
  }






}
