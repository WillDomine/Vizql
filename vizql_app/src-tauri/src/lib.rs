// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
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

    let test_columns = vec![
        {
            let mut col = HashMap::new();
            col.insert("name".to_string(), "id".to_string());
            col.insert("type".to_string(), "SERIAL PRIMARY KEY".to_string());
            col
        },
        {
            let mut col = HashMap::new();
            col.insert("name".to_string(), "name".to_string());
            col.insert("type".to_string(), "VARCHAR(100) NOT NULL".to_string());
            col
        },
        {
            let mut col = HashMap::new();
            col.insert("name".to_string(), "age".to_string());
            col.insert("type".to_string(), "INT".to_string());
            col
        },
    ];

    // Use provided columns/table_name if supplied, otherwise fall back to test values
    let cols = if columns.is_empty() { test_columns } else { columns };
    let tbl = if table_name.is_empty() { "test_table".to_string() } else { table_name };

    let query = format!(
        "CREATE TABLE {} ({})",
        tbl,
        cols
            .iter()
            .map(|col| format!("{} {}", col.get("name").unwrap(), col.get("type").unwrap()))
            .collect::<Vec<String>>()
            .join(", ")
    );

    println!("Executing query: {}", query);

    /* 
    client
        .execute(
            "INSERT INTO users (username, email) VALUES ($1, $2)",
            &[&username, &email],
        )
        .await
        .map_err(|e| format!("failed to execute insert: {}", e))?;

    println!("User {} created successfully.", username);
    */
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



#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![greet, connect_db_pool, create_table, list_tables])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
