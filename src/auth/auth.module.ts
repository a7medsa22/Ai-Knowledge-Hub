import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtModule } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PassportModule } from '@nestjs/passport';
import { UsersModule } from 'src/users/users.module';
import { JwtStrategy } from './strategies/jwt.strategy';

@Module({
  imports:[ 
    PassportModule.register({defaultStrategy:'jwt'}),
     JwtModule.registerAsync({
      useFactory: async (config:ConfigService)=>
    ({
      secret:config.get('JWT_SECRET'),
      signOptions:{expiresIn:config.get('JWT_EXPIRES_IN')},
    }),
    inject:[ConfigService]
     }),
     JwtModule,
     PassportModule,
     UsersModule,
  ],
  controllers: [AuthController],
  providers: [AuthService,JwtStrategy]
})
export class AuthModule {}
