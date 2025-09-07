import { Body, Controller, Post } from '@nestjs/common';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AuthResponseDto, LoginDto, RegisterDto } from './dto/auth.dto';
import { AuthService } from './auth.service';

@Controller('users/auth')
export class AuthController {
    constructor(private authService:AuthService) { }

    @Post('register')
    @ApiOperation({ summary: 'Register a new user' })
    @ApiResponse({ 
    status: 201, 
    description: 'User successfully registered',
    type: AuthResponseDto 
  })
  @ApiResponse({ 
    status: 409, 
    description: 'User with this email already exists' 
  })
async register(@Body() body:RegisterDto):Promise<AuthResponseDto>{
return this.authService.register(body);
  };
  @Post('login')
  @ApiOperation({ summary: 'Login user' })
  @ApiResponse({ 
    status: 200, 
    description: 'User successfully logged in',
    type: AuthResponseDto 
  })
  @ApiResponse({ 
    status: 401, 
    description: 'Invalid credentials' 
  })
  async Login(@Body() body:LoginDto):Promise<AuthResponseDto>{
return this.authService.login(body);
  };
}
