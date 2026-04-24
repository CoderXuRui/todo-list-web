import { format, isToday, isTomorrow, isYesterday, parseISO } from 'date-fns';

export const formatDate = (dateString: string | null): string => {
  if (!dateString) return '';

  const date = parseISO(dateString);

  if (isToday(date)) return '今天';
  if (isTomorrow(date)) return '明天';
  if (isYesterday(date)) return '昨天';

  return format(date, 'MM/dd');
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
