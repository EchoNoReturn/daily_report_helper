import { useState, useEffect } from 'react';
import { useAppStore } from '../store';
import { Save, Loader2, ExternalLink } from 'lucide-react';

export function SettingsView() {
  const { apiConfig, saveApiConfig } = useAppStore();
  
  // 确保配置始终是受控的，使用默认值防止 undefined
  const [config, setConfig] = useState(() => ({
    apiKey: '',
    apiUrl: 'https://api.openai.com/v1',
    model: 'gpt-4'
  }));
  
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // 同步 apiConfig 到本地状态
  useEffect(() => {
    if (apiConfig) {
      setConfig({
        apiKey: apiConfig.apiKey || '',
        apiUrl: apiConfig.apiUrl || 'https://api.openai.com/v1',
        model: apiConfig.model || 'gpt-4'
      });
    }
  }, [apiConfig]);

  const handleSave = async () => {
    if (!config.apiKey.trim() || !config.apiUrl.trim()) {
      setMessage({ type: 'error', text: '请填写 API Key 和 API URL' });
      return;
    }

    setIsSaving(true);
    try {
      await saveApiConfig(config);
      setMessage({ type: 'success', text: '配置已保存！' });
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      setMessage({ type: 'error', text: '保存失败: ' + error });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-4 max-w-2xl">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">⚙️ AI 接口配置</h2>
        <a
          href="https://platform.openai.com/docs/api-reference"
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-primary-600 hover:text-primary-700 flex items-center gap-1"
        >
          API 文档
          <ExternalLink size={14} />
        </a>
      </div>

      <div className="card p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            API URL
          </label>
          <input
            type="text"
            value={config.apiUrl || ''}
            onChange={e => setConfig({ ...config, apiUrl: e.target.value })}
            placeholder="https://api.openai.com/v1"
            className="input-field"
          />
          <p className="text-xs text-gray-500 mt-1">
            支持 OpenAI 兼容的 API 接口
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            API Key
          </label>
          <input
            type="password"
            value={config.apiKey || ''}
            onChange={e => setConfig({ ...config, apiKey: e.target.value })}
            placeholder="sk-..."
            className="input-field"
          />
          <p className="text-xs text-gray-500 mt-1">
            您的 API 密钥，不会明文存储
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            模型名称
          </label>
          <input
            type="text"
            value={config.model || ''}
            onChange={e => setConfig({ ...config, model: e.target.value })}
            placeholder="gpt-4"
            className="input-field"
          />
          <p className="text-xs text-gray-500 mt-1">
            例如: gpt-4, gpt-3.5-turbo, 或其他兼容模型
          </p>
        </div>

        <div className="flex gap-2 items-center pt-2">
          <button
            onClick={handleSave}
            disabled={isSaving}
            className={`
              btn-primary flex items-center gap-2
              ${isSaving ? 'opacity-70 cursor-not-allowed' : ''}
            `}
          >
            {isSaving ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                保存中...
              </>
            ) : (
              <>
                <Save size={16} />
                保存配置
              </>
            )}
          </button>

          {message && (
            <div className={`
              text-sm px-3 py-1 rounded
              ${message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}
            `}>
              {message.text}
            </div>
          )}
        </div>
      </div>

      {/* 配置状态 */}
      {apiConfig && (
        <div className="card p-4 bg-green-50 border border-green-200">
          <h3 className="font-medium text-green-900 mb-2">✅ 当前配置状态</h3>
          <div className="text-sm text-green-800 space-y-1">
            <div><strong>API URL:</strong> {apiConfig.apiUrl}</div>
            <div><strong>模型:</strong> {apiConfig.model}</div>
            <div><strong>API Key:</strong> {apiConfig.apiKey ? '已配置' : '未配置'}</div>
          </div>
        </div>
      )}

      {/* 使用说明 */}
      <div className="card p-4 bg-blue-50 border border-blue-200">
        <h3 className="font-medium text-blue-900 mb-2">💡 使用说明</h3>
        <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
          <li>配置 API 接口后，可以在右侧聊天窗口与 AI 对话</li>
          <li>点击"生成日报"按钮，AI 会根据当天记录自动生成日报</li>
          <li>所有数据存储在本地 SQLite 数据库中</li>
          <li>附件会缓存到应用缓存目录</li>
        </ul>
      </div>
    </div>
  );
}
