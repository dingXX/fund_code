import dayjs from 'dayjs';
import { FundDotItem } from '../types/fund';
import timezone from 'dayjs/plugin/timezone';

dayjs.extend(timezone);
// // 设置全局时区为东八区（亚洲/上海）
dayjs.tz.setDefault('Asia/Shanghai');

export function getFormatDate(date?: string | dayjs.Dayjs) {
  return dayjs(date).format('YYYY-MM-DD');
}

/**
 *
 * 获取实际交易的日期信息
 */
export function getFundDealDot(
  expectedDate: string,
  fundList: FundDotItem[],
  enableFirstDeal = true,
) {
  const expDate = getFormatDate(expectedDate);

  let actualFundDot = fundList.find((item, idx) => {
    if (item.date === expDate) {
      return true;
    }
    if (
      enableFirstDeal &&
      idx === 0 &&
      dayjs(item.date).isBefore(dayjs(expDate))
    ) {
      return true;
    }
    if (
      fundList[idx + 1]?.date &&
      dayjs(fundList[idx + 1]?.date).isBefore(dayjs(expDate)) &&
      fundList[idx - 1]?.date &&
      dayjs(fundList[idx - 1]?.date).isAfter(dayjs(expDate))
    ) {
      return true;
    }
    return false;
  });

  return actualFundDot;
}
