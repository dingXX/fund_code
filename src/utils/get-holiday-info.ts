import { Dayjs } from 'dayjs';

export async function checkIsDealDay(day: Dayjs) {
  try {
    const res = await fetch(
      `http://timor.tech/api/holiday/info/${day.format('YYYY-MM-DD')}`,
    );
    const text = await res.json();
    return text.type.type === 0;
  } catch (error) {
    return true;
  }
}
