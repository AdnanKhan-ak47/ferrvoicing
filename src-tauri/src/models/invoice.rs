use serde::{Deserialize, Serialize};


#[derive(Serialize, Deserialize, Debug)]
pub struct InvoiceItem {
    pub description: String,
    pub hsn: String, // Harmonized System Nomenclature code
    pub quantity: f64,
    pub rate: f64,
    pub amount: f64,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct AdditionalCharges{
    pub description: String,
    pub amount: f64,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct Invoice {
    pub id: String,
    pub issuer_name: String,
    pub issuer_address: String,
    pub issuer_gst_number: String,
    pub issuer_phone: String,
    pub issuer_email: Option<String>, // Optional email address
    pub recipient_name: String,
    pub recipient_address: String,
    pub recipient_gst_number: String,
    pub recipient_phone: String,
    pub recipient_email: Option<String>, // Optional email address
    pub invoice_number: String,
    pub invoice_date: String, // Consider using chrono::NaiveDate for better date handling
    pub amount: f64,
    pub cgst_percentage: Option<f64>,
    pub sgst_percentage: Option<f64>,
    pub igst_percentage: Option<f64>,
    pub additional_charges: Option<Vec<AdditionalCharges>>, // Optional additional charges
    pub total: f64,
    pub items: Vec<InvoiceItem>,
}

impl Invoice {
    pub fn new(
        id: String,
        issuer_name: String,
        issuer_address: String,
        issuer_gst_number: String,
        issuer_phone: String,
        issuer_email: Option<String>,
        recipient_name: String,
        recipient_address: String,
        recipient_gst_number: String,
        recipient_phone: String,
        recipient_email: Option<String>,
        invoice_number: String,
        invoice_date: String,
        amount: f64,
        cgst_percentage: Option<f64>,
        sgst_percentage: Option<f64>,
        igst_percentage: Option<f64>,
        total: f64,
        items: Vec<InvoiceItem>,
    ) -> Self {
        Self {
            id,
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
            invoice_number,
            invoice_date,
            amount,
            cgst_percentage,
            sgst_percentage,
            igst_percentage,
            additional_charges: None, // Initialize with no additional charges
            total,
            items,
        }
    }

    pub fn to_json(&self) -> Result<String, serde_json::Error> {
        serde_json::to_string(self)
    }

    pub fn from_json(json: &str) -> Result<Self, serde_json::Error> {
        serde_json::from_str(json)
    }
}