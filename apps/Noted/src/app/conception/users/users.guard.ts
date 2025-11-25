import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { request } from 'http';
import { Observable } from 'rxjs';

@Injectable()
export class UsersGuard implements CanActivate {
  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const request = context.switchToHttp().getRequest();
    const isAuthorized = request.headers.auth === '12345'
    if(!isAuthorized) {
      throw new UnauthorizedException('Unauthorized');
    }
    return isAuthorized;
  }
}
