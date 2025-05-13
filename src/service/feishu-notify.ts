import { Injectable } from '@nestjs/common';
import {
  BuyFund,
  CanSealItem,
  FundItem,
  HadBuyItem,
  ScrewData,
} from '../types/fund';
import { getFormatDate } from '../utils/deal-date';
import { flatten } from 'lodash';
import QueryString from 'qs';
import BuyMsgRecordModel from '../model/buy-msg-record';
import dayjs from 'dayjs';
import SealMsgRecordModel from '../model/seal-msg-record';
import { getMdFromSrewStatus } from '../utils/get-screw-info';
import axios from 'axios';
@Injectable()
export default class FeiShuNotifyService {
  private getFundLink(
    item: Pick<FundItem, 'alipaysProductId' | 'name' | 'fundCode'>,
    isSeal?: boolean,
  ) {
    return `[${item.name || item.fundCode}](alipays://platformapi/startApp?appId=20000793${
      isSeal
        ? ''
        : `&url=%2Fwww%2Fdetail.html%3FproductId%3D${item.alipaysProductId}`
    })`;
  }
  public async sendSealMessage(
    canSealItem: CanSealItem[],
    origin: string,
    screwData?: ScrewData,
  ) {
    const recordItem = await SealMsgRecordModel.create({
      canSealItemList: canSealItem,
      nowDate: getFormatDate(dayjs()),
      hadSeal: false,
    });
    const msg = {
      msg_type: 'interactive',

      card: {
        elements: [
          {
            tag: 'markdown',
            content: `<at id=all></at> **存在可卖出基金，请及时操作** | 今日星级 ${screwData?.grade || '--'}`,
          },
          ...flatten(
            canSealItem.map((item) => {
              return [
                {
                  tag: 'div',
                  text: {
                    tag: 'lark_md',
                    content: `**${this.getFundLink(item, true)}** | <font color="grey">${item.fundCode}</font> ${
                      item.preFundPriceImg
                        ? `| [查看实时估值](${item.preFundPriceImg})`
                        : ''
                    } | ${
                      item.screwFundId
                        ? getMdFromSrewStatus(
                            screwData?.statusMap?.[item.screwFundId],
                          )
                        : ''
                    } | [PC详情](https://fund.eastmoney.com/${
                      item.fundCode
                    }.html) \n 具体细节请看: [查看详情](${origin}/seal/manual-check-can-seal?${QueryString.stringify(
                      {
                        fundCode: item.fundCode,
                        buyTime: item.buyTime,
                        changeRate: item.changeRate,
                        dxx: 1,
                      },
                    )})`,
                  },
                  extra: {
                    tag: 'button',
                    text: {
                      tag: 'lark_md',
                      content: `已卖出`,
                    },
                    type: 'primary',
                    multi_url: {
                      url: `${origin}/seal/set-had-seal?recordId=${recordItem._id}&fundCode=${item.fundCode}&dxx=1`,
                    },
                  },
                },
                {
                  tag: 'div',
                  fields: [
                    {
                      is_short: true,
                      text: {
                        tag: 'lark_md',
                        content: `**卖出金额**\n**<font color="red">${item.sealPrice}</font>**`,
                      },
                    },
                    {
                      is_short: true,
                      text: {
                        tag: 'lark_md',
                        content: `**预计收益**\n**<font color="green">${item.sealIncome} （${item.sealIncomeRate}）</font>**`,
                      },
                    },
                  ],
                },
                {
                  tag: 'markdown',
                  content: `**买入金额**:  ${item.buyPrice} 元\n**卖出次数**:  ${item.sealDotLen} 次 \n**卖出份额**:  ${item.sealCountRate} `,
                },
                {
                  tag: 'hr',
                },
              ];
            }),
          ),
        ],
        header: {
          template: 'red',
          title: {
            content: `暴富卖出提醒 - ${getFormatDate()} `,
            tag: 'plain_text',
          },
        },
      },
    };
    return this.sendMessage(msg);
  }

  /**
   * 将每次发送的买入消息后，记录下来，方便后面查看
   * @param buyList
   * @returns
   */
  public async setNeedBuyRecord(buyList: (BuyFund & FundItem)[]) {
    const needBuyList = buyList.map((item) => {
      return {
        fundCode: item.fundCode,
        buyDate: item.nowDate,
        buyPrice: Math.floor(item.needBuyPrice),
      };
    });
    const recordItem = await BuyMsgRecordModel.create({
      needBuyList,
      nowDate: getFormatDate(dayjs()),
      hadBuy: false,
    });
    return recordItem._id;
  }

  public async sendBuyMessage(
    buyFundList: (BuyFund & FundItem)[],
    originUrl: string,
    screwData?: ScrewData,
  ) {
    const recordId = await this.setNeedBuyRecord(buyFundList);
    const setHadBuyUrl = `${originUrl}/manual-set-had-buy?recordId=${recordId}&dxx=1`;
    const msg = {
      msg_type: 'interactive',

      card: {
        elements: [
          {
            tag: 'div',
            text: {
              content: `今日定投消息 <at id=all></at> | 今日星级 ${screwData?.grade || '--'}`,
              tag: 'lark_md',
            },
          },
          {
            tag: 'column_set',
            flex_mode: 'none',
            background_style: 'grey',
            columns: [
              {
                tag: 'column',
                width: 'weighted',
                weight: 1,
                vertical_align: 'top',
                elements: [
                  {
                    tag: 'markdown',
                    content: '**基金名称**',
                    text_align: 'center',
                  },
                ],
              },
              {
                tag: 'column',
                width: 'weighted',
                weight: 1,
                vertical_align: 'top',
                elements: [
                  {
                    tag: 'markdown',
                    content: '**本周涨跌幅**',
                    text_align: 'center',
                  },
                ],
              },
              {
                tag: 'column',
                width: 'weighted',
                weight: 1,
                vertical_align: 'top',
                elements: [
                  {
                    tag: 'markdown',
                    content: '**操作金额**',
                    text_align: 'center',
                  },
                ],
              },
              {
                tag: 'column',
                width: 'weighted',
                weight: 1,
                vertical_align: 'top',
                elements: [
                  {
                    tag: 'markdown',
                    content: '**操作说明**',
                    text_align: 'center',
                  },
                ],
              },
            ],
          },

          ...buyFundList.map((item) => {
            return {
              tag: 'column_set',
              flex_mode: 'none',
              background_style: 'default',
              columns: [
                {
                  tag: 'column',
                  width: 'weighted',
                  weight: 1,
                  vertical_align: 'top',
                  elements: [
                    {
                      tag: 'markdown',
                      content: `${this.getFundLink(item)}`,
                      text_align: 'center',
                    },
                  ],
                },
                {
                  tag: 'column',
                  width: 'weighted',
                  weight: 1,
                  vertical_align: 'top',
                  elements: [
                    {
                      tag: 'markdown',
                      content: `<font color='${item.priceChange > 0 ? 'red' : 'green'}'>${
                        item.priceChange > 0 ? '↑' : '↓'
                      }${Math.abs(item.priceChange).toFixed(2)}%</font>${
                        item.screwFundId
                          ? getMdFromSrewStatus(
                              screwData?.statusMap?.[item.screwFundId],
                            )
                          : '--'
                      }`,
                      text_align: 'center',
                    },
                  ],
                },
                {
                  tag: 'column',
                  width: 'weighted',
                  weight: 1,
                  vertical_align: 'top',
                  elements: [
                    {
                      tag: 'markdown',
                      content: `${item.needBuyPrice.toFixed(0)}${
                        item.baseNeedBuyPrice.toFixed(0) ===
                        item.needBuyPrice.toFixed(0)
                          ? ''
                          : ` / <font color="grey">${item.baseNeedBuyPrice.toFixed(0)}</font>`
                      }`,
                      text_align: 'center',
                    },
                  ],
                },
                {
                  tag: 'column',
                  width: 'weighted',
                  weight: 1,
                  vertical_align: 'top',
                  elements: [
                    {
                      tag: 'markdown',
                      content: `${item.nowPriceCountRate}`,
                      text_align: 'center',
                    },
                  ],
                },
              ],
            };
          }),
          {
            actions: [
              {
                tag: 'button',
                text: {
                  content: '已完成定投',
                  tag: 'lark_md',
                },
                url: setHadBuyUrl,
                type: 'default',
                value: {},
              },
            ],
            tag: 'action',
          },
          {
            tag: 'note',
            elements: [
              {
                tag: 'lark_md',
                content: `如实际购买实际晚于15:00，请手动设置实际定投时间 ${setHadBuyUrl}&buyDate=YYYY-MM-DD \n **操作说明**: 指历史购买净值低于当前的净值的比率（数值大，表示当前处于高位）`,
              },
            ],
          },
        ],
        header: {
          template: 'blue',
          title: {
            content: `暴富基金 - ${getFormatDate()}`,
            tag: 'plain_text',
          },
        },
      },
    };
    return this.sendMessage(msg);
  }
  public async sendHadManualSetDealMessage(
    dealDotList: (HadBuyItem | boolean)[],
    date: string,
  ) {
    const allHadBUyDot = dealDotList.every((item) => item === true);
    if (allHadBUyDot) {
      return;
    }
    const allSet = dealDotList.every((item) => typeof item === 'object');
    const msg = {
      msg_type: 'text',
      content: {
        text: `${date} ${allSet ? '定投已全部设置完成' : '[警告]定投部分未设置完成'}`,
      },
    };
    this.sendMessage(msg);
  }
  public async sendMessage(msg: Object) {
    const res = await axios(
      'https://open.larkoffice.com/open-apis/bot/v2/hook/19db6dcf-f753-4348-9c0a-a0c32fcc1b49',
      {
        method: 'POST',
        data: JSON.stringify(msg),

        headers: {
          'Content-Type': 'application/json',
        },
      },
    );

    return {
      res: await res.data,
    };
  }
}
