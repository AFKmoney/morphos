// MorphOS Desktop App - Main entry point
// Built with Tauri 2.0

#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use tauri::Manager;

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_clipboard_manager::init())
        .plugin(tauri_plugin_store::Builder::default().build())
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_updater::init())
        .plugin(tauri_plugin_websocket::init())
        .plugin(tauri_plugin_positioner::init())
        .setup(|app| {
            // Set window title
            let window = app.get_webview_window("main").unwrap();
            window.set_title("MorphOS").unwrap();
            
            // Set window size
            window.set_size(tauri::Size::Logical(tauri::LogicalSize { width: 1280.0, height: 800.0 }))?;
            
            // Center window
            window.center()?;
            
            // Set minimum window size
            window.set_min_size(Some(tauri::Size::Logical(tauri::LogicalSize { width: 800.0, height: 600.0 })))?;
            
            // Set maximum window size
            window.set_max_size(Some(tauri::Size::Logical(tauri::LogicalSize { width: 3840.0, height: 2160.0 })))?;
            
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
