import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import FundController from './controller/fund';
import FundService from './service/fund';
import FeiShuNotifyService from './service/feishu-notify';
import CronTaskService from './service/cron-task';
import TimerHandlerService from './service/timer-handler';

@Module({
  imports: [ScheduleModule.forRoot()],
  controllers: [AppController, FundController],
  providers: [
    AppService,
    FundService,
    FeiShuNotifyService,
    CronTaskService,
    TimerHandlerService,
  ],
})
export class AppModule {}
