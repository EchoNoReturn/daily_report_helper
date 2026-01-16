import { useEffect } from 'react';
import { TimeInput } from './TimeInput';
import { QuickTimeSelector } from './QuickTimeSelector';
import { DurationDisplay } from './DurationDisplay';

interface TimeRangePickerProps {
  startTime: string;
  endTime: string;
  onStartTimeChange: (time: string) => void;
  onEndTimeChange: (time: string) => void;
  quickOptions?: number[];
  showDuration?: boolean;
  className?: string;
}

export function TimeRangePicker({
  startTime,
  endTime,
  onStartTimeChange,
  onEndTimeChange,
  quickOptions = [15, 30, 60, 90, 120],
  showDuration = true,
  className
}: TimeRangePickerProps) {
  // 获取智能默认时间
  const getSmartDefaultTime = () => {
    const now = new Date();
    const currentHour = now.getHours();
    
    // 工作时间内：默认1小时前到现在
    if (currentHour >= 9 && currentHour <= 18) {
      const end = new Date(now);
      const start = new Date(now.getTime() - 60 * 60 * 1000); // 1小时前
      
      return {
        start: formatTime(start),
        end: formatTime(end)
      };
    }
    
    // 非工作时间：默认最近的9-10点
    return {
      start: '09:00',
      end: '10:00'
    };
  };

  const formatTime = (date: Date) => {
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
  };

  // 初始化智能时间
  useEffect(() => {
    if (!startTime || !endTime) {
      const { start, end } = getSmartDefaultTime();
      if (!startTime) onStartTimeChange(start);
      if (!endTime) onEndTimeChange(end);
    }
  }, [startTime, endTime, onStartTimeChange, onEndTimeChange]);

  const handleQuickDuration = (minutes: number) => {
    const now = new Date();
    const end = new Date(now);
    const start = new Date(now.getTime() - minutes * 60 * 1000);
    
    onStartTimeChange(formatTime(start));
    onEndTimeChange(formatTime(end));
  };

  return (
    <div className={`space-y-3 ${className}`}>
      <div className="flex gap-4 items-center flex-wrap">
        <TimeInput
          value={startTime}
          onChange={onStartTimeChange}
          label="开始"
        />
        
        <TimeInput
          value={endTime}
          onChange={onEndTimeChange}
          label="结束"
        />
      </div>

      <QuickTimeSelector
        onSelectDuration={handleQuickDuration}
        options={quickOptions}
      />

      {showDuration && startTime && endTime && (
        <DurationDisplay
          startTime={startTime}
          endTime={endTime}
        />
      )}
    </div>
  );
}