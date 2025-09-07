import { createParamDecorator ,ExecutionContext, Injectable } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}

 export const GetUser = createParamDecorator((data:unknown , ctx:ExecutionContext )=>  {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
 })