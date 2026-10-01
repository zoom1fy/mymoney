use futures_core::future::BoxFuture;
use sqlx::{
    error::BoxDynError,
    migrate::{Migration as SqlxMigration, MigrationSource, MigrationType, Migrator},
    sqlite::{SqliteConnectOptions, SqlitePool},
};
use tauri::Manager;

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
        )
    ]
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
        .plugin(tauri_plugin_http::init())
        .plugin(tauri_plugin_sql::Builder::default().build())
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
            })?;

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
