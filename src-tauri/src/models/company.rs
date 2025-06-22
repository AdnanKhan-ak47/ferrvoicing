use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize, Debug)]
pub struct Company {
    pub company_name: String,
    pub owner_name: String,
    pub address: String,
    pub pincode: String,
    pub gst_number: String,
    pub email: String,
    pub phone: String,
}
