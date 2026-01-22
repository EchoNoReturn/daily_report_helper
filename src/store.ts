import { create } from 'zustand'
import { invoke } from '@tauri-apps/api/core'
import { AIMessage, ApiConfig, CurrentView, TodayRecords, Prompt } from './types'
import { aiService } from './services/aiService'

// 应用状态枚举
export enum AppStatus {
  INITIALIZING = 'initializing',
  READY = 'ready',
  AI_CONFIGURED = 'ai_configured',
  AI_NOT_CONFIGURED = 'ai_not_configured'
}

interface AppState {
  // 当前视图
  currentView: CurrentView;

  // 数据
  records: TodayRecords;
  apiConfig: ApiConfig | null;
  prompts: Prompt[];
  messages: AIMessage[];
  loading: boolean;
  initializing: boolean;
  appStatus: AppStatus;

  // Actions
  setCurrentView: (view: CurrentView) => void;
  loadTodayRecords: () => Promise<void>;
  loadHistoryRecords: (startDate: string, endDate: string) => Promise<TodayRecords>;
  loadApiConfig: () => Promise<void>;
  saveApiConfig: (config: ApiConfig) => Promise<void>;
  loadPrompts: () => Promise<void>;
  addPrompt: (name: string, content: string) => Promise<void>;
  updatePrompt: (id: number, name: string, content: string) => Promise<void>;
  deletePrompt: (id: number) => Promise<void>;
  addIdea: (content: string, attachments: string[]) => Promise<void>;
  addTask: (content: string, startTime: number, endTime: number, attachments: string[]) => Promise<void>;
  deleteIdea: (id: number) => Promise<void>;
  deleteTask: (id: number) => Promise<void>;
  sendMessage: (message: string) => Promise<void>;
  generateReport: (systemPrompt?: string, dateRange?: { start_date: string; end_date: string }) => Promise<void>;
  clearMessages: () => void;
  setLoading: (loading: boolean) => void;
  setInitializing: (initializing: boolean) => void;
  initializeApp: () => Promise<void>;
}

export const useAppStore = create<AppState>((set, get) => ({
  // 初始状态
  currentView: 'ideas',
  records: { ideas: [], tasks: [] },
  apiConfig: null,
  prompts: [],
  messages: [],
  loading: false,
  initializing: true,
  appStatus: AppStatus.INITIALIZING,

  // 设置当前视图
  setCurrentView: (view) => set({ currentView: view }),

  // 设置加载状态
  setLoading: (loading) => set({ loading }),

  // 设置初始化状态
  setInitializing: (initializing) => set({ initializing }),

  // 应用初始化
  initializeApp: async () => {
    try {
      set({ 
        initializing: true,
        appStatus: AppStatus.INITIALIZING 
      });
      
      // 并行加载所有必要数据
      await Promise.all([
        get().loadApiConfig(),
        get().loadTodayRecords(),
        get().loadPrompts()
      ]);
      
      // 更新应用状态
      const apiConfig = get().apiConfig;
      set({ 
        initializing: false,
        appStatus: apiConfig?.apiKey 
          ? AppStatus.AI_CONFIGURED 
          : AppStatus.AI_NOT_CONFIGURED
      });
      
    } catch (error) {
      console.error('应用初始化失败:', error);
      set({ 
        initializing: false,
        appStatus: AppStatus.READY 
      });
    }
  },

  // 加载当天记录
  loadTodayRecords: async () => {
    try {
      const records = await invoke('get_today_records')
      set({ records: records as TodayRecords })
    } catch (error) {
      console.error('加载记录失败:', error)
    }
  },

  // 加载历史记录
  loadHistoryRecords: async (startDate: string, endDate: string) => {
    try {
      const records = await invoke('get_records_by_date_range', { startDate, endDate })
      return records as TodayRecords
    } catch (error) {
      console.error('加载历史记录失败:', error)
      throw error
    }
  },

  // 加载 API 配置
  loadApiConfig: async () => {
    try {
      const config = await invoke('get_api_config')
      const apiConfig = config as ApiConfig | null
      set({ 
        apiConfig,
        appStatus: apiConfig?.apiKey 
          ? AppStatus.AI_CONFIGURED 
          : AppStatus.AI_NOT_CONFIGURED
      })
      if (apiConfig) {
        // 初始化 AI 服务
        aiService.initialize(apiConfig)
      }
    } catch (error) {
      console.error('加载配置失败:', error)
    }
  },

  // 保存 API 配置
  saveApiConfig: async (config: ApiConfig) => {
    try {
      await invoke('save_api_config', {
        api_key: config.apiKey,
        api_url: config.apiUrl,
        model: config.model
      })
      set({ 
        apiConfig: config,
        appStatus: AppStatus.AI_CONFIGURED
      })
      // 初始化 AI 服务
      aiService.initialize(config)
    } catch (error) {
      console.error('保存配置失败:', error)
      throw error
    }
  },

  // 加载提示词
  loadPrompts: async () => {
    try {
      const prompts = await invoke('get_prompts')
      set({ prompts: prompts as Prompt[] })
    } catch (error) {
      console.error('加载提示词失败:', error)
    }
  },

  // 添加提示词
  addPrompt: async (name: string, content: string) => {
    try {
      await invoke('add_prompt', { name, content })
      // 重新加载提示词
      await get().loadPrompts()
    } catch (error) {
      console.error('添加提示词失败:', error)
      throw error
    }
  },

  // 更新提示词
  updatePrompt: async (id: number, name: string, content: string) => {
    try {
      await invoke('update_prompt', { id, name, content })
      // 重新加载提示词
      await get().loadPrompts()
    } catch (error) {
      console.error('更新提示词失败:', error)
      throw error
    }
  },

  // 删除提示词
  deletePrompt: async (id: number) => {
    try {
      await invoke('delete_prompt', { id })
      // 从本地状态中移除，避免重新加载
      set(state => ({
        prompts: state.prompts.filter(prompt => prompt.id !== id)
      }))
    } catch (error) {
      console.error('删除提示词失败:', error)
      throw error
    }
  },

  // 添加想法
  addIdea: async (content: string, attachments: string[]) => {
    try {
      const created_at = Math.floor(Date.now() / 1000);
      await invoke('add_idea', {
        content,
        attachments,
        created_at
      })
      // 重新加载记录
      await get().loadTodayRecords()
    } catch (error) {
      console.error('添加想法失败:', error)
      throw error
    }
  },

  // 添加事项
  addTask: async (content: string, startTime: number, endTime: number, attachments: string[]) => {
    try {
      const created_at = Math.floor(Date.now() / 1000);
      await invoke('add_done_task', { content, start_time: startTime, end_time: endTime, attachments, created_at })
      // 重新加载记录
      await get().loadTodayRecords()
    } catch (error) {
      console.error('添加事项失败:', error)
      throw error
    }
  },

  // 删除想法
  deleteIdea: async (id: number) => {
    console.log('deleteIdea called with id:', id);
    try {
      await invoke('delete_idea', { id })
      // 从本地状态中移除，避免重新加载
      set(state => ({
        records: {
          ...state.records,
          ideas: state.records.ideas.filter(idea => idea.id !== id)
        }
      }))
    } catch (error) {
      console.error('删除想法失败:', error)
      throw error
    }
  },

  // 删除事项
  deleteTask: async (id: number) => {
    try {
      await invoke('delete_task', { id })
      // 从本地状态中移除，避免重新加载
      set(state => ({
        records: {
          ...state.records,
          tasks: state.records.tasks.filter(task => task.id !== id)
        }
      }))
    } catch (error) {
      console.error('删除事项失败:', error)
      throw error
    }
  },

  // AI 聊天功能
  sendMessage: async (message: string) => {
    try {
      if (!aiService.isConfigured()) {
        throw new Error('AI 服务未配置，请先在设置中配置 API 密钥')
      }

      // 获取历史消息
      const { messages } = get()
      const conversationHistory = messages.map(msg => ({
        role: msg.role,
        content: msg.content
      }))

      // 调用 AI 服务
      const response = await aiService.chat(message, conversationHistory)
      
      // 添加用户消息
      const userMessage: AIMessage = {
        role: 'user',
        content: message,
        timestamp: new Date().toISOString()
      }

      // 添加助手回复
      const assistantMessage: AIMessage = {
        role: 'assistant',
        content: response,
        timestamp: new Date().toISOString()
      }

      // 更新消息列表
      set(state => ({
        messages: [...state.messages, userMessage, assistantMessage]
      }))
    } catch (error) {
      console.error('发送消息失败:', error)
      throw error
    }
  },

  // 生成日报总结
  generateReport: async (systemPrompt?: string, dateRange?: { start_date: string; end_date: string }) => {
    try {
      if (!aiService.isConfigured()) {
        throw new Error('AI 服务未配置，请先在设置中配置 API 密钥')
      }

      set({ loading: true })
      
      // 调用 AI 服务生成报告
      const report = await aiService.generateDailyReport(systemPrompt || '', dateRange)
      
      // 添加报告作为助手消息
      const reportMessage: AIMessage = {
        role: 'assistant',
        content: report,
        timestamp: new Date().toISOString()
      }

      // 更新消息列表
      set(state => ({
        messages: [...state.messages, reportMessage]
      }))
    } catch (error) {
      console.error('生成报告失败:', error)
      throw error
    } finally {
      set({ loading: false })
    }
  },

  // 清空消息
  clearMessages: () => set({ messages: [] }),
}))
