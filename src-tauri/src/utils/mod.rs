use once_cell::sync::OnceCell;
use std::fs;
use std::path::PathBuf;
use sha2::{Sha256, Digest};
use tauri::{AppHandle, Manager};

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

pub fn hash_email(email: &str) -> String {
    let mut hasher = Sha256::new();
    hasher.update(email);
    format!("{:x}", hasher.finalize())
}

pub fn get_user_db_path(base_dir: &PathBuf, email: &str) -> PathBuf {
    let hash = hash_email(email);
    base_dir.join("users").join(hash).join("user_data.db")
}

