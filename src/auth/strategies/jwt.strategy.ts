import { Injectable, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from "@nestjs/passport";
import { AuthService } from "../auth.service";

export interface JwtPayload {
  sub: string;
  email: string;
  role: string;
  iat?: number;
  exp?: number;
}
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy){
    constructor(
    private readonly config: ConfigService,
    private readonly authService: AuthService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      //* ! *  عشان تقول للـ TS إنها مش undefined
      secretOrKey: config.get<string>('JWT_SECRET')!,
    });
  }
    async validate(payload:JwtPayload) {
        const user = await this.authService.validateUser(payload.sub);
        if(!user){
            throw new UnauthorizedException('User not found');
        }
        return {
            sub:user.id,
            email:user.email,
            role:user.role,
            name:user.name,
        }
        
    }


  
}