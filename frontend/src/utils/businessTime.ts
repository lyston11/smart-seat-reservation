import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';

dayjs.extend(utc);
dayjs.extend(timezone);

export const BUSINESS_TIME_ZONE = 'Asia/Shanghai';

export function getBusinessNow() {
  return dayjs().tz(BUSINESS_TIME_ZONE);
}

export function toBusinessTime(value: Date | string | number) {
  return dayjs(value).tz(BUSINESS_TIME_ZONE);
}

export function parseBusinessDateTime(slotDate: string, time: string) {
  return dayjs.tz(`${slotDate} ${time.slice(0, 5)}`, 'YYYY-MM-DD HH:mm', BUSINESS_TIME_ZONE);
}
