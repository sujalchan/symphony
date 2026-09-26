// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
#[cfg(target_os = "macos")]
use tauri::{
    menu::{MenuBuilder, MenuItemBuilder, SubmenuBuilder},
    Emitter,
};

#[tauri::command]
fn greet(name: &str) -> String {
    return format!("Hello, {}! You've been greeted from Rust!", name);
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .setup(|_app| {
            #[cfg(target_os = "macos")]
            {
                let handle = _app.handle();
                let app_menu = SubmenuBuilder::new(handle, "Symphony IDE")
                    .text("about", "About Symphony IDE")
                    .separator()
                    .hide()
                    .hide_others()
                    .separator()
                    .quit()
                    .build()?;
                let file_menu = SubmenuBuilder::new(handle, "File")
                    .item(
                        &MenuItemBuilder::with_id("new-sb3", "New .sb3")
                            .enabled(false)
                            .build(handle)?,
                    )
                    .item(
                        &MenuItemBuilder::with_id("load-sb3", "Load .sb3")
                            .enabled(false)
                            .build(handle)?,
                    )
                    .build()?;
                let project_menu = SubmenuBuilder::new(handle, "Project")
                    .item(
                        &MenuItemBuilder::with_id("project-settings", "Project Settings")
                            .enabled(false)
                            .build(handle)?,
                    )
                    .build()?;
                let edit_menu = SubmenuBuilder::new(handle, "Edit")
                    .undo()
                    .redo()
                    .separator()
                    .cut()
                    .copy()
                    .paste()
                    .select_all()
                    .build()?;
                let window_menu = SubmenuBuilder::new(handle, "Window")
                    .text("appearance", "Appearance")
                    .build()?;
                let help_menu = SubmenuBuilder::new(handle, "Help")
                    .text("project-github", "Project GitHub")
                    .build()?;
                let menu = MenuBuilder::new(handle)
                    .items(&[
                        &app_menu,
                        &file_menu,
                        &project_menu,
                        &edit_menu,
                        &window_menu,
                        &help_menu,
                    ])
                    .build()?;
                _app.set_menu(menu)?;
                _app.on_menu_event(|app, event| {
                    let id = event.id().0.as_str();
                    if matches!(id, "about" | "appearance" | "project-github") {
                        let _ = _app.emit("symphony-native-menu", id);
                    }
                });
            }
            Ok(())
        })
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![greet])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
