import { useState, useEffect, useRef } from 'react';
import { format, subDays } from 'date-fns';
import { useAppStore } from '../store';
import { AIMessageCard } from './cards/AIMessageCard';
import { Send, Loader2, Sparkles, Trash2 } from 'lucide-react';
import * as Dialog from '@radix-ui/react-dialog';
import * as Select from '@radix-ui/react-select';

export function AIChat() {
  const { messages, sendMessage, generateReport, clearMessages, apiConfig, prompts } = useAppStore();
  const [input, setInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showReportDialog, setShowReportDialog] = useState(false);
  const [reportConfig, setReportConfig] = useState({
    dateRange: 'today',
    startDate: '',
    endDate: '',
    selectedPrompt: ''
  });
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 预设时间范围选项
  const dateRangeOptions = [
    { value: 'today', label: '今天', days: 0 },
    { value: 'yesterday', label: '昨天', days: 1 },
    { value: 'week', label: '最近7天', days: 7 },
    { value: 'month', label: '最近30天', days: 30 },
  ];

  // 自动滚动到底部
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // 根据预设选项设置日期范围
  const setDateRange = (range: string) => {
    const today = new Date();
    const option = dateRangeOptions.find(opt => opt.value === range);
    
    if (option) {
      const end = format(today, 'yyyy-MM-dd');
      const start = format(subDays(today, option.days), 'yyyy-MM-dd');
      setReportConfig(prev => ({
        ...prev,
        dateRange: range,
        startDate: start,
        endDate: end
      }));
    } else {
      setReportConfig(prev => ({ ...prev, dateRange: range }));
    }
  };

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

  const handleGenerateReport = async () => {
    // 检查配置
    if (!apiConfig?.apiKey || !apiConfig?.apiUrl) {
      alert('请先在设置中配置 AI 接口');
      return;
    }

    setIsGenerating(true);
    try {
      // 准备日期范围参数
      let dateRangeParam = undefined;
      if (reportConfig.dateRange === 'custom' && reportConfig.startDate && reportConfig.endDate) {
        dateRangeParam = {
          start_date: reportConfig.startDate,
          end_date: reportConfig.endDate
        };
      } else if (reportConfig.startDate && reportConfig.endDate) {
        dateRangeParam = {
          start_date: reportConfig.startDate,
          end_date: reportConfig.endDate
        };
      }

      // 获取选中的提示词内容
      const selectedPrompt = prompts.find(p => p.id.toString() === reportConfig.selectedPrompt);
      const systemPrompt = selectedPrompt?.content || undefined;

      await generateReport(systemPrompt, dateRangeParam);
      setShowReportDialog(false);
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
        {/* 生成日报按钮 */}
        <Dialog.Root open={showReportDialog} onOpenChange={setShowReportDialog}>
          <Dialog.Trigger asChild>
            <button
              className="w-full bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg flex items-center justify-center gap-2 transition-colors"
            >
              <Sparkles size={16} />
              生成日报总结
            </button>
          </Dialog.Trigger>
          
          <Dialog.Portal>
            <Dialog.Overlay className="fixed inset-0 bg-black bg-opacity-50 z-40" />
            <Dialog.Content className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg shadow-xl p-6 w-96 z-50">
              <Dialog.Title className="text-lg font-semibold text-gray-800 mb-4">
                生成日报总结
              </Dialog.Title>

              <div className="space-y-4">
                {/* 时间范围选择 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    时间范围
                  </label>
                  <Select.Root value={reportConfig.dateRange} onValueChange={setDateRange}>
                    <Select.Trigger className="w-full bg-white border border-gray-300 rounded px-3 py-2 text-sm">
                      <Select.Value placeholder="选择时间范围" />
                    </Select.Trigger>
                    <Select.Portal>
                      <Select.Content className="bg-white border border-gray-200 rounded shadow-lg max-h-48 overflow-y-auto">
                        {dateRangeOptions.map((option) => (
                          <Select.Item
                            key={option.value}
                            value={option.value}
                            className="px-3 py-2 text-sm hover:bg-gray-100 cursor-pointer outline-none"
                          >
                            <Select.ItemText>{option.label}</Select.ItemText>
                          </Select.Item>
                        ))}
                        <Select.Item
                          value="custom"
                          className="px-3 py-2 text-sm hover:bg-gray-100 cursor-pointer outline-none"
                        >
                          <Select.ItemText>自定义范围</Select.ItemText>
                        </Select.Item>
                      </Select.Content>
                    </Select.Portal>
                  </Select.Root>
                </div>

                {/* 自定义日期范围 */}
                {reportConfig.dateRange === 'custom' && (
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        开始日期
                      </label>
                      <input
                        type="date"
                        value={reportConfig.startDate}
                        onChange={(e) => setReportConfig(prev => ({ ...prev, startDate: e.target.value }))}
                        className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        结束日期
                      </label>
                      <input
                        type="date"
                        value={reportConfig.endDate}
                        onChange={(e) => setReportConfig(prev => ({ ...prev, endDate: e.target.value }))}
                        className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                      />
                    </div>
                  </div>
                )}

                {/* 提示词选择 */}
                {prompts.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      分析模板 (可选)
                    </label>
                    <Select.Root value={reportConfig.selectedPrompt} onValueChange={(value) => setReportConfig(prev => ({ ...prev, selectedPrompt: value }))}>
                      <Select.Trigger className="w-full bg-white border border-gray-300 rounded px-3 py-2 text-sm">
                        <Select.Value placeholder="选择分析模板" />
                      </Select.Trigger>
                      <Select.Portal>
                        <Select.Content className="bg-white border border-gray-200 rounded shadow-lg max-h-48 overflow-y-auto">
                          <Select.Item value="" className="px-3 py-2 text-sm hover:bg-gray-100 cursor-pointer outline-none">
                            <Select.ItemText>默认模板</Select.ItemText>
                          </Select.Item>
                          {prompts.map((prompt) => (
                            <Select.Item
                              key={prompt.id}
                              value={prompt.id.toString()}
                              className="px-3 py-2 text-sm hover:bg-gray-100 cursor-pointer outline-none"
                            >
                              <Select.ItemText>{prompt.name}</Select.ItemText>
                            </Select.Item>
                          ))}
                        </Select.Content>
                      </Select.Portal>
                    </Select.Root>
                  </div>
                )}

                {/* 操作按钮 */}
                <div className="flex gap-2 pt-2">
                  <button
                    onClick={() => setShowReportDialog(false)}
                    className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 py-2 rounded-lg text-sm transition-colors"
                  >
                    取消
                  </button>
                  <button
                    onClick={handleGenerateReport}
                    disabled={isGenerating || (reportConfig.dateRange === 'custom' && (!reportConfig.startDate || !reportConfig.endDate))}
                    className={`
                      flex-1 bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg text-sm transition-colors flex items-center justify-center gap-2
                      ${isGenerating ? 'opacity-70 cursor-not-allowed' : ''}
                    `}
                  >
                    {isGenerating ? (
                      <>
                        <Loader2 size={14} className="animate-spin" />
                        生成中...
                      </>
                    ) : (
                      '开始生成'
                    )}
                  </button>
                </div>
              </div>
            </Dialog.Content>
          </Dialog.Portal>
        </Dialog.Root>

        {/* 清空对话按钮 */}
        <button
          onClick={clearMessages}
          className="w-full bg-gray-200 hover:bg-gray-300 text-gray-700 py-1.5 rounded-lg flex items-center justify-center gap-2 text-sm transition-colors"
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
            <p className="text-xs mt-1">点击上方按钮生成日报总结</p>
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