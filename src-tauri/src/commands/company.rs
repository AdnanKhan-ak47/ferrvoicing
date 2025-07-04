use rusqlite::params;
use tauri::command;
use uuid::Uuid;
use crate::{db::get_connection, models::company::Company};

#[derive(Debug, serde::Serialize, serde::Deserialize)]
pub struct CompanyFilter {
    pub id: Option<String>,
    pub name: Option<String>,
    pub owner_name: Option<String>,
    pub gst_number: Option<String>,
}

#[command]
pub fn add_company(company: Company) -> Result<String, String> {
    let conn = get_connection().map_err(|e| e.to_string())?;

    // Insert the company into the database
    conn.execute(
        "INSERT INTO company (id, name, address, pincode, gst_number, phone, email, owner_name) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8)",
        params![
            Uuid::new_v4().to_string(),
            company.name,
            company.address,
            company.pincode,
            company.gst_number,
            company.phone,
            company.email,
            company.owner_name
        ],
    )
    .map_err(|e| e.to_string())?;

    Ok(format!("Company {} added successfully!", company.name))
}

#[command]
/// Searches for companies based on the provided filter.
pub fn search_company(filter: CompanyFilter) -> Result<Vec<Company>, String> {
    let conn = get_connection().map_err(|e| e.to_string())?;

    let mut query = "SELECT * FROM company WHERE 1=1".to_string();
    let mut value = rusqlite::types::Value::Null;
    let mut count = 0;

    if let Some(id) = filter.id {
        query = "SELECT * FROM company WHERE id = ?1".into();
        value = id.into();
        count += 1;
    }
    if let Some(company_name) = filter.name {
        query = "SELECT * FROM company WHERE name LIKE $1".into();
        value = format!("%{}%", company_name).into();
        count += 1;
    }
    if let Some(owner_name) = filter.owner_name {
        query = "SELECT * FROM company WHERE recipient_name LIKE $1".into();
        value = format!("%{}%", owner_name).into();
        count += 1;
    }
    if let Some(gst_number) = filter.gst_number {
        query = "SELECT * FROM company WHERE recipient_gst_number = ?1".into();
        value = gst_number.into();
        count += 1;
    }

    if count == 0 {
        return Err("At least one filter must be provided".to_string());
    } else if count > 1 {
        return Err("Only one filter can be provided at a time".to_string());
    }

    let mut stmt = conn.prepare(&query).map_err(|e| e.to_string())?;
    let rows = stmt
        .query_map(params![value], |row| {

            Ok(Company {
                id: row.get("id")?,
                name: row.get("name")?,
                owner_name: row.get("owner_name")?,
                address: row.get("address")?,
                pincode: row.get("pincode")?,
                gst_number: row.get("gst_number")?,
                phone: row.get("phone")?,
                email: row.get("email")?,
                
            })
        })
        .map_err(|e| e.to_string())?;

    let companies: Result<Vec<Company>, rusqlite::Error> = rows.collect();

    companies.map_err(|e| e.to_string())
}
