import { Clock } from 'lucide-react';
import { cn } from '../../lib/utils';

interface QuickTimeSelectorProps {
  onSelectDuration: (minutes: number) => void;
  options?: number[];
  className?: string;
}

const defaultOptions = [15, 30, 45, 60, 90, 120]; // 分钟

export function QuickTimeSelector({ 
  onSelectDuration, 
  options = defaultOptions, 
  className 
}: QuickTimeSelectorProps) {
  const formatDuration = (minutes: number) => {
    if (minutes < 60) {
      return `${minutes}分钟`;
    }
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}小时${mins}分钟` : `${hours}小时`;
  };

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <Clock size={16} className="text-gray-500" />
      <span className="text-sm text-gray-600">快捷时长:</span>
      <div className="flex gap-1">
        {options.map((minutes) => (
          <button
            key={minutes}
            onClick={() => onSelectDuration(minutes)}
            className={cn(
              "px-2 py-1 text-xs rounded border transition-colors",
              "border-gray-300 hover:border-primary-500 hover:bg-primary-50 hover:text-primary-700",
              "focus:outline-none focus:ring-1 focus:ring-primary-500"
            )}
          >
            {formatDuration(minutes)}
          </button>
        ))}
      </div>
    </div>
  );
}