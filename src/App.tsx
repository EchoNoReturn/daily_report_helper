import { useEffect } from "react";
import { LeftNav } from "./components/LeftNav";
import { MainContent } from "./components/MainContent";
import { AIChat } from "./components/AIChat";
import { useAppStore } from "./store";

function App() {
  const { loadTodayRecords, loadApiConfig } = useAppStore();

  // 初始化数据
  useEffect(() => {
    loadTodayRecords();
    loadApiConfig();
  }, []);

  return (
    <div className="flex h-screen bg-gray-50">
      <LeftNav />
      <MainContent />
      <AIChat />
    </div>
  );
}

export default App;
