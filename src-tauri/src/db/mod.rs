use rusqlite::{Connection, Result};
use tauri::command;

#[command]
pub fn init_db() -> Result<String, String> {
    let conn = Connection::open("app_data.db").map_err(|e| e.to_string())?;

    conn.execute(
        "CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY,
            name TEXT NOT NULL,
            email TEXT NOT NULL UNIQUE
        )",
        [],
    ).map_err(|e| e.to_string())?;

    Ok("Database initialized successfully".to_string())
}
