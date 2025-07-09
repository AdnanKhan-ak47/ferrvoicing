use std::fs;
use serde::{Serialize, Deserialize};
use reqwest::blocking::multipart;
use std::{fs::File, path::PathBuf};

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
pub fn save_google_token(user_hash: &str, token: &GoogleToken, base_path: &PathBuf) -> Result<(), String> {
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
                .mime_str("application/octet-stream").unwrap()
        );

    let res = client.post("https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart")
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

