import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import * as crypto from "crypto";
import verifyDataSignature from "@cardano-foundation/cardano-verify-datasignature";
import { PrismaService } from "../../infra/prisma/prisma.service";
import { UserService } from "./user.service";
import { VerifyDto } from "./dto/auth.dto";

const NONCE_TTL_MS = 10 * 60 * 1000;

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly users: UserService,
    private readonly jwt: JwtService,
  ) {}

  /** The exact human-readable string the wallet signs. Includes the one-time nonce. */
  private message(nonce: string): string {
    return `Sign in to Snekpad Social Farming\n\nnonce: ${nonce}`;
  }

  /** Step 1: issue a one-time nonce + the message to sign. No gas, no transaction. */
  async requestNonce(address: string) {
    const nonce = crypto.randomBytes(16).toString("hex");
    await this.prisma.authNonce.create({
      data: {
        address,
        nonce,
        expiresAt: new Date(Date.now() + NONCE_TTL_MS),
      },
    });
    return { nonce, message: this.message(nonce) };
  }

  /** Step 2: verify the CIP-30 signature over the nonce, then issue a session JWT. */
  async verify(dto: VerifyDto) {
    const record = await this.prisma.authNonce.findUnique({
      where: { nonce: dto.nonce },
    });
    if (!record || record.address !== dto.address) {
      throw new BadRequestException("unknown nonce");
    }
    if (record.usedAt) throw new BadRequestException("nonce already used");
    if (record.expiresAt < new Date()) {
      throw new BadRequestException("nonce expired");
    }

    let valid = false;
    try {
      valid = verifyDataSignature(
        dto.signature,
        dto.key,
        this.message(dto.nonce),
        dto.address,
      );
    } catch {
      valid = false;
    }
    if (!valid) throw new UnauthorizedException("signature verification failed");

    await this.prisma.authNonce.update({
      where: { nonce: dto.nonce },
      data: { usedAt: new Date() },
    });

    const user = await this.users.upsertByWallet(dto.address);
    const token = this.jwt.sign({ sub: user.id, addr: user.walletAddress });
    return { token, user: { id: user.id, walletAddress: user.walletAddress } };
  }
}
