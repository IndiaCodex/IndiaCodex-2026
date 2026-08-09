import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { ConfigService } from "@nestjs/config";
import { IdentityController } from "./identity.controller";
import { AuthService } from "./auth.service";
import { UserService } from "./user.service";
import { JwtAuthGuard } from "./jwt-auth.guard";

@Module({
  imports: [
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>("jwt.secret"),
        signOptions: { expiresIn: config.get<string>("jwt.expiresIn") },
      }),
    }),
  ],
  controllers: [IdentityController],
  providers: [AuthService, UserService, JwtAuthGuard],
  exports: [JwtAuthGuard, JwtModule, UserService],
})
export class IdentityModule {}
