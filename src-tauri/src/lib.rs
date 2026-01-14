mod models;
mod database;
mod commands;

use tauri::Manager;
use crate::database::DbState;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_fs::init())
        .invoke_handler(tauri::generate_handler![
            // 配置命令
            commands::save_api_config,
            commands::get_api_config,
            // 随手记命令
            commands::add_idea,
            commands::add_done_task,
            commands::get_today_records,
            // AI命令
            commands::generate_daily_report,
            commands::send_ai_message,
        ])
        .setup(|app| {
            // 将 DbState 管理为应用状态
            let db_state = DbState::new();
            app.manage(db_state.clone());

            // 初始化数据库
            let app_handle = app.handle().clone();
            tauri::async_runtime::spawn(async move {
                match database::init_database(&app_handle, db_state).await {
                    Ok(_) => println!("数据库初始化成功"),
                    Err(e) => eprintln!("数据库初始化失败: {}", e),
                }
            });

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
