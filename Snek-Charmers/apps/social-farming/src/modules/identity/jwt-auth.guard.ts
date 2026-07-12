import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";

export interface AuthUser {
  sub: string; // user id
  addr: string; // wallet address
}

/** Lightweight Bearer-JWT guard. Attaches the decoded user to request.user. */
@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly jwt: JwtService) {}

  canActivate(ctx: ExecutionContext): boolean {
    const req = ctx.switchToHttp().getRequest();
    const header: string | undefined = req.headers.authorization;
    if (!header?.startsWith("Bearer ")) {
      throw new UnauthorizedException("missing bearer token");
    }
    try {
      req.user = this.jwt.verify<AuthUser>(header.slice(7));
      return true;
    } catch {
      throw new UnauthorizedException("invalid or expired token");
    }
  }
}
