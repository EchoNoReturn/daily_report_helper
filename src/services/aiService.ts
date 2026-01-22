import OpenAI from 'openai';
import { format } from 'date-fns';
import { ApiConfig, TodayRecords } from '../types';

export class AIService {
  private openai: OpenAI | null = null;
  private config: ApiConfig | null = null;

  // 初始化 AI 服务
  initialize(config: ApiConfig) {
    this.config = config;
    this.openai = new OpenAI({
      apiKey: config.apiKey,
      baseURL: config.apiUrl,
      dangerouslyAllowBrowser: true // 允许在浏览器中使用
    });
  }

  // 获取当前时间的工具
  private getCurrentTimeTool() {
    return {
      type: "function" as const,
      function: {
        name: "get_current_time",
        description: "获取当前日期和时间",
        parameters: {
          type: "object" as const,
          properties: {},
          required: [] as string[]
        }
      }
    };
  }

  // 获取历史数据的工具
  private getHistoryDataTool() {
    return {
      type: "function" as const,
      function: {
        name: "get_history_data",
        description: "获取指定日期范围的想法和已完成事项",
        parameters: {
          type: "object" as const,
          properties: {
            start_date: { 
              type: "string", 
              description: "开始日期 (YYYY-MM-DD)" 
            },
            end_date: { 
              type: "string", 
              description: "结束日期 (YYYY-MM-DD)" 
            }
          },
          required: ["start_date", "end_date"] as string[]
        }
      }
    };
  }

  // 执行工具调用
  private async executeToolCall(toolName: string, parameters: any): Promise<any> {
    switch (toolName) {
      case 'get_current_time':
        return {
          current_time: new Date().toISOString(),
          formatted_time: format(new Date(), 'yyyy年MM月dd日 HH:mm:ss'),
          date: format(new Date(), 'yyyy-MM-dd')
        };

      case 'get_history_data':
        try {
          // 这里需要调用 Tauri 命令获取历史数据
          // 由于我们在浏览器环境中，需要通过 invoke 调用
          const { invoke } = await import('@tauri-apps/api/core');
          const records = await invoke('get_records_by_date_range', {
            startDate: parameters.start_date,
            endDate: parameters.end_date
          }) as TodayRecords;
          
          return {
            ideas: records.ideas.map(idea => ({
              id: idea.id,
              content: idea.content,
              date: idea.date,
              created_at: idea.created_at,
              attachments: idea.attachments
            })),
            tasks: records.tasks.map(task => ({
              id: task.id,
              content: task.content,
              date: task.date,
              start_time: task.start_time,
              end_time: task.end_time,
              duration: task.end_time - task.start_time,
              attachments: task.attachments
            })),
            summary: {
              total_ideas: records.ideas.length,
              total_tasks: records.tasks.length,
              date_range: `${parameters.start_date} 至 ${parameters.end_date}`
            }
          };
        } catch (error) {
          console.error('获取历史数据失败:', error);
          throw new Error('获取历史数据失败');
        }

      default:
        throw new Error(`未知工具: ${toolName}`);
    }
  }

  // 递归处理对话直到没有工具调用
  private async handleConversation(messages: any[], maxIterations: number = 5): Promise<string> {
    if (maxIterations <= 0) {
      throw new Error('工具调用次数过多，可能存在循环');
    }

    const tools = [
      this.getCurrentTimeTool(),
      this.getHistoryDataTool()
    ];

    const response = await this.openai!.chat.completions.create({
      model: this.config!.model,
      messages: messages,
      tools: tools,
      tool_choice: 'auto',
      temperature: 0.7,
      max_tokens: 2000
    });

    const message = response.choices[0].message;
    const updatedMessages = [...messages, message];

    // 检查是否有工具调用（支持两种可能的格式）
    const toolCalls = (message as any).tool_calls || (message as any).function_calls;

    if (toolCalls && toolCalls.length > 0) {
      // 执行所有工具调用
      for (const toolCall of toolCalls) {
        let toolName: string;
        let toolArgs: any;
        let toolCallId: string;

        // 处理不同类型的工具调用格式
        if ('function' in toolCall) {
          toolName = toolCall.function.name;
          toolArgs = JSON.parse(toolCall.function.arguments);
          toolCallId = toolCall.id;
        } else if ('name' in toolCall) {
          // 可能的另一种格式
          toolName = toolCall.name;
          toolArgs = typeof toolCall.arguments === 'string' 
            ? JSON.parse(toolCall.arguments) 
            : toolCall.arguments;
          toolCallId = toolCall.id || '';
        } else {
          throw new Error('不支持的工具调用类型');
        }

        try {
          const toolResult = await this.executeToolCall(toolName, toolArgs);
          
          updatedMessages.push({
            role: 'tool',
            tool_call_id: toolCallId,
            content: JSON.stringify(toolResult)
          });
        } catch (error) {
          updatedMessages.push({
            role: 'tool',
            tool_call_id: toolCallId,
            content: JSON.stringify({ error: (error as Error).toString() })
          });
        }
      }

      // 递归处理，直到没有工具调用
      return this.handleConversation(updatedMessages, maxIterations - 1);
    }

    // 如果没有工具调用，直接返回最终回复
    return message.content || '生成日报总结失败';
  }

  // 生成日报总结
  async generateDailyReport(systemPrompt: string, dateRange?: { start_date: string; end_date: string }): Promise<string> {
    if (!this.openai || !this.config) {
      throw new Error('AI 服务未初始化');
    }

    try {
      const messages: any[] = [
        {
          role: 'system',
          content: systemPrompt || `你是一个专业的日报分析助手。请根据用户的需求，使用工具获取相关数据，然后生成一份详细的日报总结。

总结应该包括：
1. 工作成果和进展
2. 重要想法和思考
3. 时间管理和效率分析
4. 后续改进建议

请用中文回复，语言要专业、简洁、有条理。当获取到数据后，请认真分析并生成有价值的总结。`
        },
        {
          role: 'user',
          content: dateRange 
            ? `请帮我分析从 ${dateRange.start_date} 到 ${dateRange.end_date} 这段时间的工作情况，生成一份日报总结。请使用工具获取这段时间的所有想法和已完成事项，然后进行深度分析。`
            : '请帮我分析今天的工作情况，生成一份日报总结。请使用工具获取今天的所有想法和已完成事项，然后进行深度分析。'
        }
      ];

      // 递归处理对话
      return await this.handleConversation(messages);
    } catch (error) {
      console.error('生成日报总结失败:', error);
      throw new Error('生成日报总结失败: ' + error);
    }
  }

  // 常规聊天功能
  async chat(message: string, conversationHistory: Array<{role: string, content: string}> = []): Promise<string> {
    if (!this.openai || !this.config) {
      throw new Error('AI 服务未初始化');
    }

    try {
      const messages: any[] = [
        {
          role: 'system',
          content: '你是一个有用的助手，专门帮助用户管理日常工作记录和分析。'
        },
        ...conversationHistory.map(msg => ({
          role: msg.role,
          content: msg.content
        })),
        {
          role: 'user',
          content: message
        }
      ];

      const response = await this.openai.chat.completions.create({
        model: this.config.model,
        messages: messages,
        temperature: 0.7,
        max_tokens: 1000
      });

      return response.choices[0].message.content || '回复失败';
    } catch (error) {
      console.error('AI 聊天失败:', error);
      throw new Error('AI 聊天失败: ' + error);
    }
  }

  // 检查配置是否有效
  isConfigured(): boolean {
    return this.openai !== null && this.config !== null;
  }
}

// 创建单例实例
export const aiService = new AIService();