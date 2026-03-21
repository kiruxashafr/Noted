import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/ru';

dayjs.extend(relativeTime);
dayjs.locale('ru');

export function useTimeAgo() {
  const format = (date: string | Date | number) => {
    return dayjs(date).fromNow();
  };

  return { format };
}