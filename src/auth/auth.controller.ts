import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { ForgotPasswordDto, LoginDto, RegisterDto, ResetPasswordDto } from './dto/auth.dto';
import { AuthService } from './auth.service';
import { Throttle } from '@nestjs/throttler';
import { AuthGuard } from '@nestjs/passport';
import { AuthResponse } from './interfaces/auth-response.interface';
import { CurrentUser } from './decorators/current-user.decorator';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RefreshTokenGuard } from './guards/refresh-token.guard';

@ApiTags('Authentication')
@Controller('users/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // ===============================================
  @Post('register')
  @Throttle({ auth: { limit: 3, ttl: 300000 } }) // 3 requests per 5 minutes
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Register a new user',
    description:
      'Register a new user account. An email verification code will be sent to the provided email address.',
  })
  @ApiResponse({
    status: 201,
    description:
      'User registered successfully, verification code sent to email',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: {
          type: 'string',
          example: 'User registered successfully, please verify your email',
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
    description: '',
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
  @Throttle({ auth: { limit: 3, ttl: 900000 } }) // 3 requests per 15 minutes
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
            accessToken: {
              type: 'string',
              example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
            },
            refreshToken: {
              type: 'string',
              example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
            },
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
  async login(@Body() _body:LoginDto,@Req() req) {
    const result: AuthResponse = await this.authService.login(req.user, req);
    return {
      success: true,
      message: 'Login successful',
      data: result,
    };
  }
  // ===============================================
  @Post('forgot-password')
  @Throttle({ auth: { limit: 3, ttl: 300000 } }) // 3 attempts per 5 minutes
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Request password reset',
    description: 'Send password reset OTP to user email if account exists',
  })
  @ApiResponse({
    status: 200,
    description: 'Reset code sent to email if account exists',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: {
          type: 'string',
          example: 'Password reset code sent to your email.',
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
  async forgotPassword(@Body() body: ForgotPasswordDto) {
    await this.authService.forgotPassword(body);
    return {
      success: true,
      message: 'Password reset code sent to your email.',
      data: { userId: body.email },
    };
  }

  // ===============================================
  @Post('verify-email')
  @Throttle({ auth: { limit: 3, ttl: 300000 } }) // 3 requests per 5 minutes
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Verify email with OTP',
    description: 'Verify the user email using the OTP sent to email.',
  })
  @ApiResponse({
    status: 200,
    description: 'Email verified successfully, please login',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: 'Email verified successfully, please login' },
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
        message: {
          type: 'array',
          items: { type: 'string' },
          example: ['Invalid OTP'],
        },
      },
    },
  })
  async verifyEmail(@Body() body: { email: string; otp: string }) {
    await this.authService.verifyEmail(body.email, body.otp);
    return {
      success: true,
      message: 'Email verified successfully, please login',
    };
  }

  @Post('reset-password')
  @Throttle({ auth: { limit: 3, ttl: 900000 } }) // 3 requests per 15 minutes
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Reset password',
    description: 'Reset the user password using the OTP sent to email.',
  })
  @ApiResponse({
    status: 200,
    description: 'Password reset successfully, please login',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: 'Password reset successfully, please login' },
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
        message: {
          type: 'array',
          items: { type: 'string' },
          example: ['Invalid OTP'],
        },
      },
    },
  })
  async resetPassword(@Body() body: ResetPasswordDto) {
    const result = await this.authService.resetPassword(body);
    return {
      success: result.success,
      message: result.message,
    };
  }
  
  // ===============================================
  // TOKEN MANAGEMENT
  // ===============================================

  @Post('refresh')
  @UseGuards(RefreshTokenGuard)
  @Throttle({ auth: { limit: 10, ttl: 60000 } }) // 10 refresh attempts per minute
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Refresh access token',
    description: 'Get new access token using valid refresh token',
  })
  @ApiResponse({
    status: 200,
    description: 'Token refreshed successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        data: {
          type: 'object',
          properties: {
            accessToken: {
              type: 'string',
              example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
            },
            refreshToken: {
              type: 'string',
              example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
            },
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Invalid refresh token',
  })
  async refreshToken(@Req() req) {
    const { userId, tokenId } = req.user;
    return this.authService.refreshTokens(userId, tokenId);
  }

  // ===============================================
  // Sessions MANAGEMENT
  // ===============================================

  @Get('sessions')
  @UseGuards(JwtAuthGuard)
  @Throttle({ auth: { limit: 3, ttl: 60000 } }) // 3 requests per minute
  @ApiOperation({
    summary: 'Get active sessions',
    description: 'Retrieve a list of active sessions for the current user',
  })
  @ApiBearerAuth('JWT-auth')
  @ApiResponse({
    status: 200,
    description: 'Sessions retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        data: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string', example: '12345' },
              createdAt: {
                type: 'string',
                format: 'date-time',
                example: '2023-01-01T00:00:00Z',
              },
              lastActiveAt: {
                type: 'string',
                format: 'date-time',
                example: '2023-01-01T12:00:00Z',
              },
            },
          },
        },
      },
    },
  })
  async sessions(@CurrentUser('sub') userId: string) {
    return this.authService.getUserSessions(userId);
  }

  @Delete('sessions/:tokenId')
  @UseGuards(JwtAuthGuard)
  @Throttle({ auth: { limit: 3, ttl: 300000 } }) // 3 requests per 5 minutes
  @ApiOperation({
    summary: 'Revoke a session',
    description:
      'Revoke a specific session by its token ID for the current user',
  })
  @ApiBearerAuth('JWT-auth')
  @ApiResponse({
    status: 200,
    description: 'Session revoked successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
      },
    },
  })
  async revokeSession(
    @Param('tokenId') tokenId: string,
    @CurrentUser('sub') userId: string,
  ) {
    return this.authService.revokeSession(userId, tokenId);
  }

  @Delete('sessions')
  @UseGuards(JwtAuthGuard)
  @Throttle({ auth: { limit: 3, ttl: 300000 } }) // 3 requests per 5 minutes
  @ApiOperation({
    summary: 'Revoke all sessions',
    description: 'Revoke all active sessions for the current user',
  })
  @ApiBearerAuth('JWT-auth')
  @ApiResponse({
    status: 200,
    description: 'All sessions revoked successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: 'All sessions revoked' },
      },
    },
  })
  async revokeAllSessions(@CurrentUser('sub') userId: string) {
    await this.authService.revokeAllSessions(userId);
    return { success: true, message: 'All sessions revoked' };
  }
}
