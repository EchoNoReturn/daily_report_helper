import { create } from 'zustand'
import { invoke } from '@tauri-apps/api/core'
import { AIMessage, ApiConfig, CurrentView, TodayRecords, Prompt } from './types'

interface AppState {
  // 当前视图
  currentView: CurrentView;

  // 数据
  records: TodayRecords;
  apiConfig: ApiConfig | null;
  prompts: Prompt[];
  messages: AIMessage[];
  loading: boolean;

  // Actions
  setCurrentView: (view: CurrentView) => void;
  loadTodayRecords: () => Promise<void>;
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
  generateReport: () => Promise<void>;
  clearMessages: () => void;
  setLoading: (loading: boolean) => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  // 初始状态
  currentView: 'ideas',
  records: { ideas: [], tasks: [] },
  apiConfig: null,
  prompts: [],
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
        api_key: config.apiKey,
        api_url: config.apiUrl,
        model: config.model
      })
      set({ apiConfig: config })
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

  // AI 功能已移除 - 这些方法保留为占位符，前端可以自行实现 AI 调用
  sendMessage: async (_message: string) => {
    throw new Error('AI 功能已移至前端实现，请使用前端 API 调用')
  },

  generateReport: async () => {
    throw new Error('AI 功能已移至前端实现，请使用前端 API 调用')
  },

  // 清空消息
  clearMessages: () => set({ messages: [] }),
}))
