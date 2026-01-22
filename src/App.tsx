import { useEffect } from "react";
import { LeftNav } from "./components/LeftNav";
import { MainContent } from "./components/MainContent";
import { AIChat } from "./components/AIChat";
import { LoadingScreen } from "./components/LoadingScreen";
import { useAppStore } from "./store";

function App() {
  const { initializeApp, initializing } = useAppStore();

  // 应用初始化
  useEffect(() => {
    initializeApp();
  }, []);

  // 显示加载界面
  if (initializing) {
    return <LoadingScreen message="正在启动应用..." />;
  }



  return (
    <div className="flex h-screen bg-gray-50">
      <LeftNav />
      <MainContent />
      <AIChat />
    </div>
  );
}

export default App;
