import {
  Body,
  Controller,
  Get,
  Post,
  Req,
  UseGuards,
} from "@nestjs/common";
import { AuthService } from "./auth.service";
import { UserService } from "./user.service";
import { NonceRequestDto, VerifyDto } from "./dto/auth.dto";
import { JwtAuthGuard, AuthUser } from "./jwt-auth.guard";

@Controller()
export class IdentityController {
  constructor(
    private readonly auth: AuthService,
    private readonly users: UserService,
  ) {}

  @Post("auth/wallet/nonce")
  requestNonce(@Body() dto: NonceRequestDto) {
    return this.auth.requestNonce(dto.address);
  }

  @Post("auth/wallet/verify")
  verify(@Body() dto: VerifyDto) {
    return this.auth.verify(dto);
  }

  @Get("users/me")
  @UseGuards(JwtAuthGuard)
  async me(@Req() req: { user: AuthUser }) {
    const user = await this.users.findById(req.user.sub);
    return { user };
  }
}
