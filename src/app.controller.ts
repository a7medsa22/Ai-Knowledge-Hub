import { Controller, Get, HttpCode, HttpStatus } from '@nestjs/common';

@Controller('/')
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
