use once_cell::sync::OnceCell;
use std::fs;
use std::path::PathBuf;
use sha2::{Sha256, Digest};
use tauri::{AppHandle, Manager};

use crate::models::user::UserSession;

static APP_DATA_PATH: OnceCell<PathBuf> = OnceCell::new();

/// Call this ONCE at startup (e.g., in `setup()`)
pub fn init_app_data_path(app: &AppHandle) -> Result<(), String> {
    let path = app
        .path()
        .app_data_dir()
        .expect("Could not resolve app_data_dir");

    fs::create_dir_all(&path).map_err(|e| e.to_string())?;
    APP_DATA_PATH
        .set(path)
        .map_err(|_| "Path already initialized".to_string())?;

    Ok(())
}

/// Call this ANYWHERE later to get the path
pub fn get_app_data_path() -> Result<PathBuf, String> {
    APP_DATA_PATH
        .get()
        .cloned()
        .ok_or_else(|| "App data path not initialized".to_string())
}

pub fn get_session_token() -> Result<String, String> {
    let path = get_app_data_path()?.join(".session");

    fs::read_to_string(path).map_err(|e| e.to_string())
}

pub fn get_current_user_hash() -> Result<String, String> {
    let json_string = get_session_token()?;
    let token: UserSession = serde_json::from_str(&json_string).map_err(|e| e.to_string())?;
    Ok(token.user_hash)
}

pub fn get_current_user_db_path() -> Result<PathBuf, String> {
    let app_data_path = get_app_data_path()?;
    let user_hash = get_current_user_hash()?;
    let db_path = app_data_path.join("users").join(user_hash).join("user_data.db");
    Ok(db_path)
}


pub fn hash_email(email: &str) -> String {
    let mut hasher = Sha256::new();
    hasher.update(email);
    format!("{:x}", hasher.finalize())
}

pub fn get_user_db_path(base_dir: &PathBuf, email: &str) -> PathBuf {
    let hash = hash_email(email);
    base_dir.join("users").join(hash).join("user_data.db")
}

