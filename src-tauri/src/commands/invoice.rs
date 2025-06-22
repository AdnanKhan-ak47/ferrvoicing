use rusqlite::params;
use tauri::{command, Error};

use crate::{db::get_connection, models::invoice::Invoice};

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
        cgst_percentage,
        sgst_percentage,
        igst_percentage,
        additional_charges_json,
        total_amount
    ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13, ?14, ?15, ?16, ?17)",
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
pub fn get_invoice() -> Result<Invoice, Error> {

    let conn = get_connection().map_err(|e| Error::from(e.to_string()))?;
    
    let mut stmt = conn.prepare("SELECT * FROM invoices WHERE invoice_number = ?1")
        .map_err(|e| Error::from(e.to_string()))?;
}
