import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import { ValidationPipe, Logger } from "@nestjs/common";
import { AppModule } from "./app.module";

async function bootstrap() {
  // rawBody:true lets the ingestion HMAC guard verify the exact bytes the launchpad signed.
  const app = await NestFactory.create(AppModule, { rawBody: true });
  app.setGlobalPrefix("api/v1");
  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, transform: true, forbidNonWhitelisted: false })
  );
  const port = process.env.PORT ?? 4000;
  await app.listen(port);
  new Logger("Bootstrap").log(`Social Farming Engine listening on :${port}`);
}
bootstrap();
