import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import * as crypto from "crypto";

/**
 * Verifies the `x-signature` header = HMAC-SHA256(rawBody, LAUNCHPAD_WEBHOOK_SECRET).
 * Constant-time compare; rejects missing/invalid signatures. This is how we trust
 * that an inbound event genuinely came from the launchpad without any shared DB.
 */
@Injectable()
export class HmacGuard implements CanActivate {
  constructor(private readonly config: ConfigService) {}

  canActivate(ctx: ExecutionContext): boolean {
    const req = ctx.switchToHttp().getRequest();
    const provided = req.headers["x-signature"] as string | undefined;
    const raw: Buffer | undefined = req.rawBody;

    if (!provided || !raw) {
      throw new UnauthorizedException("missing signature or body");
    }
    const secret = this.config.get<string>("webhookSecret")!;
    const expected = crypto.createHmac("sha256", secret).update(raw).digest("hex");

    const a = Buffer.from(provided);
    const b = Buffer.from(expected);
    if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
      throw new UnauthorizedException("invalid signature");
    }
    return true;
  }
}
