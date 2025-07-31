use tauri::command;

use crate::{commands::{company::{add_company, search_company}, invoice::{create_invoice, get_invoice_ids, search_invoices}}, db::{init_db, init_global_db}, utils::get_app_data_path};
pub mod db;
pub mod models;
pub mod commands;
pub mod utils;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .setup(|app| {
            if cfg!(debug_assertions) {
                app.handle().plugin(
                    tauri_plugin_log::Builder::default()
                        .level(log::LevelFilter::Info)
                        .build(),
                )?;
            }
            crate::utils::init_app_data_path(&app.handle())?;
            init_global_db().expect("Failed to initialze app's global db");
            init_db().expect("Failed to initialize the database");
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            greet,
            add_company,
            search_company,
            search_invoices,
            create_invoice,
            get_invoice_ids
            ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");

}

#[command]
fn greet(name: &str) -> String {
    format!("Hello, {}!", name)
}
