import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { AppService } from './app.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);
  const appService = app.get(AppService);
  const port = configService.get<number>('port')!;
  app.enableShutdownHooks(['SIGINT']);
  appService.main();
  await app.listen(port);
}
bootstrap();
