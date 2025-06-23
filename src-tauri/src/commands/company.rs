use rusqlite::params;
use tauri::command;

use crate::{db::get_connection, models::company::Company};

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
        "INSERT INTO companies (name, address, pincode, gst_number, phone, email, owner_name) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)",
        params![
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

pub fn search_company(filter: CompanyFilter) -> Result<Vec<Company>, String> {
    let conn = get_connection().map_err(|e| e.to_string())?;

    let mut query = "SELECT * FROM companies WHERE 1=1".to_string();
    let mut value = rusqlite::types::Value::Null;
    let mut count = 0;

    if let Some(id) = filter.id {
        query = "SELECT * FROM invoices WHERE id = ?1".into();
        value = id.into();
        count += 1;
    }
    if let Some(company_name) = filter.name {
        query = "SELECT * FROM invoices WHERE invoice_number LIKE $1".into();
        value = format!("%{}%", company_name).into();
        count += 1;
    }
    if let Some(owner_name) = filter.owner_name {
        query = "SELECT * FROM invoices WHERE recipient_name LIKE $1".into();
        value = format!("%{}%", owner_name).into();
        count += 1;
    }
    if let Some(gst_number) = filter.gst_number {
        query = "SELECT * FROM invoices WHERE recipient_gst_number = ?1".into();
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
