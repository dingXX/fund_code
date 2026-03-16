import { Req, Logger } from '@nestjs/common';
import { Controller, Get, Query } from '@nestjs/common';

import FundService from '../service/fund';
import TimerHandlerService from '../service/timer-handler';

import FeishuNofityService from '../service/feishu-notify';
import { CanSealReq, HadSealReq, ManualHadBuyReq } from '../types/fund';
import { getFundInfo } from '../constants/buy-fund-list';
import HadBuyFundDotModel from '../model/had-buy-fund-dot';
import BuyMsgRecordModel, { BuyMsgRecord } from '../model/buy-msg-record';
import { Request } from 'express';

@Controller()
export default class FundController {
  constructor(
    private readonly fundService: FundService,
    private readonly feishuNofityService: FeishuNofityService,
    private readonly timerHandlerService: TimerHandlerService,
  ) {}

  private readonly logger = new Logger(FundController.name);

  private getOrigin(req: Request) {
    const envOrigin = process.env.APP_ORIGIN;
    if (typeof envOrigin === 'string' && envOrigin.trim()) {
      return envOrigin.replace(/\/+$/, '');
    }

    return req.headers.host
  }

  @Get('/buy-fund-msg')
  public async getBuyFundListMsg(@Req() req: Request) {
    const result = await this.timerHandlerService.sendBuyFundMsg(
      this.getOrigin(req),
    );
    return result;
  }
  @Get('/buy-timing-fund-msg')
  public async getTimingBuyFundListMsg(@Req() req: Request) {
    const result = await this.timerHandlerService.sendTimingBuyFundMsgMsg(
      this.getOrigin(req),
    );
    return result;
  }
  @Get('/buy-fund')
  public async getBuyFundList() {
    const buyList = await this.fundService.getBuyFundList();
    return buyList;
  }

  @Get('/history-buy')
  public async getHistoryBuyList() {
    const buyList = await this.fundService.getHistoryBuyInfo(
      '110022',
      '2023-04-06',
    );
    // const buyList = await this.fundService.setAllHadBuyFundDot()
    return buyList;
  }
  @Get('/manual-set-had-buy')
  public async manualSetHadBuy(@Query() hadBuyParams: ManualHadBuyReq) {
    const { recordId } = hadBuyParams;
    return this.timerHandlerService.setHadBuyRecordById(
      recordId,
      hadBuyParams?.buyDate,
    );
  }

  @Get('/had-buy/auto-set-buy-count')
  public async autoSetDbHadBuyCount() {
    const msg = await this.fundService.setDbHadBuyCount();
    return msg;
  }

  @Get('/seal/manual-check-can-seal')
  public async getCanSealInfo(@Query() params: CanSealReq) {
    const changeRate =
      Number(params.changeRate) ||
      getFundInfo(params.fundCode)?.defaultChangeRate ||
      undefined;

    const msg = await this.fundService.getCanSealInfo(
      params.fundCode,
      changeRate,
      params.buyTime,
    );
    return msg;
  }

  @Get('/seal/send-msg')
  public async getSealMsg(@Req() req: Request) {
    return this.timerHandlerService.sendSealFundMsg(this.getOrigin(req));
  }
  @Get('/seal/set-had-seal')
  public async setHadSeal(@Query() params: HadSealReq) {
    const msg = await this.fundService.setHadSealDot(
      params.recordId,
      params.fundCode,
    );
    console.log('已卖出');
    return msg;
  }

  @Get('/dev/handler')
  public async devHandler() {
    const dateList = [
      '2025-10-20',
      '2025-11-10',
      '2025-11-07',
      '2025-11-05',
      '2025-11-04',
      '2025-11-03',
      '2025-10-31',
      '2025-10-28',
      '2025-10-27',
      '2025-10-24',
      '2025-10-21',
      '2025-10-20',
      '2025-10-17',
    ];

    // const test = await this.fundService.getFundCodeIncome('006479');
    const test = await HadBuyFundDotModel.find({
      fundCode: '006479',
      // buyDate: {
      //   $in: dateList,
      // },
    });
    // await HadBuyFundDotModel.deleteMany({

    // })
    // test.forEach((item) => {
    //   if (dateList.includes(item.buyDate)) {
    //     console.log('match', item.buyDate);
    //     item.delete();

    //   }
    // });
    // const item = await HadBuyFundDotModel.find({
    //   // sealedAt:{
    //   //   $exists:true
    //   // }
    // });
    //  for (const inValidDate of inValidList) {
    //     await HadBuyFundDotModel.deleteMany({
    //       buyDate: inValidDate._id
    //     })
    //  }
    return {
      test,
      // item,
    };
  }
}
