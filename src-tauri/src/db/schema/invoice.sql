CREATE TABLE IF NOT EXISTS invoice (
    id TEXT PRIMARY KEY NOT NULL,
    invoice_number TEXT NOT NULL,
    invoice_date TEXT NOT NULL,
    issuer_name TEXT NOT NULL,
    issuer_address TEXT NOT NULL,
    issuer_phone TEXT NOT NULL, 
    issuer_gst_number TEXT NOT NULL,
    issuer_email TEXT,
    recipient_name TEXT NOT NULL,
    recipient_address TEXT NOT NULL,
    recipient_phone TEXT NOT NULL,
    recipient_gst_number TEXT NOT NULL,
    recipient_email TEXT,
    items_json TEXT NOT NULL,
    amount REAL NOT NULL,
    cgst_percentage REAL,
    sgst_percentage REAL,
    igst_percentage REAL,
    additional_charges_json TEXT,
    total_amount REAL NOT NULL
);