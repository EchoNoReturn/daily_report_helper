import { useState, useEffect } from 'react';
import { useAppStore } from '../store';
import { Prompt } from '../types';
import { Plus, Edit2, Trash2, Save, X, Loader2 } from 'lucide-react';

export function PromptsView() {
  const { prompts, loadPrompts, addPrompt, updatePrompt, deletePrompt, loading } = useAppStore();
  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({ name: '', content: '' });

  useEffect(() => {
    loadPrompts();
  }, []);

  const handleCreate = async () => {
    if (!formData.name.trim() || !formData.content.trim()) {
      alert('请填写提示词名称和内容');
      return;
    }

    try {
      await addPrompt(formData.name, formData.content);
      setFormData({ name: '', content: '' });
      setIsCreating(false);
    } catch (error) {
      alert('创建失败: ' + error);
    }
  };

  const handleUpdate = async (id: number) => {
    if (!formData.name.trim() || !formData.content.trim()) {
      alert('请填写提示词名称和内容');
      return;
    }

    try {
      await updatePrompt(id, formData.name, formData.content);
      setEditingId(null);
      setFormData({ name: '', content: '' });
    } catch (error) {
      alert('更新失败: ' + error);
    }
  };

  const handleDelete = async (id: number, name: string) => {
    if (confirm(`确定要删除提示词"${name}"吗？`)) {
      try {
        await deletePrompt(id);
      } catch (error) {
        alert('删除失败: ' + error);
      }
    }
  };

  const startEdit = (prompt: Prompt) => {
    setEditingId(prompt.id);
    setFormData({ name: prompt.name, content: prompt.content });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setIsCreating(false);
    setFormData({ name: '', content: '' });
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">📝 提示词管理</h2>
        <button
          onClick={() => setIsCreating(true)}
          disabled={isCreating}
          className="btn-primary flex items-center gap-2"
        >
          <Plus size={16} />
          新建提示词
        </button>
      </div>

      {/* 创建/编辑表单 */}
      {(isCreating || editingId !== null) && (
        <div className="card p-4 border-2 border-blue-200 bg-blue-50">
          <h3 className="font-medium text-gray-800 mb-3">
            {isCreating ? '新建提示词' : '编辑提示词'}
          </h3>
          
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                名称
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="提示词名称"
                className="input-field"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                内容
              </label>
              <textarea
                value={formData.content}
                onChange={e => setFormData(prev => ({ ...prev, content: e.target.value }))}
                placeholder="提示词内容..."
                className="textarea-field"
                rows={6}
              />
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => isCreating ? handleCreate() : handleUpdate(editingId!)}
                className="btn-primary flex items-center gap-2"
              >
                <Save size={16} />
                {isCreating ? '创建' : '保存'}
              </button>
              <button
                onClick={cancelEdit}
                className="btn-secondary flex items-center gap-2"
              >
                <X size={16} />
                取消
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 提示词列表 */}
      <div className="space-y-3">
        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 size={24} className="animate-spin text-gray-400" />
          </div>
        ) : prompts.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p>还没有创建提示词</p>
            <p className="text-sm mt-1">点击上方按钮创建第一个提示词</p>
          </div>
        ) : (
          prompts.map(prompt => (
            <div key={prompt.id} className="card p-4">
              {editingId === prompt.id ? null : (
                <>
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-medium text-gray-800 text-lg">{prompt.name}</h3>
                    <div className="flex gap-1">
                      <button
                        onClick={() => startEdit(prompt)}
                        className="text-gray-400 hover:text-blue-500 transition-colors p-1 rounded hover:bg-blue-50"
                        title="编辑"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        onClick={() => handleDelete(prompt.id, prompt.name)}
                        className="text-gray-400 hover:text-red-500 transition-colors p-1 rounded hover:bg-red-50"
                        title="删除"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>

                  <div className="text-gray-600 whitespace-pre-wrap bg-gray-50 p-3 rounded">
                    {prompt.content}
                  </div>

                  <div className="text-xs text-gray-500 mt-2">
                    创建时间: {new Date(prompt.createdAt * 1000).toLocaleString('zh-CN')}
                    {prompt.updatedAt !== prompt.createdAt && (
                      <>
                        {' · '}
                        更新时间: {new Date(prompt.updatedAt * 1000).toLocaleString('zh-CN')}
                      </>
                    )}
                  </div>
                </>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}