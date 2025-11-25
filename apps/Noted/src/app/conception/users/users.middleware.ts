import { Injectable, NestMiddleware } from '@nestjs/common';

@Injectable()
export class UsersMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: () => void) {
    console.log('Middleware');
    next();
  }
}
