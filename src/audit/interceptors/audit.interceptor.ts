import {
    CallHandler,
    ExecutionContext,
    Injectable,
    NestInterceptor,
  } from '@nestjs/common';
  import { Observable, tap } from 'rxjs';
  import { AuditService } from '../audit.service';
  
  @Injectable()
  export class AuditInterceptor implements NestInterceptor {
    constructor(private audit: AuditService) {}
  
    intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
      const req = context.switchToHttp().getRequest();
      const user = req.user ?? null;
  
      return next.handle().pipe(
        tap(async (result) => {
          if (!result || !result.id) return;
  
          const action = `${req.method} ${req.route.path}`;
          await this.audit.log(action, result, user, { body: req.body });
        }),
      );
    }
  }
  