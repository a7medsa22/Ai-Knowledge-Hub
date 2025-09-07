import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AuthResponseDto, LoginDto, RegisterDto } from './dto/auth.dto';
import { UsersService } from 'src/users/users.service';
import * as bcrypt from 'node_modules/bcryptjs';

@Injectable()
export class AuthService {
    constructor(private jwtService:JwtService,private userService:UsersService){}

    public async register(dto:RegisterDto): Promise<AuthResponseDto> {
        const {name,email,password} = dto;
        const user = await this.userService.findByEmail(email);
        if(user){
            throw new ConflictException('User already exists');
        }
        const haspassword = await bcrypt.hash(password,12);

        const newUser = await this.userService.create({
            name,
            email,
            password:haspassword
});

const payload = {
    sub:newUser.id,email:newUser.email,role:newUser.role
};
const access_token = this.jwtService.sign(payload);
return{
access_token,
user:{
    id:newUser.id,
    name:newUser.name ?? undefined,
    email:newUser.email,
    role:newUser.role
},
};      

    }
      async login(loginDto: LoginDto): Promise<AuthResponseDto> {
    const { email, password } = loginDto;

    // Find user
    const user = await this.userService.findByEmail(email);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Generate JWT
    const payload = { sub: user.id, email: user.email, role: user.role };
    const access_token = this.jwtService.sign(payload);

    return {
      access_token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name ?? undefined,
        role: user.role,
      },
    };
  }
   async validateUser(userId: string) {
    return this.userService.findOne(userId);
  }


}
