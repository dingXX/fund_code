import { FundItem } from '../types/fund';

// 螺丝钉的星级接口
// https://danjuanfunds.com/djapi/fundx/base/vip/valuation/show/detail?source=lsd

export const buyFundList: Array<FundItem> = [
  {
    name: '易方达恒生科技ETF',
    fundCode: '013308',
    buyBasePrice: 200,
    alipaysProductId: '20220124000230030000000000089935',
    defaultChangeRate: 0.2,
    preFundPriceImg: 'https://j4.dfcfw.com/charts/pic6/013308.png',
  },
  {
    name: '南方中正全指证券ETF',
    fundCode: '004069',
    buyBasePrice: 200,
    alipaysProductId: '20170120000230030000000000011643',
    defaultChangeRate: 0.2,
    preFundPriceImg: 'https://j4.dfcfw.com/charts/pic6/004069.png',
    screwFundId: '004069',
  },
  {
    name: '易方达消费行业股票',
    fundCode: '110022',
    buyBasePrice: 200,
    defaultChangeRate: 0.15,

    alipaysProductId: '20150718000230030000000000001678',
    preFundPriceImg:
      'https://image.sinajs.cn/newchart/v5/fundpre/min_s/110022.gif',
    screwFundId: '501090',
  },
  {
    name: '广发纳斯达克100ETF',
    fundCode: '006479',
    buyBasePrice: 200,
    alipaysProductId: '20181024000230030000000000015431',
    screwFundId: '040046',
  },
  {
    name: '天弘标普500',
    fundCode: '007722',
    buyBasePrice: 200,
    alipaysProductId: '20190912000230030000000000029639',
    screwFundId: '050025',
  },
];

export const getFundInfo = (fundCode: string) => {
  return buyFundList.find((item) => item.fundCode === fundCode);
};
