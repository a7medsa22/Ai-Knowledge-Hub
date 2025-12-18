import { Injectable, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from "@nestjs/passport";
import { AuthService } from "../auth.service";
import { JwtPayload } from "../interfaces/jwt-payload";


@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy){
    constructor(
    private readonly config: ConfigService,
    private readonly authService: AuthService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.get<string>('JWT_SECRET')!,
    });
  }
    async validate(payload:JwtPayload) {
        const user = await this.authService.validateJwtPayload(payload.sub);
        if(!user){
            throw new UnauthorizedException('User not found');
        }
        return payload
        
    }
}