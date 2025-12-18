import { PassportStrategy } from "@nestjs/passport";

import { ExtractJwt } from "passport-jwt";

import { AuthService } from "../auth.service";

import { Injectable, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Strategy } from "passport-local";

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
  constructor(private authService: AuthService,
    private config:ConfigService
  ) {
    super({
      usernameField:'email',
      passwordField:'password',
    });
  }

  async validate(email: string, password: string): Promise<any> {
    const user = await this.authService.validateUser(email, password);
    if (!user) {
      throw new UnauthorizedException();
    }
    return user;
  }
}