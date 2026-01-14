import { useState, useEffect, useRef } from 'react';
import { useAppStore } from '../store';
import { AIMessageCard } from './cards/AIMessageCard';
import { Send, Loader2, Sparkles, Trash2 } from 'lucide-react';

export function AIChat() {
  const { messages, sendMessage, generateReport, clearMessages, apiConfig } = useAppStore();
  const [input, setInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 自动滚动到底部
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;

    // 检查配置
    if (!apiConfig?.apiKey || !apiConfig?.apiUrl) {
      alert('请先在设置中配置 AI 接口');
      return;
    }

    setIsSending(true);
    try {
      await sendMessage(input);
      setInput('');
    } catch (error) {
      // 错误已在 store 中处理
    } finally {
      setIsSending(false);
    }
  };

  const handleGenerate = async () => {
    // 检查配置
    if (!apiConfig?.apiKey || !apiConfig?.apiUrl) {
      alert('请先在设置中配置 AI 接口');
      return;
    }

    setIsGenerating(true);
    try {
      await generateReport();
    } catch (error) {
      // 错误已在 store 中处理
    } finally {
      setIsGenerating(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="w-96 bg-white border-l border-gray-200 flex flex-col h-screen">
      {/* 顶部操作区 */}
      <div className="p-4 border-b border-gray-200 space-y-2">
        <button
          onClick={handleGenerate}
          disabled={isGenerating}
          className={`
            w-full bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg
            flex items-center justify-center gap-2 transition-colors
            ${isGenerating ? 'opacity-70 cursor-not-allowed' : ''}
          `}
        >
          {isGenerating ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              生成中...
            </>
          ) : (
            <>
              <Sparkles size={16} />
              生成日报
            </>
          )}
        </button>

        <button
          onClick={clearMessages}
          className={`
            w-full bg-gray-200 hover:bg-gray-300 text-gray-700 py-1.5 rounded-lg
            flex items-center justify-center gap-2 text-sm transition-colors
          `}
        >
          <Trash2 size={14} />
          清空对话
        </button>

        {!apiConfig?.apiKey && (
          <div className="text-xs text-orange-600 bg-orange-50 px-2 py-1 rounded">
            ⚠️ 请先配置 AI 接口
          </div>
        )}
      </div>

      {/* 消息列表 */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
        {messages.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <div className="text-4xl mb-2">💬</div>
            <p>开始对话或生成日报</p>
            <p className="text-xs mt-1">右侧按钮可生成日报</p>
          </div>
        ) : (
          messages.map((msg, idx) => (
            <AIMessageCard key={idx} message={msg} />
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* 输入框 */}
      <div className="p-4 border-t border-gray-200 bg-white">
        <div className="flex gap-2">
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="输入消息..."
            className={`
              flex-1 input-field
              ${isSending ? 'opacity-70' : ''}
            `}
            disabled={isSending}
          />
          <button
            onClick={handleSend}
            disabled={isSending || !input.trim()}
            className={`
              px-4 py-2 rounded-lg flex items-center justify-center
              ${isSending || !input.trim()
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-primary-600 hover:bg-primary-700 text-white'
              }
            `}
          >
            {isSending ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <Send size={18} />
            )}
          </button>
        </div>
        <div className="text-[10px] text-gray-400 mt-1 text-center">
          支持 Markdown 格式，Enter 发送
        </div>
      </div>
    </div>
  );
}
