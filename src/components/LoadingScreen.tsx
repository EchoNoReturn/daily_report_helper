import { Loader2 } from 'lucide-react';

interface LoadingScreenProps {
  message?: string;
}

export function LoadingScreen({ message = '正在初始化...' }: LoadingScreenProps) {
  return (
    <div className="fixed inset-0 bg-white flex flex-col items-center justify-center z-50">
      <div className="text-center space-y-4">
        <div className="flex justify-center">
          <Loader2 size={48} className="animate-spin text-primary-600" />
        </div>
        <div className="space-y-2">
          <h2 className="text-lg font-medium text-gray-800">{message}</h2>
          <p className="text-sm text-gray-500">正在加载配置和数据...</p>
        </div>
      </div>
    </div>
  );
}