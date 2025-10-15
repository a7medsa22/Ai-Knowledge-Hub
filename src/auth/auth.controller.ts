import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AuthResponseDto, LoginDto, RegisterDto } from './dto/auth.dto';
import { AuthService } from './auth.service';
import { Throttle } from '@nestjs/throttler';

@ApiTags('Authentication')
@Controller('users/auth')
export class AuthController {
    constructor(private authService:AuthService) { }

    @Post('register')
  @Throttle({ auth: { limit: 3, ttl: 60000 } })
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ 
    summary: 'Register a new user', 
    description: 'Register a new user account. An email verification code will be sent to the provided email address.' 
  })
  @ApiResponse({ 
    status: 201, 
    description: 'User registered successfully, verification code sent to email',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: 'Registration successful. Please check your email for verification code.' },
        data: {
          type: 'object',
          properties: {
            userId: { type: 'string', example: 'uuid-string' }
          }
        }
      }
    }
  })
  @ApiResponse({ 
    status: 409, 
    description: 'User with this email already exists',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: false },
        message: { type: 'array', items: { type: 'string' }, example: ['Email already registered'] }
      }
    }
  })
  @ApiResponse({ status: 400, description: 'Validation error' })
  async register(@Body() body:RegisterDto):Promise<AuthResponseDto>{
   return this.authService.register(body);

  };

      // ===============================================

  @Post('login')
  @Throttle({ auth: { limit: 5, ttl: 60000 } }) 
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'User login (Step 1)',
    description: "Authenticate user credentials and create a session" 
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
            userId: { type: 'string', example: 'uuid-string' },
            accessToken: { type: 'string', example: 'jwt-string' }, 
          }
        }
      }
    }
  })
  @ApiResponse({ 
    status: 401, 
    description: 'Invalid credentials or account not approved',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: false },
        message: { type: 'array', items: { type: 'string' }, example: ['Invalid credentials'] }
      }
    }
  })
  async Login(@Body() body:LoginDto):Promise<AuthResponseDto>{
return this.authService.login(body);
  };
}
