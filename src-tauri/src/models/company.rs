use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize, Debug)]
pub struct Company {
    pub id: Option<String>,
    pub name: String,
    pub owner_name: String,
    pub address: String,
    pub pincode: String,
    pub gst_number: String,
    pub phone: String,
    pub email: Option<String>,
}
