// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
use tokio_postgres::{NoTls};
use deadpool_postgres::{Config, Pool};
use once_cell::sync::OnceCell;
use std::sync::Arc;

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
async fn create_user(username: &str, email: &str) -> Result<(), String> {
    let pool = DB_POOL.get().ok_or("Database pool not initialized".to_string())?;

    // `pool.get()` returns a Future, so await it. Add context to errors to aid debugging.
    let client = pool
        .get()
        .await
        .map_err(|e| format!("failed to get client from pool: {}", e))?;

    client
        .execute(
            "INSERT INTO users (username, email) VALUES ($1, $2)",
            &[&username, &email],
        )
        .await
        .map_err(|e| format!("failed to execute insert: {}", e))?;

    println!("User {} created successfully.", username);
    Ok(())
}

#[tauri::command]
async fn test_pool() -> Result<String, String> {
    let pool = DB_POOL.get().ok_or("Database pool not initialized".to_string())?;
    let client = pool
        .get()
        .await
        .map_err(|e| format!("failed to get client from pool: {}", e))?;

    // Run a minimal query to verify the connection
    client
        .query("SELECT 1", &[])
        .await
        .map_err(|e| format!("test query failed: {}", e))?;

    Ok("pool ok".to_string())
}


#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
    .invoke_handler(tauri::generate_handler![greet, connect_db_pool, create_user, test_pool])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
