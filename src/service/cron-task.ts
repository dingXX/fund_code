import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import TimerHandlerService from './timer-handler';
import { getLocalIPs } from '../utils/get-local-ip';

type TaskName = 'buy' | 'timingBuy' | 'seal';

const DEFAULT_TIME_ZONE = 'Asia/Shanghai';
const TIME_ZONE =
  (typeof process.env.CRON_TZ === 'string' && process.env.CRON_TZ.trim()) ||
  DEFAULT_TIME_ZONE;

const CRON_BUY =
  (typeof process.env.CRON_BUY === 'string' && process.env.CRON_BUY.trim()) ||
  '0 30 11 * * 1-5';
const CRON_TIMING_BUY =
  (typeof process.env.CRON_TIMING_BUY === 'string' &&
    process.env.CRON_TIMING_BUY.trim()) ||
  '0 50 14 * * 1-5';
const CRON_SEAL =
  (typeof process.env.CRON_SEAL === 'string' && process.env.CRON_SEAL.trim()) ||
  '0 55 14 * * 1-5';

@Injectable()
export default class CronTaskService {
  constructor(private readonly timerHandlerService: TimerHandlerService) {}

  private readonly logger = new Logger(CronTaskService.name);
  private readonly running = new Set<TaskName>();

  private getOriginFromEnv() {
    const envOrigin = process.env.APP_ORIGIN;
    if (typeof envOrigin === 'string' && envOrigin.trim()) {
      return envOrigin.replace(/\/+$/, '');
    }

    const ip = getLocalIPs();
    const port = process.env.PORT ?? 3000;
    return `http://${ip}:${port}`;
  }

  @Cron('0 0 10 * * 2', {
    name: 'cron:buy',
    timeZone: TIME_ZONE,
    disabled: process.env.NODE_ENV?.toLowerCase() !== 'production',
  })
  async handleBuy() {
    await this.runOnce('buy', async () => {
      const origin = this.getOriginFromEnv();
      await this.timerHandlerService.sendBuyFundMsg(origin);
    });
  }

  // @Cron(CRON_TIMING_BUY, {
  //   name: 'cron:timingBuy',
  //   timeZone: TIME_ZONE,
  //   disabled: !ENABLED_TASKS.has('timingBuy'),
  // })
  // async handleTimingBuy() {
  //   await this.runOnce('timingBuy', async () => {
  //     const origin = this.getOriginFromEnv();
  //     await this.timerHandlerService.sendTimingBuyFundMsgMsg(origin);
  //   });
  // }

  @Cron('0 0 10 * * *', {
    name: 'cron:seal',
    timeZone: TIME_ZONE,
    disabled: process.env.NODE_ENV?.toLowerCase() !== 'production',
  })
  async handleSeal() {
    await this.runOnce('seal', async () => {
      const origin = this.getOriginFromEnv();
      await this.timerHandlerService.sendSealFundMsg(origin);
    });
  }

  private async runOnce(name: TaskName, run: () => Promise<unknown>) {
    if (this.running.has(name)) return;

    this.running.add(name);
    try {
      await run();
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      this.logger.error(`cron:${name} failed: ${msg}`);
    } finally {
      this.running.delete(name);
    }
  }
}
