CREATE TABLE IF NOT EXISTS profile (
    id TEXT PRIMARY KEY NOT NULL,
    company_name TEXT NOT NULL,
    gst_number TEXT NOT NULL,
    phone TEXT NOT NULL,
    email TEXT NOT NULL,
    address TEXT NOT NULL,
    city TEXT NOT NULL,
    state TEXT NOT NULL,
    pincode TEXT NOT NULL,
    bank_name TEXT NOT NULL,
    bank_branch TEXT NOT NULL,
    bank_ifsc TEXT NOT NULL,
    bank_account_name TEXT NOT NULL,
    bank_account_number TEXT NOT NULL,
    invoice_prefix TEXT NOT NULL,
    updated_at TEXT
);
