use chrono::Utc;
use reqwest::blocking::multipart;
use rusqlite::{params, Connection};
use serde::{Deserialize, Serialize};
use serde_json::json;
use sha2::{Digest, Sha256};
use std::fs;
use std::{fs::File, io, path::PathBuf};
use uuid::Uuid;

use crate::db::{get_connection, init_db};
use crate::models::user::Profile;
use crate::utils::{get_current_user_db_path, get_current_user_hash, hash_email};
use crate::{models::user::UserSession, utils::get_app_data_path};

#[tauri::command]
pub fn signup_user(email: String, password: String) -> Result<String, String> {
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
        email,
        password_hash,
        created_at
    ) VALUES (?1, ?2, ?3, ?4)",
        params![
            Uuid::new_v4().to_string(), // Generate a new UUID for the invoice ID
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

    let (stored_hash, is_onboarded): (String, bool) = conn
        .query_row(
            "SELECT password_hash, is_onboarded FROM users WHERE email = ?1",
            params![&email],
            |row| Ok((row.get(0)?, row.get(1)?)),
        )
        .map_err(|_| "Invalid email or password.".to_string())?;

    let password_hash = format!("{:x}", Sha256::digest(password.as_bytes()));

    if stored_hash == password_hash {
        let user_session = UserSession {
            user_email: email.clone(),
            user_hash: hash_email(&email),
            is_onboarded,
        };

        // Initializing User Specific DB after logging in
        // Ensure parent directories exist
        store_session(user_session).map_err(|e| e.to_string())?;
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

// Load Session
pub fn load_session() -> Result<UserSession, String> {
    let path = get_app_data_path().map_err(|e| e.to_string())?;
    let session_path = path.join(".session");

    let data =
        fs::read_to_string(&session_path).map_err(|e| format!("Failed to read session: {}", e))?;

    let session: UserSession =
        serde_json::from_str(&data).map_err(|e| format!("Invalid session JSON: {}", e))?;

    Ok(session)
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

#[tauri::command]
pub fn is_onboarded() -> Result<bool, String> {
    let session_path = get_app_data_path()?.join(".session");

    if !session_path.exists() {
        return Ok(false);
    }

    let content = fs::read_to_string(session_path).map_err(|e| e.to_string())?;

    // Try to parse the JSON into a struct
    let session: UserSession = serde_json::from_str(&content).map_err(|e| e.to_string())?;

    Ok(session.is_onboarded) // true if parsed successfully
}

#[tauri::command]
pub fn complete_onboarding(profile_info: Profile) -> Result<String, String> {
    // 1. Open global app_data.db (auth DB)
    let app_data_path = get_app_data_path()?;
    let global_db_path = app_data_path.join("app_data.db");
    let global_conn = Connection::open(&global_db_path).map_err(|e| e.to_string())?;

    let current_user_session = load_session()?;

    // 2. Open user-specific DB
    let user_conn = get_connection().map_err(|e| e.to_string())?;

    user_conn
        .execute(
            "CREATE TABLE IF NOT EXISTS profile (
                id TEXT PRIMARY KEY,
                company_name TEXT NOT NULL,
                gst_number TEXT,
                address TEXT,
                city TEXT,
                state TEXT,
                pincode TEXT,
                phone TEXT,
                email TEXT,
                bank_name TEXT,
                bank_branch TEXT,
                bank_ifsc TEXT,
                bank_account_name TEXT,
                bank_account_number TEXT,
                invoice_prefix TEXT,
                next_invoice_number INTEGER NOT NULL,
                next_debit_number INTEGER NOT NULL,
                next_credit_number INTEGER NOT NULL,
                updated_at TEXT NOT NULL
            )",
            [],
        )
        .map_err(|e| e.to_string())?;

    // Insert or update profile row
    let now = Utc::now().to_rfc3339();
    user_conn
        .execute(
            "INSERT INTO profile (
            id,
            company_name, 
            gst_number, 
            address,
            city,
            state,
            pincode,
            phone,
            email,
            bank_name,
            bank_branch,
            bank_ifsc,
            bank_account_name,
            bank_account_number,
            invoice_prefix, 
            next_invoice_number, 
            next_debit_number, 
            next_credit_number, 
            updated_at
            )
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13, ?14, ?15, ?16, ?17, ?18, ?19)
             ON CONFLICT(id) DO UPDATE SET
                company_name = excluded.company_name,
                gst_number = excluded.gst_number,
                address = excluded.address,
                city = excluded.city,
                state = excluded.state,
                pincode = excluded.pincode,
                phone = excluded.phone,
                email = excluded.email,
                bank_name = excluded.bank_name,
                bank_branch = excluded.bank_branch,
                bank_ifsc = excluded.bank_ifsc,
                bank_account_name = excluded.bank_account_name,
                bank_account_number = excluded.bank_account_number,
                invoice_prefix = excluded.invoice_prefix,
                next_invoice_number = excluded.next_invoice_number,
                next_debit_number = excluded.next_debit_number,
                next_credit_number = excluded.next_credit_number,
                updated_at = excluded.updated_at",
            params![
                "profile", // static ID since only one profile per user
                profile_info.company_name,
                profile_info.gst_number,
                profile_info.address,
                profile_info.city,
                profile_info.state,
                profile_info.pincode,
                profile_info.phone,
                profile_info.email,
                profile_info.bank_name,
                profile_info.bank_branch,
                profile_info.bank_ifsc,
                profile_info.bank_account_name,
                profile_info.bank_account_number,
                profile_info.invoice_prefix,
                profile_info.next_invoice_number,
                profile_info.next_debit_number,
                profile_info.next_credit_number,
                now,
            ],
        )
        .map_err(|e| e.to_string())?;

    // Update onboarding flag in global auth DB
    global_conn
        .execute(
            "UPDATE users SET is_onboarded = 1 WHERE email = ?1",
            params![current_user_session.user_email],
        )
        .map_err(|e| e.to_string())?;

    // 3. Update session
    let mut session = load_session()?; // load existing session
    session.is_onboarded = true;
    store_session(session).map_err(|e| e.to_string())?;

    Ok("Onboarding completed.".to_string())
}

#[tauri::command]
pub fn get_profile_details() -> Result<Profile, String> {
    let user_conn = get_connection().map_err(|e| e.to_string())?;

    let profile_details: Profile = user_conn
            .query_row(
            r#"
            SELECT company_name, gst_number, phone, email, address, city, state, pincode,
                bank_name, bank_branch, bank_ifsc, bank_account_name, bank_account_number, invoice_prefix,
                next_invoice_number, next_debit_number, next_credit_number
            FROM profile LIMIT 1
            "#,
            [],
            |row| {
                Ok(Profile {
                    company_name: row.get(0)?,
                    gst_number: row.get(1)?,
                    phone: row.get(2)?,
                    email: row.get(3)?,
                    address: row.get(4)?,
                    city: row.get(5)?,
                    state: row.get(6)?,
                    pincode: row.get(7)?,
                    bank_name: row.get(8)?,
                    bank_branch: row.get(9)?,
                    bank_ifsc: row.get(10)?,
                    bank_account_name: row.get(11)?,
                    bank_account_number: row.get(12)?,
                    invoice_prefix: row.get(13)?,
                    next_invoice_number: row.get(14)?,
                    next_debit_number: row.get(15)?,
                    next_credit_number: row.get(16)?,
                })
            },
        )
        .map_err(|e| e.to_string())?;

    Ok(profile_details)
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
