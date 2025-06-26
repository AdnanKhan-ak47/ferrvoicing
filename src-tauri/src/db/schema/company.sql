CREATE TABLE IF NOT EXISTS company (
    id TEXT PRIMARY KEY NOT NULL,
    name TEXT NOT NULL,
    owner_name TEXT NOT NULL,
    address TEXT NOT NULL,
    pincode TEXT NOT NULL,
    phone TEXT NOT NULL, 
    gst_number TEXT NOT NULL,
    email TEXT
);