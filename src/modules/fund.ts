import { Module } from '@nestjs/common';
import FundController from '../controller/fund';
import FundService from '../service/fund';
import { AppController } from 'src/app.controller';
import FeiShuNotifyService from 'src/service/feishu-notify';
import TimerHandlerService from 'src/service/timer-handler';

@Module({
  imports: [],
  controllers: [FundController, AppController],
  providers: [FundService, FeiShuNotifyService, TimerHandlerService],
})
export class FundModule {}
