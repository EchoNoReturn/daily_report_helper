export interface ApiConfig {
  apiKey: string;
  apiUrl: string;
  model: string;
}

export interface Idea {
  id: number;
  content: string;
  attachments: string[];
  created_at: number; // Unix 时间戳
  date: string;
}

export interface DoneTask {
  id: number;
  content: string;
  start_time: number; // Unix 时间戳
  end_time: number; // Unix 时间戳
  attachments: string[];
  created_at: number; // Unix 时间戳
  date: string;
}

export interface Prompt {
  id: number;
  name: string;
  content: string;
  created_at: number; // Unix 时间戳
  updated_at: number; // Unix 时间戳
}

export interface TodayRecords {
  ideas: Idea[];
  tasks: DoneTask[];
}

export interface AIMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export type CurrentView = 'ideas' | 'tasks' | 'settings' | 'prompts' | 'history';
