import { useState } from 'react';
import { marked } from 'marked';
import { AIMessage } from '../../types';

interface AIMessageCardProps {
  message: AIMessage;
}

export function AIMessageCard({ message }: AIMessageCardProps) {
  const isUser = message.role === 'user';
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    // 复制为纯文本（移除 Markdown 符号）
    const plainText = message.content
      .replace(/[*#`_~]/g, '')
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');

    await navigator.clipboard.writeText(plainText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // 渲染 Markdown
  const htmlContent = marked.parse(message.content, {
    breaks: true,
    gfm: true
  });

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div className={`
        max-w-[85%] rounded-lg p-3
        ${isUser
          ? 'bg-primary-600 text-white'
          : 'bg-gray-100 text-gray-800 border border-gray-200'
        }
      `}>
        <div className="flex justify-between items-start mb-2">
          <span className="text-xs font-bold">
            {isUser ? '你' : 'AI'}
          </span>
          <button
            onClick={handleCopy}
            className={`
              text-xs px-2 py-0.5 rounded transition-colors
              ${isUser ? 'bg-white/20 hover:bg-white/30' : 'bg-gray-200 hover:bg-gray-300'}
            `}
            title="复制为纯文本"
          >
            {copied ? '已复制' : '复制'}
          </button>
        </div>

        <div
          className={`
            text-sm prose prose-sm max-w-none
            ${isUser ? 'prose-invert' : ''}
          `}
          dangerouslySetInnerHTML={{ __html: htmlContent }}
        />

        <div className={`
          text-[10px] mt-1
          ${isUser ? 'text-white/70' : 'text-gray-500'}
        `}>
          {new Date(message.timestamp).toLocaleTimeString('zh-CN', {
            hour: '2-digit',
            minute: '2-digit'
          })}
        </div>
      </div>
    </div>
  );
}
