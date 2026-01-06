import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { RegisterDto } from './dto/auth.dto';
import { UsersService } from 'src/users/users.service';
import * as bcrypt from 'node_modules/bcryptjs';
import { ConfigService } from '@nestjs/config';
import { JwtPayload } from './interfaces/jwt-payload';
import { PrismaService } from 'src/prisma/prisma.service';
import { AuthResponse } from './interfaces/auth-response.interface';
import { AccountStatusService } from './account-status/account-status.service';
import { UserEntity } from 'src/users/entities/user.entity';
import { UserStatus } from 'src/common/enums/user-status.enum';

@Injectable()
export class AuthService {
    constructor(
      private readonly jwtService:JwtService,
      private readonly prisma:PrismaService,
      private readonly userService:UsersService,
      private readonly configService:ConfigService,
      private readonly accountStatusService:AccountStatusService,

    ){}

    public async register(dto:RegisterDto) {
        const {name,email,password} = dto;
        const user = await this.userService.findByEmail(email);
        if(user){
            throw new ConflictException('User already exists');
        }
        const haspassword = await bcrypt.hash(password,12);

        const newUser = await this.userService.create({
            name: name || 'User',
            email,
            password:haspassword,
            status: UserStatus.PENDING_EMAIL_VERIFICATION
});


return{
  status:"successfuly, go to email to verify account",
user:{
    sub:newUser.id,
    name:newUser.name ,
    email:newUser.email,
    role:newUser.role,
},
  message:`go to login to create a session`

};      

    }
      async login(user:UserEntity): Promise<AuthResponse> {
      
          if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }
   
     this.accountStatusService.ensureCanLogin(user);

    // Generate tokens
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      status: user.status,
    };
    const accessToken = await this.generateAccessToken(payload);

     // Update last login
    await this.prisma.user.update({
      where: { id: user.id },
      data: { updatedAt: new Date() },
    });

    return {
      user: {
        sub: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        status: user.status,
      },
        accessToken,
        refreshToken:'face-refresh',
        expiresIn: Number(this.configService.get('JWT_EXPIRES_IN')),
    };
  ;}

    async validateRefreshToken(userId: string, tokenId: string) {
    const token = await this.prisma.authToken.findUnique({
      where: { id: tokenId },
    });
    if (!token || token.isRevoked  || token.expiresAt < new Date()) {
      throw new UnauthorizedException('invalid refresh token')
    }

    return {
      userId,
      tokenId
    };

  };


   async validateJwtPayload(userId: string) {
 const user = await this.prisma.user.findUnique({
    where: { id: userId },
   
  });
   if (!user)  throw new UnauthorizedException('User not found or inactive');

   return{
    id:user.id,
    name:user.name,
    email:user.email,
    role: user.role,
    status: user.status,
   
   }
 }


   async generateAccessToken(payload: JwtPayload): Promise<string> {
    return this.jwtService.signAsync(payload, {
      secret: this.configService.get('JWT_SECRET'),
      expiresIn: this.configService.get('JWT_EXPIRES_IN', '15m'),
    });
  }
  async generateRefreshToken(payload: JwtPayload): Promise<string> {
    return this.jwtService.signAsync(payload, {
      secret: this.configService.get('JWT_REFRESH_SECRET'),
      expiresIn: this.configService.get('JWT_REFRESH_EXPIRES_IN', '7d'),
    });
  }

   async validateUser(email: string, password: string): Promise<any> {
    const user = await this.userService.findByEmail(email);
     
    if (user && await bcrypt.compare(password, user.password)) {
      return user;
    }
    return null;
  }
  
}
