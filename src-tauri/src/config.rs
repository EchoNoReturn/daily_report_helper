use crate::models::ApiConfig;
use std::path::PathBuf;
use tauri::{AppHandle, Manager};

/// AI 配置管理器
pub struct ConfigManager {
    config_path: PathBuf,
}

impl ConfigManager {
    /// 创建配置管理器
    pub fn new(app: &AppHandle) -> Result<Self, String> {
        let app_config_dir = app.path()
            .app_config_dir()
            .map_err(|e| format!("无法获取应用配置目录: {}", e))?;

        // 确保目录存在
        std::fs::create_dir_all(&app_config_dir)
            .map_err(|e| format!("无法创建目录: {}", e))?;

        let config_path = app_config_dir.join("ai_config.json");
        
        Ok(Self { config_path })
    }

    /// 保存 AI 配置
    pub fn save_config(&self, config: &ApiConfig) -> Result<(), String> {
        let config_json = serde_json::to_string(config)
            .map_err(|e| format!("序列化配置失败: {}", e))?;

        std::fs::write(&self.config_path, config_json)
            .map_err(|e| format!("写入配置文件失败: {}", e))?;

        Ok(())
    }

    /// 读取 AI 配置
    pub fn load_config(&self) -> Result<Option<ApiConfig>, String> {
        if !self.config_path.exists() {
            return Ok(None);
        }

        let config_content = std::fs::read_to_string(&self.config_path)
            .map_err(|e| format!("读取配置文件失败: {}", e))?;

        let config: ApiConfig = serde_json::from_str(&config_content)
            .map_err(|e| format!("解析配置文件失败: {}", e))?;

        Ok(Some(config))
    }
}