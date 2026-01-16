import { Clock, AlertCircle } from 'lucide-react';
import { cn } from '../../lib/utils';
import { differenceInMinutes } from 'date-fns';

interface DurationDisplayProps {
  startTime: string;
  endTime: string;
  className?: string;
}

export function DurationDisplay({ startTime, endTime, className }: DurationDisplayProps) {
  if (!startTime || !endTime) {
    return null;
  }

  // 解析时间字符串
  const [startHour, startMin] = startTime.split(':').map(Number);
  const [endHour, endMin] = endTime.split(':').map(Number);
  
  const today = new Date();
  const start = new Date(today.getFullYear(), today.getMonth(), today.getDate(), startHour, startMin);
  let end = new Date(today.getFullYear(), today.getMonth(), today.getDate(), endHour, endMin);

  // 处理跨天情况
  const isNextDay = end < start;
  if (isNextDay) {
    end.setDate(end.getDate() + 1);
  }

  const durationMinutes = differenceInMinutes(end, start);
  const hours = Math.floor(durationMinutes / 60);
  const minutes = durationMinutes % 60;

  const formatDuration = () => {
    if (hours === 0) {
      return `${minutes}分钟`;
    }
    return minutes > 0 ? `${hours}小时${minutes}分钟` : `${hours}小时`;
  };

  return (
    <div className={cn("flex items-center gap-2 text-sm", className)}>
      <Clock size={14} className="text-gray-500" />
      <span className="text-gray-600">时长: </span>
      <span className="font-medium text-gray-800">{formatDuration()}</span>
      {isNextDay && (
        <div className="flex items-center gap-1 text-amber-600">
          <AlertCircle size={12} />
          <span className="text-xs">跨天</span>
        </div>
      )}
    </div>
  );
}