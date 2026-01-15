import { Idea } from '../../types';
import { useAppStore } from '../../store';
import { Trash2 } from 'lucide-react';

interface IdeaCardProps {
  idea: Idea;
}

// 辅助函数：格式化时间显示
function formatIdeaTime(createdAt: number): { time: string; date?: string; relative?: string } {
  const createdDate = new Date(createdAt * 1000);

  if (isNaN(createdDate.getTime())) {
    return { time: '--:--' };
  }

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const createdDay = new Date(createdDate.getFullYear(), createdDate.getMonth(), createdDate.getDate());

  const timeStr = createdDate.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });

  // 如果是今天，只显示时间
  if (createdDay.getTime() === today.getTime()) {
    // 计算相对时间
    const diffMs = now.getTime() - createdDate.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) {
      return { time: timeStr, relative: '刚刚' };
    } else if (diffMins < 60) {
      return { time: timeStr, relative: `${diffMins}分钟前` };
    } else if (diffMins < 1440) {
      const hours = Math.floor(diffMins / 60);
      return { time: timeStr, relative: `${hours}小时前` };
    }

    return { time: timeStr };
  }

  // 如果是昨天
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  if (createdDay.getTime() === yesterday.getTime()) {
    return { time: timeStr, date: '昨天' };
  }

  // 其他日期，显示完整日期
  const dateStr = createdDate.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
  return { time: timeStr, date: dateStr };
}

export function IdeaCard({ idea }: IdeaCardProps) {
  const deleteIdea = useAppStore(state => state.deleteIdea);
  console.log('IdeaCard render:', idea, idea.id, idea.created_at);
  const { time, date, relative } = formatIdeaTime(idea.created_at);

  const handleDelete = async () => {
    try {
      await deleteIdea(idea.id);
    } catch (error) {
      alert('删除失败: ' + error);
    }
  };

  return (
    <div className="card p-4">
      <div className="flex justify-between items-start gap-2">
        <p className="text-gray-800 mb-2 flex-1">{idea.content}</p>
        <button
          onClick={handleDelete}
          className="text-gray-400 hover:text-red-500 transition-colors p-1 rounded hover:bg-red-50"
          title="删除"
        >
          <Trash2 size={16} />
        </button>
      </div>

      {idea.attachments && idea.attachments.length > 0 && (
        <div className="mt-2 flex gap-2 flex-wrap">
          {idea.attachments.map((att, idx) => (
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
          <span>{time}</span>
          {date && <span className="text-gray-400">· {date}</span>}
          {relative && <span className="text-gray-400">· {relative}</span>}
        </div>
        <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded">想法</span>
      </div>
    </div>
  );
}
