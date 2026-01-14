use serde::{Deserialize, Serialize};

/// 配置表 - 存储 API 配置
#[derive(Debug, Serialize, Deserialize)]
pub struct Config {
    pub id: i64,
    pub key: String,
    pub value: String,
    pub created_at: chrono::DateTime<chrono::Local>,
}

/// 想法表
#[derive(Debug, Serialize, Deserialize)]
pub struct Idea {
    pub id: i64,
    pub content: String,
    pub attachments: Vec<String>, // 附件路径数组
    pub created_at: chrono::DateTime<chrono::Local>,
    pub date: String, // YYYY-MM-DD
}

/// 已完成事项表
#[derive(Debug, Serialize, Deserialize)]
pub struct DoneTask {
    pub id: i64,
    pub content: String,
    pub start_time: chrono::DateTime<chrono::Local>,
    pub end_time: chrono::DateTime<chrono::Local>,
    pub attachments: Vec<String>, // 附件路径数组
    pub created_at: chrono::DateTime<chrono::Local>,
    pub date: String, // YYYY-MM-DD
}

/// API 配置结构（用于返回给前端）
#[derive(Debug, Serialize, Deserialize)]
pub struct ApiConfig {
    pub api_key: String,
    pub api_url: String,
    pub model: String,
}

/// 今日记录汇总（用于返回给前端）
#[derive(Debug, Serialize, Deserialize)]
pub struct TodayRecords {
    pub ideas: Vec<Idea>,
    pub tasks: Vec<DoneTask>,
}
