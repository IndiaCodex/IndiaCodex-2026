import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../infra/prisma/prisma.service";

@Injectable()
export class UserService {
  constructor(private readonly prisma: PrismaService) {}

  /** Get-or-create a user by wallet address. */
  upsertByWallet(walletAddress: string) {
    return this.prisma.user.upsert({
      where: { walletAddress },
      create: { walletAddress },
      update: {},
    });
  }

  findById(id: string) {
    return this.prisma.user.findUnique({ where: { id } });
  }
}
