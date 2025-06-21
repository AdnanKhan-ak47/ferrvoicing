use tauri::command;
use rusqlite::{Connection, Result};


// #[command]
// pub fn add_user(name: String, email: String) -> Result<String, String> {
//     let conn = Connection::open("app_data.db").map_err(|e| e.to_string())?;
//     conn.execute(
//         "INSERT INTO users (name, email) VALUES (?1, ?2)",
//         &[&name, &email],
//     ).map_err(|e| e.to_string())?;
//     Ok("User added successfully".into())
// }

// #[command]
// pub fn get_users() -> Result<Vec<(i32, String, String)>, String> {
//     let conn = Connection::open("app_data.db").map_err(|e| e.to_string())?;
//     let mut stmt = conn.prepare("SELECT id, name, email FROM users").map_err(|e| e.to_string())?;
    
//     let users = stmt.query_map([], |row| {
//         Ok((
//             row.get(0)?,
//             row.get(1)?,
//             row.get(2)?,
//         ))
//     })
//     .map_err(|e| e.to_string())?
//     .collect::<Result<_, _>>()
//     .map_err(|e| e.to_string())?;

//     Ok(users)
// }
