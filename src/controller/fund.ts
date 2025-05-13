import { Req, Logger } from '@nestjs/common';
import { Controller, Get, Query } from '@nestjs/common';

import FundService from '../service/fund';
import TimerHandlerService from '../service/timer-handler';

import FeishuNofityService from '../service/feishu-notify';
import { CanSealReq, HadSealReq, ManualHadBuyReq } from '../types/fund';
import { getFundInfo } from '../constants/buy-fund-list';
import HadBuyFundDotModel from '../model/had-buy-fund-dot';
import BuyMsgRecordModel, { BuyMsgRecord } from '../model/buy-msg-record';
import { getLocalIPs } from 'src/utils/get-local-ip';
import { Request } from 'express';

@Controller()
export default class FundController {
  constructor(
    private readonly fundService: FundService,
    private readonly feishuNofityService: FeishuNofityService,
    private readonly timerHandlerService: TimerHandlerService,
  ) {}

  private readonly logger = new Logger(FundController.name);

  @Get('/buy-fund-msg')
  public async getBuyFundListMsg(@Req() req: Request) {
    const result = await this.timerHandlerService.sendBuyFundMsg(
      req.headers.host,
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
    const record = await BuyMsgRecordModel.findById(recordId);
    if (!record || record.hadBuy) {
      this.fundService.setDbHadBuyCount();
      return {
        code: -1,
        msg: '已处理过「已买入配置」，无需重复处理',
        record,
      };
    }
    const hadDealInfo = await Promise.all(
      record.toObject().needBuyList.map(async (item) => {
        const buyDate = hadBuyParams?.buyDate || item.buyDate;

        return await this.fundService.setHadBuy({
          ...item,
          buyDate,
        });
      }),
    );
    record.hadBuy = true;
    await record.save();
    const msg = await this.feishuNofityService.sendHadManualSetDealMessage(
      hadDealInfo,
      recordId,
    );
    return {
      hadDealInfo,
      msg,
    };
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
    return this.timerHandlerService.sendSealFundMsg(req.headers.host || '');
  }
  @Get('/seal/set-had-seal')
  public async setHadSeal(@Query() params: HadSealReq) {
    const msg = await this.fundService.setHadSealDot(
      params.recordId,
      params.fundCode,
    );
    return msg;
  }

  @Get('/dev/handler')
  public async devHandler() {
    const test = await this.fundService.getScrewFundStartList();

    const item = await HadBuyFundDotModel.find({
      // sealedAt:{
      //   $exists:true
      // }
    });
    //  for (const inValidDate of inValidList) {
    //     await HadBuyFundDotModel.deleteMany({
    //       buyDate: inValidDate._id
    //     })
    //  }
    return {
      test,
      item,
    };
  }
}
