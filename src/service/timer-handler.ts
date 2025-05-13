import { Injectable, Inject } from '@nestjs/common';
import FeishuNofityService from './feishu-notify';
import FundService from './fund';

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
}
