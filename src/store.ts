import { create } from 'zustand'
import { invoke } from '@tauri-apps/api/core'
import { AIMessage, ApiConfig, CurrentView, TodayRecords } from './types'

interface AppState {
  // 当前视图
  currentView: CurrentView;

  // 数据
  records: TodayRecords;
  apiConfig: ApiConfig | null;
  messages: AIMessage[];
  loading: boolean;

  // Actions
  setCurrentView: (view: CurrentView) => void;
  loadTodayRecords: () => Promise<void>;
  loadApiConfig: () => Promise<void>;
  saveApiConfig: (config: ApiConfig) => Promise<void>;
  addIdea: (content: string, attachments: string[]) => Promise<void>;
  addTask: (content: string, startTime: string, endTime: string, attachments: string[]) => Promise<void>;
  sendMessage: (message: string) => Promise<void>;
  generateReport: () => Promise<void>;
  clearMessages: () => void;
  setLoading: (loading: boolean) => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  // 初始状态
  currentView: 'ideas',
  records: { ideas: [], tasks: [] },
  apiConfig: null,
  messages: [],
  loading: false,

  // 设置当前视图
  setCurrentView: (view) => set({ currentView: view }),

  // 设置加载状态
  setLoading: (loading) => set({ loading }),

  // 加载当天记录
  loadTodayRecords: async () => {
    try {
      const records = await invoke('get_today_records')
      set({ records: records as TodayRecords })
    } catch (error) {
      console.error('加载记录失败:', error)
    }
  },

  // 加载 API 配置
  loadApiConfig: async () => {
    try {
      const config = await invoke('get_api_config')
      set({ apiConfig: config as ApiConfig | null })
    } catch (error) {
      console.error('加载配置失败:', error)
    }
  },

  // 保存 API 配置
  saveApiConfig: async (config: ApiConfig) => {
    try {
      await invoke('save_api_config', {
        apiKey: config.apiKey,
        apiUrl: config.apiUrl,
        model: config.model
      })
      set({ apiConfig: config })
    } catch (error) {
      console.error('保存配置失败:', error)
      throw error
    }
  },

  // 添加想法
  addIdea: async (content: string, attachments: string[]) => {
    try {
      const timestamp = new Date().toISOString();
      await invoke('add_idea', { content, attachments, timestamp })
      // 重新加载记录
      await get().loadTodayRecords()
    } catch (error) {
      console.error('添加想法失败:', error)
      throw error
    }
  },

  // 添加事项
  addTask: async (content: string, startTime: string, endTime: string, attachments: string[]) => {
    try {
      const timestamp = new Date().toISOString();
      await invoke('add_done_task', { content, startTime, endTime, attachments, timestamp })
      // 重新加载记录
      await get().loadTodayRecords()
    } catch (error) {
      console.error('添加事项失败:', error)
      throw error
    }
  },

  // 发送消息
  sendMessage: async (message: string) => {
    const { messages, apiConfig } = get()

    // 检查配置
    if (!apiConfig?.apiKey || !apiConfig?.apiUrl) {
      throw new Error('请先配置 AI 接口')
    }

    // 添加用户消息
    const userMessage: AIMessage = {
      role: 'user',
      content: message,
      timestamp: new Date().toISOString()
    }
    set({ messages: [...messages, userMessage] })

    try {
      // 调用 AI
      const response = await invoke('send_ai_message', { message })

      // 添加 AI 回复
      const aiMessage: AIMessage = {
        role: 'assistant',
        content: response as string,
        timestamp: new Date().toISOString()
      }

      set({ messages: [...get().messages, aiMessage] })
    } catch (error) {
      console.error('发送消息失败:', error)

      // 添加错误消息
      const errorMessage: AIMessage = {
        role: 'assistant',
        content: `错误: ${error}`,
        timestamp: new Date().toISOString()
      }
      set({ messages: [...get().messages, errorMessage] })
      throw error
    }
  },

  // 生成日报
  generateReport: async () => {
    const { apiConfig, messages } = get()

    // 检查配置
    if (!apiConfig?.apiKey || !apiConfig?.apiUrl) {
      throw new Error('请先配置 AI 接口')
    }

    // 添加用户提示（显示在输入框上方）
    const userMessage: AIMessage = {
      role: 'user',
      content: '📄 正在生成日报...',
      timestamp: new Date().toISOString()
    }
    set({ messages: [...messages, userMessage] })

    try {
      // 调用后端生成日报
      const report = await invoke('generate_daily_report')

      // 添加 AI 回复
      const aiMessage: AIMessage = {
        role: 'assistant',
        content: report as string,
        timestamp: new Date().toISOString()
      }

      set({ messages: [...get().messages, aiMessage] })
    } catch (error) {
      console.error('生成日报失败:', error)

      const errorMessage: AIMessage = {
        role: 'assistant',
        content: `生成日报失败: ${error}`,
        timestamp: new Date().toISOString()
      }
      set({ messages: [...get().messages, errorMessage] })
      throw error
    }
  },

  // 清空消息
  clearMessages: () => set({ messages: [] }),
}))
