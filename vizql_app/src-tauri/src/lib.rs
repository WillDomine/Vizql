// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
use postgres::{Client, NoTls};

#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[tauri::command]
fn connect_db(connection_string: &str) -> Result<String, String> {
    let mut client = Client::connect(connection_string, NoTls).map_err(|e| e.to_string())?;

    // Example query to verify connection
    let rows = client
        .query("SELECT version()", &[])
        .map_err(|e| e.to_string())?;

    // Return the first version string we find
    for row in rows {
        let version: &str = row.get(0);
        let v = version.to_string();
        println!("PostgreSQL version: {}", v);
        return Ok(v);
    }

    Err("no rows returned from version query".to_string())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![greet, connect_db])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
