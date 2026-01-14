use sqlx::{sqlite::SqlitePoolOptions, Pool, Sqlite};
use tauri::{AppHandle, Manager};
use std::sync::Arc;
use tokio::sync::Mutex;

#[derive(Clone)]
pub struct DbState {
    pub pool: Arc<Mutex<Option<Pool<Sqlite>>>>,
}

impl DbState {
    pub fn new() -> Self {
        Self {
            pool: Arc::new(Mutex::new(None)),
        }
    }

    pub async fn get_pool(&self) -> Result<Pool<Sqlite>, String> {
        let lock = self.pool.lock().await;
        lock.clone().ok_or_else(|| "Database not initialized".to_string())
    }
}

pub async fn init_database(app: &AppHandle, db_state: DbState) -> Result<(), String> {
    // 获取应用配置目录（用于存储数据库文件）
    let app_config_dir = app.path()
        .app_config_dir()
        .map_err(|e| format!("无法获取应用配置目录: {}", e))?;

    // 确保目录存在
    std::fs::create_dir_all(&app_config_dir)
        .map_err(|e| format!("无法创建目录: {}", e))?;

    // 数据库文件路径
    let db_path = app_config_dir.join("data.db");
    let db_url = format!("sqlite://{}?mode=rwc", db_path.to_string_lossy());

    println!("数据库路径: {}", db_url);

    // 创建数据库连接池
    let pool = SqlitePoolOptions::new()
        .max_connections(5)
        .connect(&db_url)
        .await
        .map_err(|e| format!("数据库连接失败: {}", e))?;

    // 初始化表
    init_tables(&pool).await?;

    // 保存到状态
    let mut lock = db_state.pool.lock().await;
    *lock = Some(pool);

    println!("数据库初始化成功");
    Ok(())
}

async fn init_tables(pool: &Pool<Sqlite>) -> Result<(), String> {
    // configs 表
    sqlx::query(
        r#"
        CREATE TABLE IF NOT EXISTS configs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            key TEXT NOT NULL UNIQUE,
            value TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );
        "#
    )
    .execute(pool)
    .await
    .map_err(|e| format!("创建 configs 表失败: {}", e))?;

    // ideas 表
    sqlx::query(
        r#"
        CREATE TABLE IF NOT EXISTS ideas (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            content TEXT NOT NULL,
            attachments TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            date TEXT NOT NULL
        );
        "#
    )
    .execute(pool)
    .await
    .map_err(|e| format!("创建 ideas 表失败: {}", e))?;

    // 创建索引
    sqlx::query("CREATE INDEX IF NOT EXISTS idx_ideas_date ON ideas(date)")
        .execute(pool)
        .await
        .map_err(|e| format!("创建索引失败: {}", e))?;

    // done_tasks 表
    sqlx::query(
        r#"
        CREATE TABLE IF NOT EXISTS done_tasks (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            content TEXT NOT NULL,
            start_time DATETIME NOT NULL,
            end_time DATETIME NOT NULL,
            attachments TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            date TEXT NOT NULL
        );
        "#
    )
    .execute(pool)
    .await
    .map_err(|e| format!("创建 done_tasks 表失败: {}", e))?;

    // 创建索引
    sqlx::query("CREATE INDEX IF NOT EXISTS idx_tasks_date ON done_tasks(date)")
        .execute(pool)
        .await
        .map_err(|e| format!("创建索引失败: {}", e))?;

    Ok(())
}
