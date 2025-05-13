import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';

export const MONGODB_URI = 'mongodb://localhost:27017/fund_code';

export async function dbConnetMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  await mongoose.connect(MONGODB_URI);

  await next(); // 调用 next() 将控制权传递给下一个中间件或路由处理程序
}
