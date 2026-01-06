import { IsEmail, IsString, MinLength, IsOptional, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { UserRole } from 'src/common/enums/user-role.enum';
import { UserStatus } from 'src/common/enums/user-status.enum';

// simple dto for register and login
// class RegisterDto

export class RegisterDto { 
  @ApiProperty({ example: 'ahmed12@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'password123', minLength: 6 })
  @IsString()
  @MinLength(6)
  password: string;

  @ApiProperty({ example: 'Ahmed Salah', required: false })
  @IsString()
  @IsOptional()
  name?: string;

   @ApiProperty({ enum: UserRole, default: UserRole.USER })
    @IsOptional()
    role?: UserRole;
   
  @ApiProperty({ enum: UserStatus })
  status: UserStatus;
}


// class LoginDto
export class LoginDto {
  @ApiProperty({ example: 'john@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'password123' })
  @IsString()
  password: string;
}


