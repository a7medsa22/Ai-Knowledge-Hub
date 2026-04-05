import { Controller, Get, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

@Controller('/')
@ApiTags('Health')
export class AppController {
  constructor() {}

  @Get('health')
  @HttpCode(HttpStatus.OK)
  getHealth() {
    return {
      message: 'healthy',
      data: {
        status: 'ok',
        uptimeSeconds: Math.floor(process.uptime()),
      },
    };
  }
}
