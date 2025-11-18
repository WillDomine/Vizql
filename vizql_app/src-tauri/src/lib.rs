use tokio_postgres::{NoTls};
use deadpool_postgres::{Config, Pool};
use once_cell::sync::OnceCell;
use std::sync::Arc;
use std::vec::Vec;
use std::collections::HashMap;

static DB_POOL : OnceCell<Arc<Pool>> = OnceCell::new();

#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[tauri::command]
fn connect_db_pool(dbname: &str, user: &str, password: &str, host: &str, port: &str) -> Result<(), String> {
    let mut cfg = Config::new();

    cfg.dbname = Some(dbname.to_string());
    cfg.user = Some(user.to_string());
    cfg.password = Some(password.to_string());
    cfg.host = Some(host.to_string());
    cfg.port = Some(port.parse::<u16>().map_err(|e| e.to_string())?);

    let pool = cfg.create_pool(None, NoTls).map_err(|e| e.to_string())?;

    DB_POOL.set(Arc::new(pool)).map_err(|_| "DB_POOL already set".to_string())?;

    println!("Database pool created and set successfully.");
    Ok(())
}

#[tauri::command]
async fn create_table(table_name: String, columns: Vec<HashMap<String, String>>) -> Result<(), String> {
    let pool = DB_POOL.get().ok_or("Database pool not initialized".to_string())?;

    // `pool.get()` returns a Future, so await it. Add context to errors to aid debugging.
    let _client = pool
        .get()
        .await
        .map_err(|e| format!("failed to get client from pool: {}", e))?;

    let query = format!(
        "CREATE TABLE {} ({})",
        table_name,
        columns
            .iter()
            .map(|col| format!("{} {}", col.get("name").unwrap(), col.get("type").unwrap()))
            .collect::<Vec<String>>()
            .join(", ")
    );
    
    _client
        .execute(query.as_str(), &[])
        .await
        .map_err(|e| format!("failed to execute create table: {}", e))?;

    println!("Table '{}' created successfully.", table_name);

    Ok(())
}

#[tauri::command]
async fn list_tables() -> Result<Vec<String>, String> {
    let pool = DB_POOL.get().ok_or("Database pool not initialized".to_string())?;

    let client = pool
        .get()
        .await
        .map_err(|e| format!("Failed to get client from pool: {}", e))?;

    let rows = client
        .query(
            "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE'",
            &[],
        )
        .await
        .map_err(|e| format!("Failed to query tables: {}", e))?;

    // Extract table names as Vec<String>
    let table_names = rows
        .iter()
        .map(|row| row.get::<_, String>("table_name"))
        .collect();

    println!("Retrieved tables: {:?}", table_names);
    
    Ok(table_names)
}

#[tauri::command]
async fn list_table_columns(table_name: String) -> Result<Vec<HashMap<String, String>>, String> {
    let pool = DB_POOL.get().ok_or("Database pool not initialized".to_string())?;

    let client = pool
        .get()
        .await
        .map_err(|e| format!("Failed to get client from pool: {}", e))?;

    let rows = client
        .query(
            "SELECT column_name, data_type FROM information_schema.columns WHERE table_name = $1",
            &[&table_name],
        )
        .await
        .map_err(|e| format!("Failed to query columns: {}", e))?;

    // Extract column details as Vec<HashMap<String, String>>
    let columns = rows
        .iter()
        .map(|row| {
            let mut col_info = HashMap::new();
            col_info.insert("name".to_string(), row.get::<_, String>("column_name"));
            col_info.insert("type".to_string(), row.get::<_, String>("data_type"));
            col_info
        })
        .collect();

    println!("Retrieved columns for table '{}': {:?}", table_name, columns);
    
    Ok(columns)
}


#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![greet, connect_db_pool, create_table, list_tables, list_table_columns])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
