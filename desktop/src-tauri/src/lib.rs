use std::time::Duration;

use futures_core::future::BoxFuture;
use serde::Serialize;
use sqlx::{
    error::BoxDynError,
    migrate::{Migration as SqlxMigration, MigrationSource, MigrationType, Migrator},
    sqlite::{SqliteConnectOptions, SqlitePool},
};
use tauri::Manager;
use tauri_plugin_dialog::DialogExt;

#[derive(Debug)]
struct VecSource(Vec<SqlxMigration>);

impl MigrationSource<'static> for VecSource {
    fn resolve(self) -> BoxFuture<'static, Result<Vec<SqlxMigration>, BoxDynError>> {
        Box::pin(async move { Ok(self.0) })
    }
}

fn migrations() -> Vec<SqlxMigration> {
    vec![
        SqlxMigration::new(
            1,
            "init_schema".into(),
            MigrationType::ReversibleUp,
            include_str!("../migrations/0001_init.sql").into(),
            false,
        ),
        SqlxMigration::new(
            2,
            "seed_reference_and_demo_data".into(),
            MigrationType::ReversibleUp,
            include_str!("../migrations/0002_seed.sql").into(),
            false,
        ),
        SqlxMigration::new(
            3,
            "exchange_rates".into(),
            MigrationType::ReversibleUp,
            include_str!("../migrations/0003_exchange_rates.sql").into(),
            false,
        ),
        SqlxMigration::new(
            4,
            "transaction_balance_triggers".into(),
            MigrationType::ReversibleUp,
            include_str!("../migrations/0004_transaction_balance_triggers.sql").into(),
            false,
        ),
    ]
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct BackupResult {
    path: String,
    size: u64,
}

// VACUUM INTO produces a consistent, fully checkpointed snapshot without
// pausing writes, unlike copying the file while the app has it open.
// The save dialog is opened here rather than in the webview so the web build
// does not depend on any desktop-only package.
#[tauri::command]
async fn backup_database(
    app: tauri::AppHandle,
    file_name: String,
) -> Result<Option<BackupResult>, String> {
    let source = app
        .path()
        .app_local_data_dir()
        .map_err(|e| format!("Не удалось определить папку с данными: {e}"))?
        .join("mymoney.db");

    if !source.exists() {
        return Err("Файл базы данных ещё не создан".into());
    }

    if file_name.is_empty() || file_name.contains(['/', '\\']) {
        return Err("Недопустимое имя файла резервной копии".into());
    }

    let mut dialog = app
        .dialog()
        .file()
        .set_title("Сохранить резервную копию")
        .set_file_name(file_name)
        .add_filter("База данных MyMoney", &["db"]);

    if let Ok(documents) = app.path().document_dir() {
        dialog = dialog.set_directory(documents);
    }

    let Some(selected) = dialog.blocking_save_file() else {
        return Ok(None);
    };

    let destination = selected
        .into_path()
        .map_err(|e| format!("Не удалось разобрать выбранный путь: {e}"))?;

    // Checked before the overwrite below, so choosing the live database as the
    // target can never destroy it.
    if std::fs::canonicalize(&destination).ok() == std::fs::canonicalize(&source).ok() {
        return Err("Нельзя сохранить копию поверх рабочей базы данных".into());
    }

    // The save dialog already confirmed the overwrite; VACUUM INTO itself
    // refuses to write into an existing file.
    if destination.exists() {
        std::fs::remove_file(&destination)
            .map_err(|e| format!("Не удалось перезаписать файл: {e}"))?;
    }

    let pool = SqlitePool::connect_with(
        SqliteConnectOptions::new()
            .filename(&source)
            .busy_timeout(Duration::from_secs(10)),
    )
    .await
    .map_err(|e| format!("Не удалось открыть базу данных: {e}"))?;

    let result = sqlx::query("VACUUM INTO ?")
        .bind(destination.to_string_lossy().as_ref())
        .execute(&pool)
        .await;
    pool.close().await;
    result.map_err(|e| format!("Не удалось создать резервную копию: {e}"))?;

    let size = std::fs::metadata(&destination)
        .map_err(|e| format!("Копия создана, но её размер не удалось прочитать: {e}"))?
        .len();

    Ok(Some(BackupResult {
        path: destination.to_string_lossy().into_owned(),
        size,
    }))
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        // Registered first so a second launch focuses the existing window
        // instead of opening a competing pool on the same SQLite file.
        .plugin(tauri_plugin_single_instance::init(|app, _args, _cwd| {
            if let Some(window) = app.get_webview_window("main") {
                let _ = window.unminimize();
                let _ = window.set_focus();
            }
        }))
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_http::init())
        .plugin(tauri_plugin_sql::Builder::default().build())
        .invoke_handler(tauri::generate_handler![backup_database])
        .setup(|app| {
            // The plugin applies migrations by looking up the exact connection
            // string passed from JS, which contains a runtime absolute path —
            // so the schema is applied here instead, directly over sqlx.
            let db_path = app.path().app_local_data_dir()?.join("mymoney.db");
            std::fs::create_dir_all(db_path.parent().expect("db parent dir"))?;

            tauri::async_runtime::block_on(async {
                let migrator = Migrator::new(VecSource(migrations())).await?;
                // First launch: the file does not exist yet and sqlx will not
                // create it unless asked explicitly
                let options = SqliteConnectOptions::new()
                    .filename(&db_path)
                    .create_if_missing(true);
                let pool = SqlitePool::connect_with(options).await?;
                migrator.run(&pool).await?;
                pool.close().await;
                Ok::<(), Box<dyn std::error::Error>>(())
            })
            .map_err(|e| {
                eprintln!("[mymoney] failed to run database migrations: {e}");
                // A GUI build has no console, so persist the reason where it can
                // be found instead of only printing to the swallowed stderr.
                if let Ok(dir) = app.path().app_local_data_dir() {
                    let _ = std::fs::write(
                        dir.join("mymoney-startup-error.log"),
                        format!("failed to run database migrations: {e}\n"),
                    );
                }
                e
            })?;

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
