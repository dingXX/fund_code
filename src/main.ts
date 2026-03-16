import { NestFactory } from '@nestjs/core';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });
dotenv.config();

async function bootstrap() {
  const { AppModule } = await import('./app.module');
  const { getLocalIPs } = await import('./utils/get-local-ip');
  const { dbConnetMiddleware } = await import('./middleware/db-connect');
  const app = await NestFactory.create(AppModule);
  const port = process.env.PORT ?? 3000;
  app.use(dbConnetMiddleware);
  await app.listen(port);
  const ip = getLocalIPs();
  console.log('访问链接', `http://${ip}:${port}`);
}
bootstrap();
