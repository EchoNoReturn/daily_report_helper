import { Idea } from '../../types';

interface IdeaCardProps {
  idea: Idea;
}

export function IdeaCard({ idea }: IdeaCardProps) {
  const createdDate = new Date(idea.createdAt);

  // 防护 Invalid Date
  const time = isNaN(createdDate.getTime())
    ? '--:--'
    : createdDate.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });

  return (
    <div className="card p-4">
      <p className="text-gray-800 mb-2">{idea.content}</p>

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

      <div className="text-xs text-gray-500 mt-2 flex justify-between">
        <span>{time}</span>
        <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded">想法</span>
      </div>
    </div>
  );
}
