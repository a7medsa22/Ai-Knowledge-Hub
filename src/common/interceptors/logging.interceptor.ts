import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger(LoggingInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const ctx = context.switchToHttp();
    const request = ctx.getRequest();
    const response = ctx.getResponse();
    const { method, url,ip , headers } = request;
    
    const userAgent = headers['user-agent'] || '';
    const userId = request.user?.id || 'anonymous';
    
    const startTime = Date.now();

    return next.handle().pipe(
      tap(() => {
        const endTime = Date.now();
        const duration = endTime - startTime;
        
        this.logger.log(
          `${method} ${url} ${response.statusCode} - ${duration}ms - User: ${userId} - IP: ${ip} - ${userAgent}`,
        );
      }),
    );
  }
}