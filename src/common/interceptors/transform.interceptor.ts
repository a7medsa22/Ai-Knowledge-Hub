import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from "@nestjs/common";
import { Observable } from "rxjs";
import { map } from 'rxjs/operators';

export interface Response<T> {
  success: boolean;
  statusCode: number;
  message: string;
  data: T;
  timestamp: string;
}
@Injectable()
export class TransformInterceptor<T>implements NestInterceptor<T, Response<T>> {
  intercept(context: ExecutionContext, next: CallHandler): Observable<Response<T>> {
    const ctx = context.switchToHttp();
    const response = ctx.getResponse();
    
    return next.handle().pipe(
      map((data) => ({
        success: response.statusCode < 400,
        statusCode: response.statusCode,
        message: data?.message || 'Operation successful',
        data: data?.data || data,
        timestamp: new Date().toISOString(),
      })),
    );
  }
}
  
