# Keep the menus in sync

Symphony has an in-app navbar in `src/components/Navbar.tsx` and a native macOS menu in `src-tauri/src/lib.rs`. Native menu clicks that open app UI are handled in `src/App.tsx` through the `symphony-native-menu` event.

When adding, removing, renaming, or changing a menu option, update both menus and its event handler. Keep destinations consistent. File and Project entries are currently placeholders in the app navbar and disabled in the native menu; implement and enable them together.

Check both menus in a macOS Tauri build. Appearance's **Automatically hide navbar** setting leaves the in-app navbar fixed when off and hides it until the pointer reaches the top edge when on. Native About and Appearance must remain usable, and the revealed navbar must still provide window controls and minimized popup buttons.
