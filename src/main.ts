import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { getLocalIPs } from './utils/get-local-ip';
import { dbConnetMiddleware } from './middleware/db-connect';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const port = process.env.PORT ?? 3000;
  app.use(dbConnetMiddleware);
  await app.listen(port);
  const ip = getLocalIPs();
  console.log('访问链接', `http://${ip}:${port}`);
}
bootstrap();
