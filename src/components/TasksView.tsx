import { useState, useEffect } from 'react';
import { useAppStore } from '../store';
import { TaskCard } from './cards/TaskCard';
import { AttachmentButton } from './AttachmentButton';
import { Plus, Loader2 } from 'lucide-react';

export function TasksView() {
  const { records, addTask, loadTodayRecords, loading } = useAppStore();
  const [content, setContent] = useState('');
  const [startTime, setStartTime] = useState('08:00');
  const [endTime, setEndTime] = useState(() => {
    const now = new Date();
    return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  });
  const [attachments, setAttachments] = useState<string[]>([]);
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    loadTodayRecords();
  }, []);

  const handleCreate = async () => {
    if (!content.trim()) {
      alert('请输入事项内容');
      return;
    }

    setIsCreating(true);
    try {
      // 使用更可靠的方式创建时间对象
      const today = new Date();
      const year = today.getFullYear();
      const month = today.getMonth();
      const day = today.getDate();

      // 解析时间字符串 (HH:MM)
      const [startHour, startMin] = startTime.split(':').map(Number);
      const [endHour, endMin] = endTime.split(':').map(Number);

      const start = new Date(year, month, day, startHour, startMin, 0);
      const end = new Date(year, month, day, endHour, endMin, 0);

      // 处理跨天的情况（如果结束时间小于开始时间，假设是第二天）
      if (end < start) {
        end.setDate(end.getDate() + 1);
      }

      // 验证日期有效性
      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        throw new Error('时间格式无效');
      }

      // 转换为 Unix 时间戳（秒）
      const startTimestamp = Math.floor(start.getTime() / 1000);
      const endTimestamp = Math.floor(end.getTime() / 1000);

      await addTask(
        content,
        startTimestamp,
        endTimestamp,
        attachments
      );

      setContent('');
      setAttachments([]);
      alert('事项已保存！');
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
      <h2 className="text-2xl font-bold text-gray-800">✅ 随手记 - 已做事项</h2>

      {/* 创建卡片 */}
      <div className="card p-4 border-2 border-dashed border-gray-300 hover:border-primary-500 transition-colors">
        <textarea
          value={content}
          onChange={e => setContent(e.target.value)}
          placeholder="记录你完成的工作或任务..."
          className="textarea-field mb-3"
          rows={2}
          disabled={isCreating}
        />

        <div className="flex gap-3 items-center flex-wrap mb-3">
          <label className="flex items-center gap-2 text-sm">
            <span className="text-gray-700 font-medium">开始:</span>
            <input
              type="time"
              value={startTime}
              onChange={e => setStartTime(e.target.value)}
              className="input-field !w-auto"
            />
          </label>

          <label className="flex items-center gap-2 text-sm">
            <span className="text-gray-700 font-medium">结束:</span>
            <input
              type="time"
              value={endTime}
              onChange={e => setEndTime(e.target.value)}
              className="input-field !w-auto"
            />
          </label>
        </div>

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
                创建事项
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

      {/* 事项列表 */}
      <div className="space-y-3">
        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 size={24} className="animate-spin text-gray-400" />
          </div>
        ) : records.tasks.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p>今天还没有记录事项</p>
            <p className="text-sm mt-1">在上方输入框中添加你的工作内容</p>
          </div>
        ) : (
          records.tasks.map(task => (
            <TaskCard key={task.id} task={task} />
          ))
        )}
      </div>
    </div>
  );
}
