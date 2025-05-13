import { ScrewStatus } from '../types/fund';

/**
 * 基于螺丝钉的估值情况，展示md格式的信息
 */
export function getMdFromSrewStatus(status?: ScrewStatus) {
  console.log('getMdFromSrewStatus',status)
  if (!status) {
    return '';
  }
  switch (status) {
    case ScrewStatus.LOW:
      return `<text_tag color='green'>偏低</text_tag>`;
    case ScrewStatus.MIDDLE:
      return `<text_tag color='blue'>正常</text_tag>`;
    case ScrewStatus.HIGH:
      return `<text_tag color='red'>高估</text_tag>`;
    default:
      return `<text_tag color='grey'>--</text_tag>`;
  }
}
