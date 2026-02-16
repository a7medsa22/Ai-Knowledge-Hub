import {
  IsEmail,
  IsString,
  MinLength,
  IsOptional,
  IsEnum,
  MaxLength,
  Matches,
  IsNotEmpty,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { UserRole } from 'src/common/enums/user-role.enum';
import { UserStatus } from 'src/common/enums/user-status.enum';

// simple dto for register and login
// class RegisterDto

export class RegisterDto {
  @ApiProperty({ example: 'ahmed12@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'Password123!', minLength: 8 })
  @IsString()
  @IsNotEmpty({ message: 'Password is required' })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, {
    message:
      'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character',
  })
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  password: string;

  @ApiProperty({ example: 'Ahmed Salah', required: false })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiProperty({ enum: UserRole, default: UserRole.USER })
  @IsEnum(UserRole)
  @IsOptional()
  role?: UserRole;

  @ApiProperty({ enum: UserStatus, default: UserStatus.PENDING_EMAIL_VERIFICATION })
  @IsEnum(UserStatus)
  @IsOptional()
  status?: UserStatus;
}

// class LoginDto
export class LoginDto {
  @ApiProperty({ example: 'john@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'Password123!' })
  @IsString()
  password: string;
}
export class ForgotPasswordDto {
  @ApiProperty({ example: 'john.doe@example.com' })
  @IsEmail({}, { message: 'Please provide a valid email address' })
  email: string;
}
export class ResetPasswordDto {
  @ApiProperty({ example: 'NewSecurePass456!', minLength: 8 })
  @IsString()
  @MinLength(8, { message: 'New password must be at least 8 characters long' })
  @MaxLength(128, { message: 'New password must not exceed 128 characters' })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, {
    message:
      'New password must contain at least one uppercase letter, one lowercase letter, one number, and one special character',
  })
  newPassword: string;

  @ApiProperty({ example: 'john.doe@example.com' })
  @IsEmail({}, { message: 'Please provide a valid email address' })
  email: string;

  @ApiProperty({ example: '123456' })
  @IsString({ message: 'OTP must be a string' })
  @MinLength(6, { message: 'OTP must be at least 6 characters long' })
  otp: string;
}
export class VerifyEmailDto {
  @IsEmail({}, { message: 'Please provide a valid email address' })
  email: string;

  @IsString({ message: 'OTP must be a string' })
  @MinLength(6, { message: 'OTP must be at least 6 characters long' })
  otp: string;
}
export class DeviceInfoDto {
  @IsOptional()
  @IsString()
  userAgent?: string;
  @IsOptional()
  @IsString()
  deviceName?: string;
  @IsOptional()
  @IsString()
  ipAddress?: string;
}
/**
 * {
  sub: userId,
  email: email,
  type: 'password_reset',
  jti: uuid(), // لضمان عدم إعادة الاستخدام
}
  const resetToken = this.jwtService.sign(payload, { 
  secret: process.env.PASSWORD_RESET_SECRET,
  expiresIn: '5m' 
});
return {
  success: true,
  message: 'OTP verified. Use the resetToken to set a new password.',
   { resetToken }
};
 */