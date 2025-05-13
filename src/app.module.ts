import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import FundController from './controller/fund';
import FundService from './service/fund';
import FeiShuNotifyService from './service/feishu-notify';
import TimerHandlerService from './service/timer-handler';

@Module({
  imports: [],
  controllers: [AppController, FundController],
  providers: [
    AppService,
    FundService,
    FeiShuNotifyService,
    TimerHandlerService,
  ],
})
export class AppModule {}
