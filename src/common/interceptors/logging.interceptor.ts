import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { User } from '@prisma/client';
import { Request, Response } from 'express';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { JwtPayload } from 'src/auth/interfaces/jwt-payload';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger(LoggingInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const ctx = context.switchToHttp();
    const request: Request = ctx.getRequest();
    const response: Response = ctx.getResponse();
    const { method, url, ip, headers } = request;

    const userAgent = headers['user-agent'] || '';
    const userId = (request.user as JwtPayload)?.sub || 'anonymous';
    const origin =
      request.headers.origin ||
      `${request.protocol}://${request.headers.host}`;

    const startTime = Date.now();

    return next.handle().pipe(
      tap(() => {
        const endTime = Date.now();
        const duration = endTime - startTime;

        this.logger.log({
          method,
          url,
          status: response.statusCode,
          duration,
          origin,
          userId,
          ip,
          userAgent,
        });
      }),
    );
  }
}
