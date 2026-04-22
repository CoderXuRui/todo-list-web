import { format, isToday, isTomorrow, isYesterday, parseISO } from 'date-fns';

const weekDays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];

export const formatDate = (dateString: string | null): string => {
  if (!dateString) return '';

  const date = parseISO(dateString);

  if (isToday(date)) return '今天';
  if (isTomorrow(date)) return '明天';
  if (isYesterday(date)) return '昨天';

  return format(date, 'MM/dd');
};

export const formatFullDate = (dateString: string): string => {
  const date = parseISO(dateString);
  const weekDay = weekDays[date.getDay()];
  return `${format(date, 'yyyy年MM月dd日')} ${weekDay} ${format(date, 'HH:mm')}`;
};

export const getWeekDay = (dateString: string): string => {
  const date = parseISO(dateString);
  return weekDays[date.getDay()];
};

export const getPriorityLabel = (priority: string): string => {
  const labels: Record<string, string> = {
    high: '高',
    medium: '中',
    low: '低',
  };
  return labels[priority] || priority;
};

export const getPriorityColor = (priority: string): string => {
  const colors: Record<string, string> = {
    high: '#FF8A8A',
    medium: '#FFD93D',
    low: '#A8E6CF',
  };
  return colors[priority] || '#E0E0E0';
};
