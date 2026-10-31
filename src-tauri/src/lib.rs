use tauri::Manager;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .setup(|app| {
            let icon = tauri::image::Image::new(include_bytes!("../icons/icon256.rgba"), 256, 256);
            if let Some(win) = app.get_webview_window("main") {
                let _ = win.set_icon(icon);
            }
            Ok(())
        })
        .plugin(tauri_plugin_opener::init())
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
