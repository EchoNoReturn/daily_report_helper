export interface ApiConfig {
  apiKey: string;
  apiUrl: string;
  model: string;
}

export interface Idea {
  id: number;
  content: string;
  attachments: string[];
  createdAt: string;
  date: string;
}

export interface DoneTask {
  id: number;
  content: string;
  startTime: string;
  endTime: string;
  attachments: string[];
  createdAt: string;
  date: string;
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

export type CurrentView = 'ideas' | 'tasks' | 'settings';
