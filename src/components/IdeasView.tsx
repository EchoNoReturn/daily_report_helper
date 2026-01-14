import { useState, useEffect } from 'react';
import { useAppStore } from '../store';
import { IdeaCard } from './cards/IdeaCard';
import { AttachmentButton } from './AttachmentButton';
import { Plus, Loader2 } from 'lucide-react';

export function IdeasView() {
  const { records, addIdea, loadTodayRecords, loading } = useAppStore();
  const [content, setContent] = useState('');
  const [attachments, setAttachments] = useState<string[]>([]);
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    loadTodayRecords();
  }, []);

  const handleCreate = async () => {
    if (!content.trim()) {
      alert('请输入想法内容');
      return;
    }

    setIsCreating(true);
    try {
      await addIdea(content, attachments);
      setContent('');
      setAttachments([]);
      alert('想法已保存！');
    } catch (error) {
      alert('保存失败: ' + error);
    } finally {
      setIsCreating(false);
    }
  };

  const handleAddAttachments = (paths: string[]) => {
    setAttachments(prev => [...prev, ...paths]);
  };

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold text-gray-800">💡 随手记 - 想法</h2>

      {/* 创建卡片 */}
      <div className="card p-4 border-2 border-dashed border-gray-300 hover:border-primary-500 transition-colors">
        <textarea
          value={content}
          onChange={e => setContent(e.target.value)}
          placeholder="记录你的想法、灵感或待办事项..."
          className="textarea-field mb-3"
          rows={3}
          disabled={isCreating}
        />

        <div className="flex gap-2 items-center flex-wrap">
          <AttachmentButton onAdd={handleAddAttachments} />

          {attachments.length > 0 && (
            <span className="text-sm text-gray-600">
              已选择 {attachments.length} 个附件
            </span>
          )}

          <div className="flex-1" />

          <button
            onClick={handleCreate}
            disabled={isCreating || !content.trim()}
            className={`
              btn-primary flex items-center gap-2
              ${(!content.trim() || isCreating) ? 'opacity-50 cursor-not-allowed' : ''}
            `}
          >
            {isCreating ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                保存中...
              </>
            ) : (
              <>
                <Plus size={16} />
                创建想法
              </>
            )}
          </button>
        </div>

        {attachments.length > 0 && (
          <div className="mt-3 flex gap-2 flex-wrap">
            {attachments.map((att, idx) => (
              <div key={idx} className="relative group">
                <img
                  src={`file://${att}`}
                  className="w-16 h-16 object-cover rounded border"
                  alt={`附件 ${idx + 1}`}
                />
                <button
                  onClick={() => setAttachments(prev => prev.filter((_, i) => i !== idx))}
                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 想法列表 */}
      <div className="space-y-3">
        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 size={24} className="animate-spin text-gray-400" />
          </div>
        ) : records.ideas.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p>今天还没有记录想法</p>
            <p className="text-sm mt-1">在上方输入框中添加你的想法吧</p>
          </div>
        ) : (
          records.ideas.map(idea => (
            <IdeaCard key={idea.id} idea={idea} />
          ))
        )}
      </div>
    </div>
  );
}
