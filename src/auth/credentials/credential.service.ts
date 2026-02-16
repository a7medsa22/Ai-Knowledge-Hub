import { ConflictException, Injectable } from '@nestjs/common';
import { UsersService } from 'src/users/users.service';
import { CreateUserDto } from 'src/users/dto/user.dto';
import * as bcrypt from 'bcryptjs';
import { UserStatus } from 'src/common/enums/user-status.enum';
import { RegisterDto, ResetPasswordDto } from '../dto/auth.dto';
import { UserEntity } from 'src/users/entities/user.entity';
import { UserMapper } from 'src/common/infrastructure/mappers/user.mapper';
import { UserRole } from 'src/common/enums/user-role.enum';
@Injectable()
export class CredentialService {
  constructor(private readonly userService: UsersService) {}

  async createUser(data: RegisterDto) {
    const existingUser = await this.userService.findByEmail(data.email);
    if (existingUser) {
      throw new ConflictException('');
    }
    const salt = await bcrypt.genSalt(12);
    const haspassword = await bcrypt.hash(data.password, salt);

    const newUser = await this.userService.create({
      name: data.name || 'User',
      email: data.email,
      password: haspassword,
      role: data.role || UserRole.USER,
      status: UserStatus.PENDING_EMAIL_VERIFICATION,
    });
    return newUser;
  }

  async updatePassword(userId: string, newPassword: string) {
    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(newPassword, salt);
    await this.userService.update(userId, {
      password: hashedPassword,
    });
  }

  async validateUser(email: string, password: string): Promise<any> {
    const user = await this.userService.findByEmailValidat(email);
    if(user.status !== UserStatus.ACTIVE){
      throw new ConflictException('User not active');
    }
    if (user && (await bcrypt.compare(password, user.password))) {
      return user;
    }
    return null;
  }

}
