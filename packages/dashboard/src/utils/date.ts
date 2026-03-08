import dayjs from 'dayjs';

export function getToday(): string {
  return dayjs().format('YYYY-MM-DD');
}

export function getMonthStart(): string {
  return dayjs().startOf('month').format('YYYY-MM-DD');
}

export function getMonthEnd(): string {
  return dayjs().endOf('month').format('YYYY-MM-DD');
}

export function getLastNDays(n: number): { startDate: string; endDate: string } {
  return {
    startDate: dayjs().subtract(n, 'day').format('YYYY-MM-DD'),
    endDate: dayjs().format('YYYY-MM-DD'),
  };
}

export function getTimeAgo(date: string): string {
  const now = dayjs();
  const target = dayjs(date);
  const diffMinutes = now.diff(target, 'minute');

  if (diffMinutes < 1) return '방금 전';
  if (diffMinutes < 60) return `${diffMinutes}분 전`;

  const diffHours = now.diff(target, 'hour');
  if (diffHours < 24) return `${diffHours}시간 전`;

  const diffDays = now.diff(target, 'day');
  return `${diffDays}일 전`;
}
