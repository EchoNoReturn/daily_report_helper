import { DoneTask } from '../../types';
import { useAppStore } from '../../store';
import { Trash2 } from 'lucide-react';

interface TaskCardProps {
  task: DoneTask;
}

// 辅助函数：计算持续时长
function formatDuration(startTime: Date, endTime: Date): string {
  if (isNaN(startTime.getTime()) || isNaN(endTime.getTime())) {
    return '';
  }

  const diffMs = endTime.getTime() - startTime.getTime();
  const diffMins = Math.floor(diffMs / 60000);

  if (diffMins < 1) {
    return '';
  }

  const hours = Math.floor(diffMins / 60);
  const mins = diffMins % 60;

  if (hours > 0 && mins > 0) {
    return `${hours}h ${mins}m`;
  } else if (hours > 0) {
    return `${hours}h`;
  } else {
    return `${mins}m`;
  }
}

// 辅助函数：格式化时间显示（任务专用）
function formatTaskTime(startTime: number, endTime: number, createdAt: number): {
  timeRange: string;
  date?: string;
  duration?: string;
} {
  const startDate = new Date(startTime * 1000);
  const endDate = new Date(endTime * 1000);
  const createdDate = new Date(createdAt * 1000);

  if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
    return { timeRange: '--:-- - --:--' };
  }

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const createdDay = new Date(createdDate.getFullYear(), createdDate.getMonth(), createdDate.getDate());

  const startStr = startDate.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
  const endStr = endDate.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
  const duration = formatDuration(startDate, endDate);

  const timeRange = `${startStr} - ${endStr}`;

  // 如果是今天
  if (createdDay.getTime() === today.getTime()) {
    return { timeRange, duration };
  }

  // 如果是昨天
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  if (createdDay.getTime() === yesterday.getTime()) {
    return { timeRange, date: '昨天', duration };
  }

  // 其他日期
  const dateStr = createdDate.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
  return { timeRange, date: dateStr, duration };
}

export function TaskCard({ task }: TaskCardProps) {
  const deleteTask = useAppStore(state => state.deleteTask);
  const { timeRange, date, duration } = formatTaskTime(task.start_time, task.end_time, task.created_at);

  const handleDelete = async () => {
    try {
      await deleteTask(task.id);
    } catch (error) {
      alert('删除失败: ' + error);
    }
  };

  return (
    <div className="card p-4">
      <div className="flex justify-between items-start mb-2 gap-2">
        <p className="text-gray-800 font-medium flex-1">{task.content}</p>
        <button
          onClick={handleDelete}
          className="text-gray-400 hover:text-red-500 transition-colors p-1 rounded hover:bg-red-50"
          title="删除"
        >
          <Trash2 size={16} />
        </button>
      </div>

      <div className="flex justify-between items-center mb-2">
        <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded whitespace-nowrap">
          {timeRange}
        </span>
        {duration && (
          <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
            {duration}
          </span>
        )}
      </div>

      {task.attachments && task.attachments.length > 0 && (
        <div className="mt-2 flex gap-2 flex-wrap">
          {task.attachments.map((att, idx) => (
            <img
              key={idx}
              src={`file://${att}`}
              className="w-16 h-16 object-cover rounded hover:opacity-80 transition-opacity cursor-pointer"
              alt={`附件 ${idx + 1}`}
              onError={(e) => {
                (e.target as HTMLImageElement).src = '/placeholder.png';
              }}
            />
          ))}
        </div>
      )}

      <div className="text-xs text-gray-500 mt-2 flex justify-between items-center">
        <div className="flex gap-2 items-center">
          {date && <span className="text-gray-400">{date}</span>}
        </div>
        <span className="bg-purple-100 text-purple-800 px-2 py-0.5 rounded">事项</span>
      </div>
    </div>
  );
}
