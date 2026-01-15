use serde::{Deserialize, Serialize};

/// 想法表
#[derive(Debug, Serialize, Deserialize)]
pub struct Idea {
    pub id: i64,
    pub content: String,
    pub attachments: Vec<String>, // 附件路径数组
    pub created_at: i64, // Unix 时间戳
    pub date: String, // YYYY-MM-DD
}

/// 已完成事项表
#[derive(Debug, Serialize, Deserialize)]
pub struct DoneTask {
    pub id: i64,
    pub content: String,
    pub start_time: i64, // Unix 时间戳
    pub end_time: i64, // Unix 时间戳
    pub attachments: Vec<String>, // 附件路径数组
    pub created_at: i64, // Unix 时间戳
    pub date: String, // YYYY-MM-DD
}

/// 提示词表
#[derive(Debug, Serialize, Deserialize)]
pub struct Prompt {
    pub id: i64,
    pub name: String,
    pub content: String,
    pub created_at: i64, // Unix 时间戳
    pub updated_at: i64, // Unix 时间戳
}

/// AI 配置结构（JSON 文件存储）
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
