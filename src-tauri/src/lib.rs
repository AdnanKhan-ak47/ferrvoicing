mod user;

use tauri::command;

use crate::{commands::company::{add_company, search_company}, db::init_db};
pub mod db;
pub mod models;
pub mod commands;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .setup(|app| {
            if cfg!(debug_assertions) {
                app.handle().plugin(
                    tauri_plugin_log::Builder::default()
                        .level(log::LevelFilter::Info)
                        .build(),
                )?;
            }
            init_db().expect("Failed to initialize the database");
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            greet,
            add_company,
            search_company,
            ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

#[command]
fn greet(name: &str) -> String {
    format!("Hello, {}!", name)
}
