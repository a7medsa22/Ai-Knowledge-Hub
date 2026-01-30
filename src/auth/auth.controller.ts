import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { RegisterDto } from './dto/auth.dto';
import { AuthService } from './auth.service';
import { Throttle } from '@nestjs/throttler';
import { AuthGuard } from '@nestjs/passport';
import { AuthResponse } from './interfaces/auth-response.interface';

@ApiTags('Authentication')
@Controller('users/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // ===============================================
  @Post('register')
  @Throttle({ auth: { limit: 5, ttl: 60000 } }) // 3 requests per minute
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Register a new user',
    description:
      'Register a new user account. An email verification code will be sent to the provided email address.',
  })
  @ApiResponse({
    status: 201,
    description: 'User registered successfully, verification code sent to email',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: {
          type: 'string',
          example:
            'User registered successfully, please verify your email',
        },
        data: {
          type: 'object',
          properties: {
            userId: { type: 'string', example: 'uuid-string' },
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 409,
    description: 'User with this email already exists',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: false },
        message: {
          type: 'array',
          items: { type: 'string' },
          example: ['Email already registered'],
        },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Validation error' })
  async register(@Body() body: RegisterDto) {
    const result = await this.authService.register(body);
    return {
      success: true,
      message: 'User registered successfully, please verify your email',
      data: { userId: result.userId },
    };
  }

  // ===============================================
  @Post('login')
  @Throttle({ auth: { limit: 5, ttl: 60000 } }) // 3 requests per minute
  @UseGuards(AuthGuard('local'))
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'User login',
    description: 'Authenticate user credentials and create a session',
  })
  @ApiResponse({
    status: 200,
    description: 'Credentials verified, session created',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: 'Login successful' },
        data: {
          type: 'object',
          properties: {
            user: {
              type: 'object',
              properties: {
                sub: { type: 'string', example: 'uuid-string' },
                email: { type: 'string', example: 'test@example.com' },
                name: { type: 'string', example: 'John Doe' },
                role: { type: 'string', example: 'USER' },
                status: { type: 'string', example: 'ACTIVE' },
              },
            },
            accessToken: { type: 'string', example: 'jwt-string' },
            refreshToken: { type: 'string', example: 'jwt-refresh-string' },
            expiresIn: { type: 'number', example: 900 },
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Invalid credentials or account not approved',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: false },
        message: {
          type: 'array',
          items: { type: 'string' },
          example: ['Invalid credentials'],
        },
      },
    },
  })
  async login(@Req() req): Promise<any> {
    const result: AuthResponse = await this.authService.login(req.user);
    return {
      success: true,
      message: 'Login successful',
      data: result,
    };
  }

  // ===============================================
  @Post('verify-email')
  @Throttle({ auth: { limit: 5, ttl: 60000 } }) // 3 requests per minute
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Verify email with OTP',
    description: 'Verify the user email using the OTP sent to email.',
  })
  @ApiResponse({
    status: 200,
    description: 'Email verified successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: 'Email verified successfully' },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid or expired OTP',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: false },
        message: { type: 'array', items: { type: 'string' }, example: ['Invalid OTP'] },
      },
    },
  })
  async verifyEmail(@Body() body: { email: string; otp: string }) {
    await this.authService.verifyEmail(body.email, body.otp);
    return {
      success: true,
      message: 'Email verified successfully',
    };
  }
}
