import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';

const {
  MONGODB_URI: ENV_MONGODB_URI,
  MONGO_HOST,
  MONGO_PORT,
  MONGO_DB,
  MONGO_USER,
  MONGO_PASSWORD,
  MONGO_AUTH_SOURCE = 'admin',
  MONGO_AUTH_MECHANISM,
  MONGO_SRV,
} = process.env;

let mongoUri = ENV_MONGODB_URI;
if (!mongoUri) {
  const host = MONGO_HOST || 'localhost';
  const port = MONGO_PORT || '27017';
  const db = MONGO_DB || 'fund_code';
  const proto = MONGO_SRV === 'true' ? 'mongodb+srv' : 'mongodb';
  const auth =
    MONGO_USER && typeof MONGO_USER === 'string'
      ? `${encodeURIComponent(MONGO_USER)}:${encodeURIComponent(
          MONGO_PASSWORD || '',
        )}@`
      : '';
  mongoUri = `${proto}://${auth}${host}${MONGO_SRV === 'true' ? '' : `:${port}`}/${db}`;
  const params: string[] = [];
  if (MONGO_AUTH_SOURCE)
    params.push(`authSource=${encodeURIComponent(MONGO_AUTH_SOURCE)}`);
  if (MONGO_AUTH_MECHANISM)
    params.push(`authMechanism=${encodeURIComponent(MONGO_AUTH_MECHANISM)}`);
  if (params.length) mongoUri += `?${params.join('&')}`;
}

export const MONGODB_URI = mongoUri;

export async function dbConnetMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  if (mongoose.connection.readyState !== 1) {
    await mongoose.connect(MONGODB_URI);
  }

  await next(); // 调用 next() 将控制权传递给下一个中间件或路由处理程序
}
