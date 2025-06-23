use rusqlite::{Connection, Result};
use tauri::command;

const DB_PATH: &str = "app_data.db";

fn run_schema_files(conn: &Connection, files: &[&str]) -> Result<()> {
    for file in files {
        let sql = std::fs::read_to_string(file).map_err(|e| rusqlite::Error::FromSqlConversionFailure(0, rusqlite::types::Type::Text, Box::new(e)))?;
        conn.execute_batch(&sql)?;
    }
    Ok(())
}

pub fn get_connection() -> Result<Connection> {
    Connection::open(DB_PATH)
}

#[command]
pub fn init_db() -> Result<String, String> {
    let conn = Connection::open(DB_PATH).map_err(|e| e.to_string())?;

    run_schema_files(&conn, &[
        "src/db/schema/invoice.sql",
        "src/db/schema/company.sql",
    ]).map_err(|e| e.to_string())?;

    Ok("Database initialized successfully".to_string())
}
