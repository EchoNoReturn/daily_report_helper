use tauri::State;
use sqlx::{Pool, Sqlite, Row, Column};

use crate::models::{TodayRecords, Idea, DoneTask, Prompt, ApiConfig};
use crate::database::DbState;
use crate::config::ConfigManager;

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

// ========== AI 配置命令 (JSON 文件存储) ==========

#[tauri::command(rename_all = "snake_case")]
pub async fn save_api_config(
    app: tauri::AppHandle,
    api_key: String,
    api_url: String,
    model: String,
) -> Result<(), String> {
    let config_manager = ConfigManager::new(&app)?;
    let config = ApiConfig { api_key, api_url, model };
    config_manager.save_config(&config)
}

#[tauri::command]
pub async fn get_api_config(
    app: tauri::AppHandle,
) -> Result<Option<ApiConfig>, String> {
    let config_manager = ConfigManager::new(&app)?;
    config_manager.load_config()
}

// ========== 随手记命令 (使用时间戳) ==========

#[tauri::command(rename_all = "snake_case")]
pub async fn add_idea(
    state: State<'_, DbState>,
    content: String,
    attachments: Vec<String>,
    created_at: i64,
) -> Result<i64, String> {
    println!("add_idea called with content: {}, attachments: {:?}, created_at: {}", content, attachments, created_at);
    let pool = get_pool(&state).await?;

    let init_query = r#"
        CREATE TABLE IF NOT EXISTS ideas (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            content TEXT NOT NULL,
            attachments TEXT NOT NULL,
            created_at INTEGER NOT NULL,
            date TEXT NOT NULL
        );
        CREATE INDEX IF NOT EXISTS idx_ideas_date ON ideas(date);
    "#;
    execute_write(&pool, init_query, &[]).await?;

    // 将时间戳转换为日期字符串
    let date = chrono::DateTime::from_timestamp(created_at, 0)
        .ok_or("无效的时间戳")?
        .format("%Y-%m-%d")
        .to_string();

    let attachments_json = serde_json::to_string(&attachments).unwrap_or_else(|_| "[]".to_string());

    execute_write(
        &pool,
        "INSERT INTO ideas (content, attachments, created_at, date) VALUES (?, ?, ?, ?)",
        &[&content, &attachments_json, &created_at.to_string(), &date],
    ).await?;

    let result = execute_query(&pool, "SELECT last_insert_rowid() as id", &[]).await?;
    let id = result.first().and_then(|r| r["id"].as_i64()).unwrap_or(0);
    Ok(id)
}

#[tauri::command(rename_all = "snake_case")]
pub async fn add_done_task(
    state: State<'_, DbState>,
    content: String,
    start_time: i64,
    end_time: i64,
    attachments: Vec<String>,
    created_at: i64,
) -> Result<i64, String> {
    let pool = get_pool(&state).await?;

    let init_query = r#"
        CREATE TABLE IF NOT EXISTS done_tasks (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            content TEXT NOT NULL,
            start_time INTEGER NOT NULL,
            end_time INTEGER NOT NULL,
            attachments TEXT NOT NULL,
            created_at INTEGER NOT NULL,
            date TEXT NOT NULL
        );
        CREATE INDEX IF NOT EXISTS idx_tasks_date ON done_tasks(date);
    "#;
    execute_write(&pool, init_query, &[]).await?;

    // 将开始时间戳转换为日期字符串
    let date = chrono::DateTime::from_timestamp(start_time, 0)
        .ok_or("无效的时间戳")?
        .format("%Y-%m-%d")
        .to_string();

    let attachments_json = serde_json::to_string(&attachments).unwrap_or_else(|_| "[]".to_string());

    execute_write(
        &pool,
        "INSERT INTO done_tasks (content, start_time, end_time, attachments, created_at, date) VALUES (?, ?, ?, ?, ?, ?)",
        &[&content, &start_time.to_string(), &end_time.to_string(), &attachments_json, &created_at.to_string(), &date],
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
            created_at: row["created_at"].as_i64().unwrap_or(0),
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
            start_time: row["start_time"].as_i64().unwrap_or(0),
            end_time: row["end_time"].as_i64().unwrap_or(0),
            attachments,
            created_at: row["created_at"].as_i64().unwrap_or(0),
            date: row["date"].as_str().unwrap_or("").to_string(),
        });
    }

    Ok(TodayRecords { ideas, tasks })
}

#[tauri::command]
pub async fn get_records_by_date_range(
    state: State<'_, DbState>,
    start_date: String,
    end_date: String,
) -> Result<TodayRecords, String> {
    let pool = get_pool(&state).await?;

    let ideas_result = execute_query(
        &pool,
        "SELECT * FROM ideas WHERE date >= ? AND date <= ? ORDER BY date DESC, created_at DESC",
        &[&start_date, &end_date],
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
            created_at: row["created_at"].as_i64().unwrap_or(0),
            date: row["date"].as_str().unwrap_or("").to_string(),
        });
    }

    let tasks_result = execute_query(
        &pool,
        "SELECT * FROM done_tasks WHERE date >= ? AND date <= ? ORDER BY date DESC, start_time DESC",
        &[&start_date, &end_date],
    ).await?;

    let mut tasks = Vec::new();
    for row in tasks_result {
        let attachments_json = row["attachments"].as_str().unwrap_or("[]");
        let attachments: Vec<String> = serde_json::from_str(attachments_json)
            .unwrap_or_else(|_| Vec::new());

        tasks.push(DoneTask {
            id: row["id"].as_i64().unwrap_or(0),
            content: row["content"].as_str().unwrap_or("").to_string(),
            start_time: row["start_time"].as_i64().unwrap_or(0),
            end_time: row["end_time"].as_i64().unwrap_or(0),
            attachments,
            created_at: row["created_at"].as_i64().unwrap_or(0),
            date: row["date"].as_str().unwrap_or("").to_string(),
        });
    }

    Ok(TodayRecords { ideas, tasks })
}

// ========== 删除命令 ==========

#[tauri::command]
pub async fn delete_idea(
    state: State<'_, DbState>,
    id: i64,
) -> Result<(), String> {
    let pool = get_pool(&state).await?;

    // 确保表存在
    let init_query = r#"
        CREATE TABLE IF NOT EXISTS ideas (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            content TEXT NOT NULL,
            attachments TEXT NOT NULL,
            created_at INTEGER NOT NULL,
            date TEXT NOT NULL
        );
    "#;
    execute_write(&pool, init_query, &[]).await?;

    // 执行删除
    execute_write(
        &pool,
        "DELETE FROM ideas WHERE id = ?",
        &[&id.to_string()],
    ).await?;

    Ok(())
}

#[tauri::command]
pub async fn delete_task(
    state: State<'_, DbState>,
    id: i64,
) -> Result<(), String> {
    let pool = get_pool(&state).await?;

    // 确保表存在
    let init_query = r#"
        CREATE TABLE IF NOT EXISTS done_tasks (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            content TEXT NOT NULL,
            start_time INTEGER NOT NULL,
            end_time INTEGER NOT NULL,
            attachments TEXT NOT NULL,
            created_at INTEGER NOT NULL,
            date TEXT NOT NULL
        );
    "#;
    execute_write(&pool, init_query, &[]).await?;

    // 执行删除
    execute_write(
        &pool,
        "DELETE FROM done_tasks WHERE id = ?",
        &[&id.to_string()],
    ).await?;

    Ok(())
}

// ========== 提示词管理命令 ==========

#[tauri::command]
pub async fn add_prompt(
    state: State<'_, DbState>,
    name: String,
    content: String,
) -> Result<i64, String> {
    let pool = get_pool(&state).await?;

    let init_query = r#"
        CREATE TABLE IF NOT EXISTS prompts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL UNIQUE,
            content TEXT NOT NULL,
            created_at INTEGER NOT NULL,
            updated_at INTEGER NOT NULL
        );
        CREATE INDEX IF NOT EXISTS idx_prompts_name ON prompts(name);
    "#;
    execute_write(&pool, init_query, &[]).await?;

    let now = chrono::Local::now().timestamp();

    execute_write(
        &pool,
        "INSERT INTO prompts (name, content, created_at, updated_at) VALUES (?, ?, ?, ?)",
        &[&name, &content, &now.to_string(), &now.to_string()],
    ).await?;

    let result = execute_query(&pool, "SELECT last_insert_rowid() as id", &[]).await?;
    let id = result.first().and_then(|r| r["id"].as_i64()).unwrap_or(0);
    Ok(id)
}

#[tauri::command]
pub async fn get_prompts(
    state: State<'_, DbState>,
) -> Result<Vec<Prompt>, String> {
    let pool = get_pool(&state).await?;

    let init_query = r#"
        CREATE TABLE IF NOT EXISTS prompts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL UNIQUE,
            content TEXT NOT NULL,
            created_at INTEGER NOT NULL,
            updated_at INTEGER NOT NULL
        );
    "#;
    execute_write(&pool, init_query, &[]).await?;

    let prompts_result = execute_query(
        &pool,
        "SELECT * FROM prompts ORDER BY updated_at DESC",
        &[],
    ).await?;

    let mut prompts = Vec::new();
    for row in prompts_result {
        prompts.push(Prompt {
            id: row["id"].as_i64().unwrap_or(0),
            name: row["name"].as_str().unwrap_or("").to_string(),
            content: row["content"].as_str().unwrap_or("").to_string(),
            created_at: row["created_at"].as_i64().unwrap_or(0),
            updated_at: row["updated_at"].as_i64().unwrap_or(0),
        });
    }

    Ok(prompts)
}

#[tauri::command]
pub async fn update_prompt(
    state: State<'_, DbState>,
    id: i64,
    name: String,
    content: String,
) -> Result<(), String> {
    let pool = get_pool(&state).await?;

    let init_query = r#"
        CREATE TABLE IF NOT EXISTS prompts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL UNIQUE,
            content TEXT NOT NULL,
            created_at INTEGER NOT NULL,
            updated_at INTEGER NOT NULL
        );
    "#;
    execute_write(&pool, init_query, &[]).await?;

    let now = chrono::Local::now().timestamp();

    execute_write(
        &pool,
        "UPDATE prompts SET name = ?, content = ?, updated_at = ? WHERE id = ?",
        &[&name, &content, &now.to_string(), &id.to_string()],
    ).await?;

    Ok(())
}

#[tauri::command]
pub async fn delete_prompt(
    state: State<'_, DbState>,
    id: i64,
) -> Result<(), String> {
    let pool = get_pool(&state).await?;

    // 确保表存在
    let init_query = r#"
        CREATE TABLE IF NOT EXISTS prompts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL UNIQUE,
            content TEXT NOT NULL,
            created_at INTEGER NOT NULL,
            updated_at INTEGER NOT NULL
        );
    "#;
    execute_write(&pool, init_query, &[]).await?;

    // 执行删除
    execute_write(
        &pool,
        "DELETE FROM prompts WHERE id = ?",
        &[&id.to_string()],
    ).await?;

    Ok(())
}