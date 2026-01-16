import { useState } from 'react';
import { Clock } from 'lucide-react';
import { cn } from '../../lib/utils';

interface TimeInputProps {
  value: string;
  onChange: (value: string) => void;
  label: string;
  className?: string;
}

export function TimeInput({ value, onChange, label, className }: TimeInputProps) {
  const [isFocused, setIsFocused] = useState(false);

  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    onChange(newValue);
  };

  return (
    <label className={cn("flex items-center gap-2 text-sm", className)}>
      <span className="text-gray-700 font-medium">{label}:</span>
      <div className="relative">
        <Clock 
          size={16} 
          className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" 
        />
        <input
          type="time"
          value={value}
          onChange={handleTimeChange}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          className={cn(
            "w-32 pl-9 pr-2 py-1.5 border rounded text-sm transition-colors",
            "focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500",
            isFocused ? "border-primary-500" : "border-gray-300",
            "hover:border-gray-400"
          )}
        />
      </div>
    </label>
  );
}