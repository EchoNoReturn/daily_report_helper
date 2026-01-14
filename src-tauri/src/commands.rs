use tauri::State;
use sqlx::{Pool, Sqlite, Row, Column};

use crate::models::{ApiConfig, TodayRecords, Idea, DoneTask};
use crate::database::DbState;

// 辅助函数：获取数据库连接池
async fn get_pool(state: &State<'_, DbState>) -> Result<Pool<Sqlite>, String> {
    state.get_pool().await
}

// 辅助函数：执行查询并返回结果
async fn execute_query(
    pool: &Pool<Sqlite>,
    query: &str,
    params: &[&str],
) -> Result<Vec<serde_json::Value>, String> {
    let mut query_builder = sqlx::query(query);

    for param in params {
        query_builder = query_builder.bind(param);
    }

    let rows = query_builder
        .fetch_all(pool)
        .await
        .map_err(|e| format!("查询失败: {}", e))?;

    let result: Vec<serde_json::Value> = rows.iter().map(|row| {
        let mut map = serde_json::Map::new();
        for (i, column) in row.columns().iter().enumerate() {
            let name = column.name();
            let value: serde_json::Value = if let Ok(v) = row.try_get::<i64, _>(i) {
                serde_json::Value::from(v)
            } else if let Ok(v) = row.try_get::<f64, _>(i) {
                serde_json::Value::from(v)
            } else if let Ok(v) = row.try_get::<bool, _>(i) {
                serde_json::Value::from(v)
            } else if let Ok(v) = row.try_get::<String, _>(i) {
                serde_json::Value::from(v)
            } else {
                serde_json::Value::Null
            };
            map.insert(name.to_string(), value);
        }
        serde_json::Value::Object(map)
    }).collect();

    Ok(result)
}

// 辅助函数：执行写操作
async fn execute_write(
    pool: &Pool<Sqlite>,
    query: &str,
    params: &[&str],
) -> Result<(), String> {
    let mut query_builder = sqlx::query(query);

    for param in params {
        query_builder = query_builder.bind(param);
    }

    query_builder
        .execute(pool)
        .await
        .map_err(|e| format!("写入失败: {}", e))?;
    Ok(())
}

// ========== 配置命令 ==========

#[tauri::command]
pub async fn save_api_config(
    state: State<'_, DbState>,
    api_key: String,
    api_url: String,
    model: String,
) -> Result<(), String> {
    let pool = get_pool(&state).await?;

    let init_query = r#"
        CREATE TABLE IF NOT EXISTS configs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            key TEXT NOT NULL UNIQUE,
            value TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );
    "#;
    execute_write(&pool, init_query, &[]).await?;

    execute_write(
        &pool,
        "INSERT OR REPLACE INTO configs (key, value) VALUES (?, ?)",
        &[&api_key, &api_key],
    ).await?;
    execute_write(
        &pool,
        "INSERT OR REPLACE INTO configs (key, value) VALUES (?, ?)",
        &[&api_url, &api_url],
    ).await?;
    execute_write(
        &pool,
        "INSERT OR REPLACE INTO configs (key, value) VALUES (?, ?)",
        &[&model, &model],
    ).await?;

    Ok(())
}

#[tauri::command]
pub async fn get_api_config(
    state: State<'_, DbState>,
) -> Result<Option<ApiConfig>, String> {
    let pool = get_pool(&state).await?;

    let init_query = r#"
        CREATE TABLE IF NOT EXISTS configs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            key TEXT NOT NULL UNIQUE,
            value TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );
    "#;
    execute_write(&pool, init_query, &[]).await?;

    let api_key_result = execute_query(&pool, "SELECT value FROM configs WHERE key = ?", &["api_key"]).await?;
    let api_url_result = execute_query(&pool, "SELECT value FROM configs WHERE key = ?", &["api_url"]).await?;
    let model_result = execute_query(&pool, "SELECT value FROM configs WHERE key = ?", &["model"]).await?;

    if let (Some(api_key), Some(api_url), Some(model)) = (
        api_key_result.first().and_then(|r| r["value"].as_str()).map(String::from),
        api_url_result.first().and_then(|r| r["value"].as_str()).map(String::from),
        model_result.first().and_then(|r| r["value"].as_str()).map(String::from),
    ) {
        Ok(Some(ApiConfig { api_key, api_url, model }))
    } else {
        Ok(None)
    }
}

// ========== 随手记命令 ==========

#[tauri::command]
pub async fn add_idea(
    state: State<'_, DbState>,
    content: String,
    attachments: Vec<String>,
    timestamp: String,
) -> Result<i64, String> {
    let pool = get_pool(&state).await?;

    let init_query = r#"
        CREATE TABLE IF NOT EXISTS ideas (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            content TEXT NOT NULL,
            attachments TEXT NOT NULL,
            created_at DATETIME NOT NULL,
            date TEXT NOT NULL
        );
        CREATE INDEX IF NOT EXISTS idx_ideas_date ON ideas(date);
    "#;
    execute_write(&pool, init_query, &[]).await?;

    let created_at = chrono::DateTime::parse_from_rfc3339(&timestamp)
        .map_err(|e| format!("时间解析失败: {}", e))?
        .with_timezone(&chrono::Local)
        .format("%Y-%m-%d %H:%M:%S")
        .to_string();

    let date = chrono::DateTime::parse_from_rfc3339(&timestamp)
        .map_err(|e| format!("时间解析失败: {}", e))?
        .with_timezone(&chrono::Local)
        .format("%Y-%m-%d")
        .to_string();

    let attachments_json = serde_json::to_string(&attachments).unwrap_or_else(|_| "[]".to_string());

    execute_write(
        &pool,
        "INSERT INTO ideas (content, attachments, created_at, date) VALUES (?, ?, ?, ?)",
        &[&content, &attachments_json, &created_at, &date],
    ).await?;

    let result = execute_query(&pool, "SELECT last_insert_rowid() as id", &[]).await?;
    let id = result.first().and_then(|r| r["id"].as_i64()).unwrap_or(0);
    Ok(id)
}

#[tauri::command]
pub async fn add_done_task(
    state: State<'_, DbState>,
    content: String,
    start_time: String,
    end_time: String,
    attachments: Vec<String>,
    timestamp: String,
) -> Result<i64, String> {
    let pool = get_pool(&state).await?;

    let init_query = r#"
        CREATE TABLE IF NOT EXISTS done_tasks (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            content TEXT NOT NULL,
            start_time DATETIME NOT NULL,
            end_time DATETIME NOT NULL,
            attachments TEXT NOT NULL,
            created_at DATETIME NOT NULL,
            date TEXT NOT NULL
        );
        CREATE INDEX IF NOT EXISTS idx_tasks_date ON done_tasks(date);
    "#;
    execute_write(&pool, init_query, &[]).await?;

    let start = chrono::DateTime::parse_from_rfc3339(&start_time)
        .map_err(|e| format!("时间解析失败: {}", e))?
        .with_timezone(&chrono::Local)
        .format("%Y-%m-%d %H:%M:%S")
        .to_string();

    let end = chrono::DateTime::parse_from_rfc3339(&end_time)
        .map_err(|e| format!("时间解析失败: {}", e))?
        .with_timezone(&chrono::Local)
        .format("%Y-%m-%d %H:%M:%S")
        .to_string();

    let date = chrono::DateTime::parse_from_rfc3339(&start_time)
        .unwrap()
        .with_timezone(&chrono::Local)
        .format("%Y-%m-%d")
        .to_string();

    let created_at = chrono::DateTime::parse_from_rfc3339(&timestamp)
        .map_err(|e| format!("时间解析失败: {}", e))?
        .with_timezone(&chrono::Local)
        .format("%Y-%m-%d %H:%M:%S")
        .to_string();

    let attachments_json = serde_json::to_string(&attachments).unwrap_or_else(|_| "[]".to_string());

    execute_write(
        &pool,
        "INSERT INTO done_tasks (content, start_time, end_time, attachments, created_at, date) VALUES (?, ?, ?, ?, ?, ?)",
        &[&content, &start, &end, &attachments_json, &created_at, &date],
    ).await?;

    let result = execute_query(&pool, "SELECT last_insert_rowid() as id", &[]).await?;
    let id = result.first().and_then(|r| r["id"].as_i64()).unwrap_or(0);
    Ok(id)
}

#[tauri::command]
pub async fn get_today_records(
    state: State<'_, DbState>,
) -> Result<TodayRecords, String> {
    let pool = get_pool(&state).await?;
    let date = chrono::Local::now().format("%Y-%m-%d").to_string();

    let ideas_result = execute_query(
        &pool,
        "SELECT * FROM ideas WHERE date = ? ORDER BY created_at DESC",
        &[&date],
    ).await?;

    let mut ideas = Vec::new();
    for row in ideas_result {
        let attachments_json = row["attachments"].as_str().unwrap_or("[]");
        let attachments: Vec<String> = serde_json::from_str(attachments_json)
            .unwrap_or_else(|_| Vec::new());

        ideas.push(Idea {
            id: row["id"].as_i64().unwrap_or(0),
            content: row["content"].as_str().unwrap_or("").to_string(),
            attachments,
            created_at: chrono::DateTime::parse_from_str(
                row["created_at"].as_str().unwrap_or(""),
                "%Y-%m-%d %H:%M:%S",
            )
            .unwrap_or_else(|_| chrono::Local::now().fixed_offset())
            .with_timezone(&chrono::Local),
            date: row["date"].as_str().unwrap_or("").to_string(),
        });
    }

    let tasks_result = execute_query(
        &pool,
        "SELECT * FROM done_tasks WHERE date = ? ORDER BY start_time ASC",
        &[&date],
    ).await?;

    let mut tasks = Vec::new();
    for row in tasks_result {
        let attachments_json = row["attachments"].as_str().unwrap_or("[]");
        let attachments: Vec<String> = serde_json::from_str(attachments_json)
            .unwrap_or_else(|_| Vec::new());

        tasks.push(DoneTask {
            id: row["id"].as_i64().unwrap_or(0),
            content: row["content"].as_str().unwrap_or("").to_string(),
            start_time: chrono::DateTime::parse_from_str(
                row["start_time"].as_str().unwrap_or(""),
                "%Y-%m-%d %H:%M:%S",
            )
            .unwrap_or_else(|_| chrono::Local::now().fixed_offset())
            .with_timezone(&chrono::Local),
            end_time: chrono::DateTime::parse_from_str(
                row["end_time"].as_str().unwrap_or(""),
                "%Y-%m-%d %H:%M:%S",
            )
            .unwrap_or_else(|_| chrono::Local::now().fixed_offset())
            .with_timezone(&chrono::Local),
            attachments,
            created_at: chrono::DateTime::parse_from_str(
                row["created_at"].as_str().unwrap_or(""),
                "%Y-%m-%d %H:%M:%S",
            )
            .unwrap_or_else(|_| chrono::Local::now().fixed_offset())
            .with_timezone(&chrono::Local),
            date: row["date"].as_str().unwrap_or("").to_string(),
        });
    }

    Ok(TodayRecords { ideas, tasks })
}

// ========== AI 相关命令 ==========

#[tauri::command]
pub async fn generate_daily_report(
    state: State<'_, DbState>,
) -> Result<String, String> {
    let records = get_today_records(state.clone()).await?;

    let mut prompt = String::from("请根据以下内容生成一份日报:\n\n");

    if !records.ideas.is_empty() {
        prompt += "【今日想法】\n";
        for idea in records.ideas {
            prompt += &format!("- {}\n", idea.content);
        }
        prompt += "\n";
    }

    if !records.tasks.is_empty() {
        prompt += "【已完成事项】\n";
        for task in records.tasks {
            let start = task.start_time.format("%H:%M").to_string();
            let end = task.end_time.format("%H:%M").to_string();
            prompt += &format!("- [{}] {}\n", format!("{}-{}", start, end), task.content);
        }
    }

    prompt += "\n请以专业、简洁的格式生成日报。";

    send_ai_message(state, prompt).await
}

#[tauri::command]
pub async fn send_ai_message(
    state: State<'_, DbState>,
    message: String,
) -> Result<String, String> {
    let pool = get_pool(&state).await?;

    let api_key_result = execute_query(&pool, "SELECT value FROM configs WHERE key = ?", &["api_key"]).await?;
    let api_url_result = execute_query(&pool, "SELECT value FROM configs WHERE key = ?", &["api_url"]).await?;
    let model_result = execute_query(&pool, "SELECT value FROM configs WHERE key = ?", &["model"]).await?;

    let api_key = api_key_result.first().and_then(|r| r["value"].as_str()).ok_or("未配置 API Key")?;
    let api_url = api_url_result.first().and_then(|r| r["value"].as_str()).ok_or("未配置 API URL")?;
    let model = model_result.first().and_then(|r| r["value"].as_str()).unwrap_or("gpt-4");

    let client = reqwest::Client::new();
    let response = client
        .post(format!("{}/chat/completions", api_url))
        .header("Authorization", format!("Bearer {}", api_key))
        .json(&serde_json::json!({
            "model": model,
            "messages": [
                {
                    "role": "system",
                    "content": "你是一个专业的日报助手，擅长用简洁、专业的语言总结工作内容。"
                },
                {
                    "role": "user",
                    "content": message
                }
            ],
            "stream": false
        }))
        .send()
        .await
        .map_err(|e| format!("AI 请求失败: {}", e))?;

    let data: serde_json::Value = response.json()
        .await
        .map_err(|e| format!("解析响应失败: {}", e))?;

    let content = data["choices"][0]["message"]["content"]
        .as_str()
        .unwrap_or("未获取到回复")
        .to_string();

    Ok(content)
}
