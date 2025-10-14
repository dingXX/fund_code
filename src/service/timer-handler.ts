import { Injectable, Inject } from '@nestjs/common';
import FeishuNofityService from './feishu-notify';
import FundService from './fund';
import dayjs from 'dayjs';
import BuyMsgRecordModel from '../model/buy-msg-record';

@Injectable()
export default class TimerHandlerService {
  @Inject()
  private fundService!: FundService;

  @Inject()
  private feishuNofityService!: FeishuNofityService;

  private defaultHost = 'https://qxr6rlqx.fn-boe.bytedance.net';

  /**
   * 发送买入消息
   * @param host
   * @returns
   */
  public async sendBuyFundMsg(host?: string) {
    await this.fundService.setDbHadBuyCount();

    const buyList = await this.fundService.getBuyFundList();
    const screwData = await this.fundService.getScrewFundStartList();
    const feishu = await this.feishuNofityService.sendBuyMessage(
      buyList,
      host || this.defaultHost,
      screwData,
    );
    return feishu;
  }

  public async sendTimingBuyFundMsgMsg(host?: string) {
    const buyList = await this.fundService.getBuyFundList(
      undefined,
      (item, buyTime) => {
        return !!(
          item.buyType === 'timing' && item.isTimingBuyTime?.(dayjs(buyTime))
        );
      },
    );
    const screwData = await this.fundService.getScrewFundStartList();
    const feishu = await this.feishuNofityService.sendBuyMessage(
      buyList,
      host || this.defaultHost,
      screwData,
    );
    setTimeout(() => {
      return this.setHadBuyRecordById(feishu.recordId);
    }, 1000);
    return feishu;
  }

  public async sendSealFundMsg(host?: string) {
    await this.fundService.setDbHadBuyCount();

    const resultList = await this.fundService.getAllCanSealInfo();
    let msg;
    if (resultList.length) {
      const screwData = await this.fundService.getScrewFundStartList();

      msg = await this.feishuNofityService.sendSealMessage(
        resultList,
        host || this.defaultHost,
        screwData,
      );
    }
    return {
      resultList,
      msg,
    };
  }

  /**
   * 设置已买入记录
   * @param recordId
   * @param customBuyDate
   * @returns
   */
  public async setHadBuyRecordById(recordId: string, customBuyDate?: string) {
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
        const buyDate = customBuyDate || item.buyDate;

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
}
