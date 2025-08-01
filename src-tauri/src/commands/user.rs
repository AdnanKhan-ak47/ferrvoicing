use chrono::Utc;
use reqwest::blocking::multipart;
use rusqlite::{params, Connection};
use serde::{Deserialize, Serialize};
use serde_json::json;
use sha2::{Digest, Sha256};
use std::fs;
use std::{fs::File, io, path::PathBuf};
use uuid::Uuid;

use crate::db::init_db;
use crate::utils::hash_email;
use crate::{models::user::UserSession, utils::get_app_data_path};

#[tauri::command]
pub fn signup_user(name: String, email: String, password: String) -> Result<String, String> {
    let app_data_path = get_app_data_path()?;
    let db_path = app_data_path.join("app_data.db");
    let conn = Connection::open(db_path).map_err(|e| e.to_string())?;

    let user_hash = hash_email(&email);
    let user_dir = app_data_path.join("users").join(&user_hash);

    // 1. Create the user directory
    std::fs::create_dir_all(&user_dir).map_err(|e| e.to_string())?;

    let password_hash = format!("{:x}", Sha256::digest(password.as_bytes()));
    let created_at = Utc::now().to_rfc3339();

    conn.execute(
        "INSERT INTO users (
        id,
        name,
        email,
        password_hash,
        created_at
    ) VALUES (?1, ?2, ?3, ?4, ?5)",
        params![
            Uuid::new_v4().to_string(), // Generate a new UUID for the invoice ID
            name,
            email,
            password_hash,
            created_at
        ],
    )
    .map_err(|e| e.to_string())?;

    Ok(format!("User created successfully!"))
}

#[tauri::command]
pub fn login(email: String, password: String) -> Result<String, String> {
    let app_data_path = get_app_data_path()?;
    let db_path = app_data_path.join("app_data.db");
    let conn = Connection::open(&db_path).map_err(|e| e.to_string())?;

    let stored_hash: String = conn
        .query_row(
            "SELECT password_hash from users WHERE email = $1",
            params![&email],
            |row| row.get(0),
        )
        .map_err(|_| "Invalid email or password.".to_string())?;

    let password_hash = format!("{:x}", Sha256::digest(password.as_bytes()));

    let user_session = UserSession {
        user_email: email.clone(),
        user_hash: hash_email(&email),
    };

    if stored_hash == password_hash {
        // Initializing User Specific DB after logging in
        // Ensure parent directories exist
        let _session_res = store_session(user_session).map_err(|e| e.to_string())?;
        if let Some(parent) = db_path.parent() {
            std::fs::create_dir_all(parent).map_err(|e| e.to_string())?;
        }
        init_db().expect("Failed to initialize the database");
        Ok(format!("User Logged In!"))
    } else {
        Err("Invalid email or password.".to_string())
    }
}

// Store Session
pub fn store_session(user_session: UserSession) -> Result<(), io::Error> {
    let path = get_app_data_path().map_err(|e| io::Error::new(io::ErrorKind::Other, e))?; // convert String to io::Error
    let session_path = path.join(".session");
    let session_json = json!(user_session).to_string();
    fs::write(session_path, session_json)?;
    Ok(())
}

#[tauri::command]
pub fn logout() -> Result<String, String> {
    let session_path = get_app_data_path()?.join(".session");

    if session_path.exists() {
        fs::remove_file(&session_path).map_err(|e| e.to_string())?;
        Ok("Logged out successfully.".to_string())
    } else {
        Ok("No active session.".to_string()) // already logged out
    }
}

#[tauri::command]
pub fn is_logged_in() -> Result<bool, String> {
    let session_path = get_app_data_path()?.join(".session");

    if !session_path.exists() {
        return Ok(false);
    }

    let content = fs::read_to_string(session_path).map_err(|e| e.to_string())?;

    // Try to parse the JSON into a struct
    let session: Result<UserSession, _> = serde_json::from_str(&content);
    Ok(session.is_ok()) // true if parsed successfully
}

// Want to implement Google OAuth2 authentication flow with data backup in future, below code is not in use anywhere yet

#[tauri::command]
pub async fn launch_google_auth(app: tauri::AppHandle) -> Result<(), String> {
    let client_id = "ENTER_CLIENT_SECRET ";
    let redirect_uri = "http://localhost:5173/oauth/callback";
    let scope = urlencoding::encode("https://www.googleapis.com/auth/drive.file email profile");

    let auth_url = format!(
        "https://accounts.google.com/o/oauth2/v2/auth?response_type=code&client_id={}&redirect_uri={}&scope={}&access_type=offline&prompt=consent",
        client_id, redirect_uri, scope
    );

    tauri_plugin_shell::ShellExt::shell(&app)
        .open(auth_url, None)
        .map_err(|e| format!("Failed to open browser: {}", e))
}

#[tauri::command]
pub async fn handle_google_auth_code(auth_code: String) -> Result<String, String> {
    let client_id = "ENTER_CLIENT_SECRET";
    let redirect_uri = "http://localhost:5173/oauth/callback";

    let mut params = std::collections::HashMap::new();
    params.insert("code", auth_code);
    params.insert("client_id", client_id.to_string());
    params.insert("redirect_uri", redirect_uri.to_string());
    params.insert("grant_type", "authorization_code".to_string());

    let client = reqwest::Client::new();
    let response = client
        .post("https://oauth2.googleapis.com/token")
        .form(&params)
        .send()
        .await
        .map_err(|e| format!("Failed to send token request: {}", e))?;

    let json = response
        .json::<serde_json::Value>()
        .await
        .map_err(|e| format!("Failed to parse response: {}", e))?;

    println!("Token response: {:?}", json);
    Ok(json.to_string())
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct GoogleToken {
    pub access_token: String,
    pub expires_in: u64,
    pub refresh_token: Option<String>,
    pub scope: String,
    pub token_type: String,
    pub id_token: Option<String>,
}

// Save token to user's directory
pub fn save_google_token(
    user_hash: &str,
    token: &GoogleToken,
    base_path: &PathBuf,
) -> Result<(), String> {
    let user_dir = base_path.join("users").join(user_hash);
    fs::create_dir_all(&user_dir).map_err(|e| format!("Failed to create user dir: {}", e))?;

    let token_path = user_dir.join("google_token.json");
    let json = serde_json::to_string_pretty(&token).map_err(|e| e.to_string())?;

    fs::write(token_path, json).map_err(|e| e.to_string())
}

pub fn upload_file_to_drive(
    token: &GoogleToken,
    file_path: &PathBuf,
    file_name_on_drive: &str,
) -> Result<(), String> {
    let access_token = &token.access_token;
    let client = reqwest::blocking::Client::new();

    let metadata = serde_json::json!({
        "name": file_name_on_drive,
    });

    let file = File::open(file_path).map_err(|e| format!("Failed to open file: {}", e))?;
    let form = multipart::Form::new()
        .text("metadata", metadata.to_string())
        .part(
            "file",
            multipart::Part::reader(file)
                .file_name(file_name_on_drive.to_string())
                .mime_str("application/octet-stream")
                .unwrap(),
        );

    let res = client
        .post("https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart")
        .bearer_auth(access_token)
        .multipart(form)
        .send()
        .map_err(|e| format!("HTTP error: {}", e))?;

    if res.status().is_success() {
        Ok(())
    } else {
        Err(format!("Upload failed: {}", res.text().unwrap_or_default()))
    }
}
