import { Inject, Injectable, Logger } from '@nestjs/common';
import QueryString from 'qs';
import dayjs, { Dayjs } from 'dayjs';
import { buyFundList, getFundInfo } from '../constants/buy-fund-list';
import {
  BuyFund,
  CanSealItem,
  FundDotItem,
  FundItem,
  HadBuyItem,
  ScrewData,
  ScrewStatus,
  hadBuyParams,
} from '../types/fund';
import { getFormatDate, getFundDealDot } from '../utils/deal-date';
import HadBuyFundDotModel from '../model/had-buy-fund-dot';
import { get, pick } from 'lodash';
import { getRateStr } from '../utils/get-rate-str';
import SealMsgRecordModel from '../model/seal-msg-record';

@Injectable()
export default class FundService {
  private readonly logger = new Logger(FundService.name);

  /**
   * 螺丝钉的基金星级接口，
   * 对应小程序的「今日几星」
   */
  async getScrewFundStartList(): Promise<ScrewData> {
    const url =
      'https://danjuanfunds.com/djapi/fundx/base/vip/valuation/show/detail?source=lsd';
    const resp = await fetch(url, {
      method: 'GET',
    });
    if (resp.status !== 200) {
      throw new Error(
        `Failed to get data from getScrewFundStartList: [${url}] ${resp.status}`,
      );
    }
    const result = await resp.json();
    const data: {
      valuations: { outside_fund: string; valuation_status: ScrewStatus }[];
      grade: string;
    } = result.data;
    // 今日星级
    const grade = data.grade;
    const screwFundIds = buyFundList
      .map((item) => item.screwFundId)
      .filter(Boolean);
    const statusMap = data.valuations
      .filter((item) => screwFundIds.includes(item.outside_fund))
      .reduce<Record<string, ScrewStatus>>((pre, item) => {
        pre[item.outside_fund] = item.valuation_status;
        return pre;
      }, {});
    return {
      grade,
      statusMap,
    };
  }

  private async fetch<T>(
    url: string,
    query: Record<string, any> = {},
  ): Promise<T> {
    const queryStr = QueryString.stringify({
      ...query,
      callback: 'test',
    });
    console.log('queryStr', queryStr);
    const resp = await fetch(`${url}?${queryStr}`, {
      method: 'GET',
      headers: {
        Referer: 'https://fundf10.eastmoney.com/',
      },
    });
    if (resp.status !== 200) {
      throw new Error(
        `Failed to get data from FundService: [${url}] ${resp.status}`,
      );
    }
    const result = await resp.text();
    const getResultJsonFn = new Function(`
    function test(info){
      return info;
    }
    return ${result}
    `);
    const resultJson = getResultJsonFn();
    if (resultJson?.ErrMsg) {
      throw new Error(
        `Failed to get data from FundService: [${url}] ${resultJson?.ErrMsg}`,
      );
    }
    return resultJson as T;
  }

  public async getFundData(
    fundCode: string,
    params: {
      pageIndex?: number;
      pageSize?: number;
    } = {},
  ) {
    console.log('getFundData', fundCode);
    const resp = await this.fetch<{
      Data: { LSJZList: Array<{ FSRQ: string; DWJZ: string }> };
      TotalCount: number;
      PageSize: number;
      PageIndex: Number;
    }>('https://api.fund.eastmoney.com/f10/lsjz', {
      pageIndex: 1,
      pageSize: 20,
      ...params,
      fundCode,
    });
    const list = resp.Data.LSJZList.map((item) => {
      return {
        date: item.FSRQ,
        price: Number(item.DWJZ),
      };
    });
    return {
      list,
      totalCount: resp.TotalCount,
      pageSize: resp.PageSize,
      pageIndex: resp.PageIndex,
    };
  }

  public async getWeekPriceChange(
    fundCode: string,
    buyBasePrice: number = 200,
    buyTime?: string,
  ): Promise<BuyFund> {
    let nowDate = getFormatDate(buyTime);
    console.log('nowDate', nowDate);

    const list = await this.getAllFundList(fundCode, nowDate);
    let nowDatePrice = list.find((item) => item.date === nowDate);
    let hasNowDate = true;
    if (!nowDatePrice) {
      hasNowDate = false;
      nowDatePrice = getFundDealDot(nowDate, list) || list[0];
    }
    const lastWeekDate = dayjs(nowDate)
      .subtract(hasNowDate ? 7 : 8, 'day')
      .format('YYYY-MM-DD');
    let lastWeekDatePrice = getFundDealDot(lastWeekDate, list);
    this.logger.log('nowDatePrice', {
      fundCode,
      nowDatePrice,
      lastWeekDatePrice,
    });
    const priceChange =
      ((nowDatePrice!.price - lastWeekDatePrice!.price) /
        lastWeekDatePrice!.price) *
      100;
    const needBuyPrice = buyBasePrice - buyBasePrice * priceChange * 0.1;
    const unSealFilter = this.getUnSealFilter(fundCode);
    const lteNowPriceDotCount = await HadBuyFundDotModel.countDocuments({
      ...unSealFilter,
      fundPrice: {
        $lte: nowDatePrice.price,
      },
    });
    const allDotCount = await HadBuyFundDotModel.countDocuments({
      ...unSealFilter,
    });

    return {
      fundCode,
      nowDate,
      lastWeekDate,
      nowDatePrice: nowDatePrice!,
      priceChange,
      lastWeekDatePrice: lastWeekDatePrice!,
      baseNeedBuyPrice: needBuyPrice,
      nowPriceCountRate: getRateStr(lteNowPriceDotCount, allDotCount),
      needBuyPrice: Math.max(
        allDotCount && lteNowPriceDotCount / allDotCount > 0.5
          ? Math.min(needBuyPrice, buyBasePrice)
          : Math.max(needBuyPrice, buyBasePrice),
        buyBasePrice * 0.4,
      ),
    };
  }

  public async getBuyFundList(
    buyTime?: string,
  ): Promise<Array<BuyFund & FundItem>> {
    const buyList = await Promise.all(
      buyFundList.map(async (item) => {
        const data = await this.getWeekPriceChange(
          item.fundCode,
          item.buyBasePrice,
          buyTime,
        );
        return {
          ...data,
          ...item,
        };
      }),
    );
    return buyList;
  }
  private async getAllFundList(fundCode: string, buyDate: string) {
    let fundList: FundDotItem[] = [];
    let hasAllGet = false;

    let pageIndex = 1;
    while (hasAllGet === false) {
      const fundData = await this.getFundData(fundCode, { pageIndex });
      fundList.push(...fundData.list);

      if (
        dayjs(fundData.list[fundData.list.length - 1].date).isAfter(
          dayjs(buyDate),
        )
      ) {
        pageIndex++;
      } else {
        hasAllGet = true;
      }
    }
    return fundList;
  }
  /**
   * 获取历史的购买记录
   */
  public async getHistoryBuyInfo(fundCode: string, firstBuyDate: string) {
    let hadBuyList: HadBuyItem[] = [];
    let fundList: FundDotItem[] = await this.getAllFundList(
      fundCode,
      firstBuyDate,
    );

    let buyDay = 2;
    let nowDay = dayjs().day();
    let lastExpectedDate = dayjs().subtract(
      nowDay < buyDay ? 7 - nowDay + buyDay : nowDay - buyDay,
      'day',
    );

    while (dayjs(lastExpectedDate).isAfter(dayjs(firstBuyDate))) {
      let dateInfo: Dayjs | string = lastExpectedDate;
      switch (getFormatDate(lastExpectedDate)) {
        case '2024-01-16':
          dateInfo = '2024-01-17';
          break;
        case '2023-06-20':
          dateInfo = '2023-06-16';
          break;
        case '2023-06-13':
          dateInfo = '2023-06-09';
          break;
        case '2023-06-06':
          dateInfo = '2023-06-02';
          break;
        case '2023-05-30':
          dateInfo = '2023-05-26';
          break;
        case '2023-05-23':
          dateInfo = '2023-05-19';
          break;
        case '2023-05-16':
          dateInfo = '2023-05-15';
          break;
        default:
          break;
      }
      const dealDot = getFundDealDot(getFormatDate(dateInfo), fundList);
      if (
        dealDot &&
        dealDot.price !== 0 &&
        !['2024-08-13', '2023-10-09', '2023-05-04'].includes(dealDot.date)
      ) {
        hadBuyList.push({
          fundCode,
          buyDate: dealDot.date,
          buyPrice: 200,
          buyCount: Math.floor(200 / dealDot.price),
          fundPrice: dealDot.price,
        });
        fundList = fundList.slice(fundList.indexOf(dealDot));
      }

      lastExpectedDate = lastExpectedDate.subtract(7, 'day');
    }
    return hadBuyList;
  }

  /**
   * 設置為已購買
   */
  public async setHadBuy(params: hadBuyParams) {
    const { fundCode, buyDate, buyPrice } = params;
    console.log('params', {
      fundCode,
      buyDate,
      buyPrice,
      params,
    });

    let fundList: FundDotItem[] = await this.getAllFundList(fundCode, buyDate);
    const dealDot = getFundDealDot(buyDate, fundList, false);
    let hadBuyDot = await HadBuyFundDotModel.findOne({
      fundCode,
      buyDate,
    });
    let isHadBuyDot = !!hadBuyDot;
    if (!hadBuyDot) {
      hadBuyDot = await HadBuyFundDotModel.create({
        fundCode,
        buyDate,
        buyPrice,
      });
      this.logger.log('不存在已有的买入数据 - 创建数据');
    }

    if (!dealDot || hadBuyDot.buyCount) {
      // TODO: 设置数据库，表示未录入具体买入信息，后续数据库再写入
      return isHadBuyDot;
    }
    const hadBuyItem: HadBuyItem = {
      buyCount: Math.floor(buyPrice / dealDot.price),
      buyDate,
      fundCode,
      buyPrice,
      fundPrice: dealDot.price,
    };
    hadBuyDot.buyCount = hadBuyItem.buyCount;
    hadBuyDot.fundPrice = hadBuyItem.fundPrice;
    await hadBuyDot.save();
    // TODO: 录入数据库
    return hadBuyItem;
  }

  /**
   * 批量设置数据库中没有实际购买股数的信息 实际购买的股数
   */
  public async setDbHadBuyCount() {
    const unBuyCountList = await HadBuyFundDotModel.find({
      buyCount: {
        $exists: false,
      },
    });
    console.log('unBuyCountList', unBuyCountList);
    for await (const item of unBuyCountList) {
      await this.setHadBuy(item);
    }

    return unBuyCountList;
  }
  private getUnSealFilter(fundCode: string) {
    return {
      $or: [{ sealedAt: { $exists: false } }],
      fundCode,
      buyCount: {
        $exists: true,
      },
    };
  }

  public async getCanSealInfo(
    fundCode: string,
    changeRate: number = 0.1,
    buyTime?: string,
  ) {
    const sealDate = getFormatDate(dayjs(buyTime));
    const fundList = await this.getAllFundList(
      fundCode,
      getFormatDate(buyTime),
    );
    const sealDealDot = getFundDealDot(sealDate, fundList);
    if (!sealDealDot) {
      this.logger.log(`当前日期不存在可交易的数据节点`, {
        fundCode,
        sealDate,
        buyTime,
      });
      return;
    }
    const dealPrice = sealDealDot.price;
    const maxBuyPrice = dealPrice / (1 + changeRate);
    const unSealFilter = this.getUnSealFilter(fundCode);
    const canSealDot = await HadBuyFundDotModel.find({
      fundPrice: {
        $lte: maxBuyPrice,
      },
      ...unSealFilter,
    });
    if (!canSealDot?.length) {
      this.logger.log(`没有满足可卖条件的节点`, {
        fundCode,
        sealDate,
        buyTime,
        changeRate,
      });
      return;
    }
    const unSealTotalInfo = await HadBuyFundDotModel.aggregate([
      // 添加筛选条件，只选择 category 为 'electronics' 的文档
      { $match: unSealFilter },
      {
        $group: {
          _id: null,
          buyCount: { $sum: '$buyCount' },
          len: { $sum: 1 },
          buyPrice: { $sum: '$buyPrice' },
        },
      },
    ]);

    const needSealInfo = canSealDot.reduce(
      (count, item) => {
        return {
          // 卖出的价格
          sealPrice: count.sealPrice + item.buyCount! * sealDealDot.price!,
          // 实际买入的份额
          buyCount: count.buyCount + item.buyCount!,
          // 实际买入的价格
          buyPrice: count.buyPrice + item.buyPrice,
        };
      },
      {
        sealPrice: 0,
        buyCount: 0,
        buyPrice: 0,
      },
    );
    return {
      canSealDot,
      maxBuyPrice,
      sealDealDot,
      needSealInfo: {
        ...needSealInfo,
        sealRate: needSealInfo.sealPrice / needSealInfo.buyPrice - 1,
        len: canSealDot.length,
      },
      fundCode,
      unSealTotalInfo: unSealTotalInfo[0],
      ...getFundInfo(fundCode),
      changeRate,
      buyTime: sealDate,
    };
  }

  public async getAllCanSealInfo() {
    const canSealList = await Promise.all(
      buyFundList.map(async (item) => {
        return await this.getCanSealInfo(
          item.fundCode,
          item?.defaultChangeRate,
        );
      }),
    );
    // 有5个交易点的时候，才考虑卖出
    return canSealList
      .filter((item) => item && item.needSealInfo.len >= 5)
      .map((item) => {
        return {
          ...pick(item, [
            'fundCode',
            'name',
            'alipaysProductId',
            'changeRate',
            'buyTime',
            'preFundPriceImg',
            'screwFundId',
          ]),
          needSealIds: item?.canSealDot.map((dot) => dot._id) || [],
          sealDotLen: `${getRateStr(get(item, 'needSealInfo.len', 0), get(item, 'unSealTotalInfo.len', 0))}`,
          sealPrice: get(item, 'needSealInfo.sealPrice', 0).toFixed(0),
          sealIncome: (
            get(item, 'needSealInfo.sealPrice', 0) -
            get(item, 'needSealInfo.buyPrice', 0)
          ).toFixed(0),
          sealIncomeRate: `${(get(item, 'needSealInfo.sealRate', 0) * 100).toFixed(2)}%`,
          sealCountRate: getRateStr(
            get(item, 'needSealInfo.buyCount', 0),
            get(item, 'unSealTotalInfo.buyCount', 0),
          ),
          buyPrice: getRateStr(
            get(item, 'needSealInfo.buyPrice', 0).toFixed(0),
            get(item, 'unSealTotalInfo.buyPrice', 0).toFixed(0),
          ),
        } as CanSealItem;
      });
  }

  public async setHadSealDot(canSealRecordId: string, fundCode: string) {
    const canSealRecord = await SealMsgRecordModel.findById(canSealRecordId);
    if (!canSealRecord) {
      throw new Error('无记录数据');
    }
    const needSealIds = canSealRecord.canSealItemList.find(
      (item) => item.fundCode === fundCode,
    )?.needSealIds;
    const canSealDot = await HadBuyFundDotModel.find({
      _id: {
        $in: needSealIds,
      },
    });
    if (!canSealDot.length) {
      return [];
    }
    canSealDot.forEach((item) => {
      item.sealedAt = new Date();
    });
    await HadBuyFundDotModel.bulkSave(canSealDot);
    return canSealDot;
  }
}
