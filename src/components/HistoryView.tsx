import { useState, useEffect } from 'react';
import { format, subDays } from 'date-fns';
import { invoke } from '@tauri-apps/api/core';
import { useAppStore } from '../store';
import { TodayRecords } from '../types';
import { IdeaCard } from './cards/IdeaCard';
import { TaskCard } from './cards/TaskCard';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@radix-ui/react-select';

export function HistoryView() {
  const { loading, setLoading } = useAppStore();
  const [records, setRecords] = useState<TodayRecords>({ ideas: [], tasks: [] });
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [timeRange, setTimeRange] = useState('today');

  // 预设时间范围选项
  const timeRangeOptions = [
    { value: 'today', label: '今天', days: 0 },
    { value: 'yesterday', label: '昨天', days: 1 },
    { value: 'week', label: '最近7天', days: 7 },
    { value: 'month', label: '最近30天', days: 30 },
  ];

  // 根据预设选项设置日期范围
  const setDateRange = (range: string) => {
    const today = new Date();
    const option = timeRangeOptions.find(opt => opt.value === range);
    
    if (option) {
      const end = format(today, 'yyyy-MM-dd');
      const start = format(subDays(today, option.days), 'yyyy-MM-dd');
      setStartDate(start);
      setEndDate(end);
      setTimeRange(range);
    } else if (range === 'custom') {
      setTimeRange('custom');
    }
  };

  // 加载历史记录
  const loadHistoryRecords = async () => {
    if (!startDate || !endDate) return;

    setLoading(true);
    try {
      const result = await invoke('get_records_by_date_range', {
        startDate,
        endDate
      });
      setRecords(result as TodayRecords);
    } catch (error) {
      console.error('加载历史记录失败:', error);
      alert('加载历史记录失败: ' + error);
    } finally {
      setLoading(false);
    }
  };

  // 初始化和切换时间范围时加载记录
  useEffect(() => {
    if (timeRange !== 'custom') {
      setDateRange(timeRange);
    }
  }, [timeRange]);

  useEffect(() => {
    if (startDate && endDate) {
      loadHistoryRecords();
    }
  }, [startDate, endDate]);

  return (
    <div className="flex-1 bg-white p-6">
      {/* 标题 */}
      <h1 className="text-2xl font-bold text-gray-800 mb-6">历史记录</h1>

      {/* 筛选栏 */}
      <div className="flex flex-wrap gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
        {/* 时间范围快速选择 */}
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-gray-700">时间范围:</label>
          <Select value={timeRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-32 bg-white border border-gray-300 rounded px-3 py-2 text-sm">
              <SelectValue placeholder="选择时间" />
            </SelectTrigger>
            <SelectContent className="bg-white border border-gray-200 rounded shadow-lg">
              {timeRangeOptions.map((option) => (
                <SelectItem 
                  key={option.value} 
                  value={option.value}
                  className="px-3 py-2 text-sm hover:bg-gray-100 cursor-pointer"
                >
                  {option.label}
                </SelectItem>
              ))}
              <SelectItem 
                value="custom"
                className="px-3 py-2 text-sm hover:bg-gray-100 cursor-pointer"
              >
                自定义
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* 自定义日期范围 */}
        {timeRange === 'custom' && (
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700">开始日期:</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="border border-gray-300 rounded px-3 py-2 text-sm"
            />
            <label className="text-sm font-medium text-gray-700">结束日期:</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="border border-gray-300 rounded px-3 py-2 text-sm"
            />
          </div>
        )}
      </div>

      {/* 统计信息 */}
      <div className="flex gap-4 mb-6">
        <div className="bg-blue-50 text-blue-700 px-4 py-2 rounded-lg">
          <span className="font-medium">想法: </span>
          <span className="font-bold">{records.ideas.length}</span>
        </div>
        <div className="bg-green-50 text-green-700 px-4 py-2 rounded-lg">
          <span className="font-medium">已完成: </span>
          <span className="font-bold">{records.tasks.length}</span>
        </div>
      </div>

      {/* 两栏布局 */}
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="text-gray-500">加载中...</div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 左栏：想法 */}
          <div>
            <h2 className="text-lg font-semibold text-gray-700 mb-4 flex items-center gap-2">
              💡 想法记录
            </h2>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {records.ideas.length === 0 ? (
                <div className="text-gray-400 text-center py-8">暂无想法记录</div>
              ) : (
                records.ideas.map((idea) => (
                  <IdeaCard 
                    key={idea.id} 
                    idea={idea} 
                  />
                ))
              )}
            </div>
          </div>

          {/* 右栏：已完成事项 */}
          <div>
            <h2 className="text-lg font-semibold text-gray-700 mb-4 flex items-center gap-2">
              ✅ 已完成事项
            </h2>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {records.tasks.length === 0 ? (
                <div className="text-gray-400 text-center py-8">暂无完成事项</div>
              ) : (
                records.tasks.map((task) => (
                  <TaskCard 
                    key={task.id} 
                    task={task} 
                  />
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}