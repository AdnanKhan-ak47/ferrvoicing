use rusqlite::{Connection, Result};
use tauri::command;

use crate::utils::{get_app_data_path, get_current_user_db_path};


fn run_schema_files(conn: &Connection, files: &[&str]) -> Result<()> {
    for file in files {
        let sql = std::fs::read_to_string(file).map_err(|e| rusqlite::Error::FromSqlConversionFailure(0, rusqlite::types::Type::Text, Box::new(e)))?;
        conn.execute_batch(&sql)?;
    }
    Ok(())
}

pub fn get_connection() -> Result<Connection, String> {
    let db_path = get_current_user_db_path()?;
    Connection::open(db_path).map_err(|e| e.to_string())
}

#[command]
pub fn init_global_db() -> Result<String, String> {
    let app_data_path = get_app_data_path()?;
    let db_path = app_data_path.join("app_data.db");

    let conn = Connection::open(db_path).map_err(|e| e.to_string())?;

    run_schema_files(&conn, &["src/db/schema/user.sql"])
        .map_err(|e| e.to_string())?;

    Ok("Global user database initialized.".to_string())
}


#[command]
pub fn init_db() -> Result<String, String> {
    let db_path = get_current_user_db_path()?;

    let conn = Connection::open(db_path).map_err(|e| e.to_string())?;

    run_schema_files(&conn, &[
        "src/db/schema/invoice.sql",
        "src/db/schema/company.sql",
    ]).map_err(|e| e.to_string())?;

    Ok("Database initialized successfully".to_string())
}
