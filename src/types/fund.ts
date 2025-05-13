import { IsString, IsOptional } from 'class-validator';

export type BuyFund = {
  name?: string;
  fundCode: string;
  nowDate: string;
  lastWeekDate: string;
  nowDatePrice: {
    date: string;
    price: number;
  };
  priceChange: number;
  lastWeekDatePrice: {
    date: string;
    price: number;
  };
  needBuyPrice: number;
  baseNeedBuyPrice: number;
  nowPriceCountRate: string;
};
export type FundItem = {
  name: string;
  fundCode: string;
  buyBasePrice: number;
  alipaysProductId: string;
  /**
   * 预计收益 - 0.1
   */
  defaultChangeRate?: number;
  /**
   * 估值走势图 - 图片链接
   */
  preFundPriceImg?: string;
  /**
   * 螺丝钉星级的outside_fund
   */
  screwFundId?: string;
};
export type FundDotItem = {
  date: string;
  price: number;
};

export class ManualHadBuyReq {
  @IsString()
  recordId: string;
  @IsOptional()
  @IsString()
  buyDate?: string;
}

export class CanSealReq {
  @IsString()
  fundCode: string;
  @IsString()
  buyTime?: string;
  @IsString()
  changeRate: string;
}

export class HadSealReq {
  @IsString()
  recordId: string;
  @IsString()
  fundCode: string;
}
export type hadBuyParams = {
  fundCode: string;
  buyDate: string;

  buyPrice: number;
};
export type HadBuyItem = hadBuyParams & {
  buyCount: number;
  fundPrice: number;
};

export type CanSealItem = FundItem & {
  sealDotLen: string;
  sealPrice: string;
  buyPrice: string;
  sealIncome: string;
  sealIncomeRate: string;
  sealCountRate: string;
  changeRate: number;
  buyTime: string;
  needSealIds: string[];
};

export enum ScrewStatus {
  /**
   * 低估，持续定投
   */
  LOW = '1',
  /**
   * 正常，停止定投，等待卖出
   */
  MIDDLE = '2',
  /**
   * 高估，可卖出
   */
  HIGH = '3',
}

export type ScrewData = {
  /**
   * 对应估值表
   */
  statusMap: Record<string,ScrewStatus>;
  /**
   * 今日星级
   */
  grade: string;
}