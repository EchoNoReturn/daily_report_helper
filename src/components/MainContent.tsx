import { useAppStore } from '../store';
import { IdeasView } from './IdeasView';
import { TasksView } from './TasksView';
import { SettingsView } from './SettingsView';
import { PromptsView } from './PromptsView';

export function MainContent() {
  const { currentView } = useAppStore();

  return (
    <div className="flex-1 overflow-hidden flex flex-col bg-gray-50">
      <div className="flex-1 overflow-y-auto p-6">
        {currentView === 'ideas' && <IdeasView />}
        {currentView === 'tasks' && <TasksView />}
        {currentView === 'settings' && <SettingsView />}
        {currentView === 'prompts' && <PromptsView />}
      </div>
    </div>
  );
}
