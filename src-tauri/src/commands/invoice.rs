use rusqlite::params;
use serde::Deserialize;
use tauri::{command, Error};

use crate::{db::get_connection, models::invoice::Invoice};

#[derive(Deserialize)]
pub struct InvoiceFilter {
    pub id: Option<String>,
    pub invoice_number: Option<String>,
    pub recipient_name: Option<String>,
    pub recipient_gst_number: Option<String>,
}

#[command]
pub fn create_invoice(invoice: Invoice) -> Result<String, String> {
    // Here you would typically insert the invoice into a database
    // For demonstration purposes, we'll just return a success message
    let conn = get_connection().map_err(|e| e.to_string())?;
    let items_json = serde_json::to_string(&invoice.items).map_err(|e| e.to_string())?;
    let additional_charges_json = serde_json::to_string(&invoice.additional_charges)
    .map_err(|e| e.to_string())?;
    
    
    conn.execute(
        "INSERT INTO invoices (
        issuer_name,
        issuer_address,
        issuer_gst_number,
        issuer_phone,
        issuer_email,
        recipient_name,
        recipient_address,
        recipient_gst_number,
        recipient_phone,
        recipient_email,
        items_json,
        invoice_date,
        amount,
        cgst_percentage,
        sgst_percentage,
        igst_percentage,
        additional_charges_json,
        total_amount
    ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13, ?14, ?15, ?16, ?17, ?18)",
        params![
            invoice.issuer_name,
            invoice.issuer_address,
            invoice.issuer_gst_number,
            invoice.issuer_phone,
            invoice.issuer_email,
            invoice.recipient_name,
            invoice.recipient_address,
            invoice.recipient_gst_number,
            invoice.recipient_phone,
            invoice.recipient_email,
            items_json, // This is the serialized JSON string of items
            invoice.invoice_date,
            invoice.amount,
            invoice.cgst_percentage,
            invoice.sgst_percentage,
            invoice.igst_percentage,
            additional_charges_json,
            invoice.total
        ],
    )
    .map_err(|e| e.to_string())?;

    Ok(format!(
        "Invoice {} created successfully!",
        invoice.invoice_number
    ))
}

#[command]
pub fn search_invoices(filter: InvoiceFilter) -> Result<Vec<Invoice>, String> {
    let conn = get_connection().map_err(|e| e.to_string())?;
    
    let mut query = String::new();
    let mut value = rusqlite::types::Value::Null;

    let mut count = 0;

    if let Some(id) = filter.id {
        query = "SELECT * FROM invoices WHERE id = ?1".into();
        value = id.into();
        count += 1;
    }
    if let Some(inv_number) = filter.invoice_number {
        query = "SELECT * FROM invoices WHERE invoice_number = ?1".into();
        value = inv_number.into();
        count += 1;
    }
    if let Some(name) = filter.recipient_name {
        query = "SELECT * FROM invoices WHERE recipient_name LIKE $1".into();
        value = format!("%{}%", name).into();
        count += 1;
    }
    if let Some(gst_number) = filter.recipient_gst_number {
        query = "SELECT * FROM invoices WHERE recipient_gst_number = ?1".into();
        value = gst_number.into();
        count += 1;
    }

    if count == 0 {
        return Err("At least one filter must be provided".to_string());
    }
    else if count > 1 {
        return Err("Only one filter can be provided at a time".to_string());
    }

    let mut stmt = conn.prepare(&query).map_err(|e| e.to_string())?;
    let rows = stmt.query_map(
        params![value],
        |row| {
            let items_json: String = row.get("items_json")?;
            let additional_charges_json: String = row.get("additional_charges_json")?;
            let items = serde_json::from_str(&items_json)
                .map_err(|e| rusqlite::Error::FromSqlConversionFailure(0, rusqlite::types::Type::Text, Box::new(e)))?;
            let additional_charges = serde_json::from_str(&additional_charges_json)
                .map_err(|e| rusqlite::Error::FromSqlConversionFailure(0, rusqlite::types::Type::Text, Box::new(e)))?;

            Ok(Invoice {
                id: row.get("id")?,
                invoice_number: row.get("invoice_number")?,
                issuer_name: row.get("issuer_name")?,
                issuer_address: row.get("issuer_address")?,
                issuer_gst_number: row.get("issuer_gst_number")?,
                issuer_phone: row.get("issuer_phone")?,
                issuer_email: row.get("issuer_email")?,
                recipient_name: row.get("recipient_name")?,
                recipient_address: row.get("recipient_address")?,
                recipient_gst_number: row.get("recipient_gst_number")?,
                recipient_phone: row.get("recipient_phone")?,
                recipient_email: row.get("recipient_email")?,
                items: items,
                invoice_date: row.get("invoice_date")?,
                amount: row.get("amount")?,
                cgst_percentage: row.get("cgst_percentage")?,
                sgst_percentage: row.get("sgst_percentage")?,
                igst_percentage: row.get("igst_percentage")?,
                additional_charges: additional_charges,
                total: row.get("total_amount")?
            })
        },
    ).map_err(|e| e.to_string())?;

    let invoices: Result<Vec<Invoice>, rusqlite::Error> = rows.collect();

    invoices.map_err(|e| e.to_string())
}
