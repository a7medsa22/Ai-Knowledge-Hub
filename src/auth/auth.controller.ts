import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AuthResponseDto, LoginDto, RegisterDto } from './dto/auth.dto';
import { AuthService } from './auth.service';
import { Throttle } from '@nestjs/throttler';

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
  @Post('login')
  @ApiOperation({ summary: 'Login user' , description: 'Authenticate user with email and password' 
})
  @ApiResponse({ 
    status: 200, 
    description: 'User successfully logged in',
    type: AuthResponseDto, 
    example:{
      access_token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
      user: {
        id: 'clx1234567890',
        email: 'john@example.com',
        name: 'John Doe',
        role: 'USER'
      }
    }
  })
  @ApiResponse({ 
    status: 401, 
    description: 'Invalid credentials' 
  })
  @ApiResponse({
    status:400,
    description:'Invalid input data'
  })
  
  async Login(@Body() body:LoginDto):Promise<AuthResponseDto>{
return this.authService.login(body);
  };
}
