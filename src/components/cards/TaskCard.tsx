import { DoneTask } from '../../types';

interface TaskCardProps {
  task: DoneTask;
}

export function TaskCard({ task }: TaskCardProps) {
  const startDate = new Date(task.startTime);
  const endDate = new Date(task.endTime);

  // 防护 Invalid Date
  const startTime = isNaN(startDate.getTime())
    ? '--:--'
    : startDate.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
  const endTime = isNaN(endDate.getTime())
    ? '--:--'
    : endDate.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });

  return (
    <div className="card p-4">
      <div className="flex justify-between items-start mb-2">
        <p className="text-gray-800 font-medium flex-1">{task.content}</p>
        <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded whitespace-nowrap ml-2">
          {startTime} - {endTime}
        </span>
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

      <div className="text-xs text-gray-500 mt-2">
        <span className="bg-purple-100 text-purple-800 px-2 py-0.5 rounded">事项</span>
      </div>
    </div>
  );
}
