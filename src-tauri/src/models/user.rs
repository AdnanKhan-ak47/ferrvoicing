use serde::{Deserialize, Serialize};
use serde_json::Number;
use sha2::digest::typenum::Integer;

#[derive(Debug, Serialize, Deserialize)]
pub struct User {
    pub id: String,
    pub name: String,
    pub email: String,
    pub password_hash: String,
    pub created_at: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct UserSession {
    pub user_email: String, 
    pub user_hash: String,
    pub is_onboarded: bool
}


#[derive(Debug, Serialize, Deserialize)]
pub struct Profile {
    pub company_name: String,
    pub gst_number: String,
    pub address: String,
    pub city: String,
    pub state: String,
    pub pincode: String,
    pub phone: String, 
    pub email: String,
    pub bank_name: String,
    pub bank_branch: String,
    pub bank_ifsc: String,
    pub bank_account_name: String,
    pub bank_account_number: String,
    pub invoice_prefix: String,
    pub next_invoice_number: u32,
    pub next_debit_number: u32,
    pub next_credit_number: u32,
}