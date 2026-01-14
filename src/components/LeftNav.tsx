import { Lightbulb, CheckSquare, Settings } from 'lucide-react';
import { useAppStore } from '../store';
import { CurrentView } from '../types';

interface NavButtonProps {
  icon: React.ElementType;
  label: string;
  active: boolean;
  onClick: () => void;
}

function NavButton({ icon: Icon, label, active, onClick }: NavButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`
        w-10 h-10 mb-4 rounded-lg flex items-center justify-center transition-all
        ${active
          ? 'bg-primary-600 text-white shadow-lg'
          : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white'
        }
      `}
      title={label}
    >
      <Icon size={20} />
    </button>
  );
}

export function LeftNav() {
  const { currentView, setCurrentView } = useAppStore();

  const views: { view: CurrentView; icon: React.ElementType; label: string }[] = [
    { view: 'ideas', icon: Lightbulb, label: '想法' },
    { view: 'tasks', icon: CheckSquare, label: '事项' },
    { view: 'settings', icon: Settings, label: '设置' },
  ];

  return (
    <div className="w-16 bg-gray-900 text-white flex flex-col items-center py-4 border-r border-gray-800">
      {/* Logo 位置 */}
      <div className="mb-8">
        <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center font-bold text-sm">
          日
        </div>
      </div>

      {/* 导航按钮 */}
      {views.map(({ view, icon, label }) => (
        <NavButton
          key={view}
          icon={icon}
          label={label}
          active={currentView === view}
          onClick={() => setCurrentView(view)}
        />
      ))}

      {/* 底部占位 */}
      <div className="flex-1" />
    </div>
  );
}
