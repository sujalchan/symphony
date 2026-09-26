# Popup windows architecture

Symphony's in-app windows share a reusable shell in `src/components/PopupWindow.tsx` and `PopupWindow.css`. Feature windows provide only their title, body, preferred dimensions, and lifecycle callbacks. The shell owns window behavior and chrome, keeping Appearance, About, Project GitHub, Notepad, and future tools consistent.

## Shared window shell

`PopupWindow` provides:

- red close, yellow minimize, and green expand/restore controls with navbar-matched spacing;
- smooth expand and restore geometry transitions;
- double-clicking the title bar to expand or restore;
- automatic restore when an expanded window is dragged;
- configurable delayed "soap glide" dragging;
- four corner resize handles that fade in on proximity;
- quarter snapping at the four corners and half snapping at the middle of either side;
- a live outline showing the snap destination before release;
- minimize-to-navbar and restore-from-navbar animation;
- focus tracking, inactive title/control styling, desaturated inactive content, and disabled inactive scrolling;
- reduced-motion behavior for users who request it; and
- a reserved navbar area, including while automatic navbar hiding is enabled.

Fixed-size windows set `resizable={false}`. Their green control is disabled, resize attempts rubber-band back, and snap zones are unavailable. Resizable windows inherit all geometry features automatically.

Window coordinates are logical CSS pixels and account for the configured UI scale. The constants near the top of `PopupWindow.tsx` define the outer gap and navbar clearance. Keep all new positioning behavior routed through `limits`, `clampPosition`, and `clampSize` so windows remain inside the usable workspace.

## Window lifecycle and docking

`App.tsx` owns whether each window is open or minimized. Every dockable window follows the same pattern:

1. Store `is[Name]WindowOpen` and `is[Name]WindowMinimized` state.
2. Opening clears its minimized entry, mounts the window, and focuses its close control.
3. `onMinimizeStart` adds `{ id, title }` to `minimizedWindows` before the animation begins.
4. `onMinimize` marks the window hidden after the animation completes.
5. `Navbar` renders `minimizedWindows`; selecting one calls `restoreWindow(id)`.
6. Closing clears both the minimized entry and open state.

The stable `windowId` passed to `PopupWindow` must match the ID used in `minimizedWindows`. The shell uses that ID to find the navbar destination for its minimize animation.

This lifecycle is currently repeated explicitly in `App.tsx`. If many more tools are added, it is a good candidate for a `usePopupWindows` reducer or registry. A registry could hold title, component, open/minimized state, and focus order while preserving the existing `PopupWindow` API.

## Adding another popup

Create a small feature component similar to `NotepadWindow.tsx`:

```tsx
<PopupWindow
  title="Tool name"
  windowId="tool-name"
  onClose={onClose}
  onMinimizeStart={onMinimizeStart}
  onMinimize={onMinimize}
  minimized={minimized}
  uiScale={uiScale}
  popupGlide={popupGlide}
  initialSize={{ width: 520, height: 420 }}
  minSize={{ width: 320, height: 240 }}
>
  {/* Tool content */}
</PopupWindow>
```

Then add its lifecycle state and handlers in `App.tsx`, render it near the other windows, and add its opener to `Navbar.tsx`. If it appears in a native menu, also update `src-tauri/src/lib.rs` and the `symphony-native-menu` switch in `App.tsx`; see `MENU_SYNC.md`.

Feature-specific styles should use a dedicated body class passed through `bodyClassName`. Avoid reimplementing drag, resize, focus, control, or docking behavior in a feature window.

## Appearance integration

Popup transparency and glide are part of the shared `AppearanceSettingsProps` model:

- `PopupTransparencySetting.tsx` controls glass transparency.
- `PopupGlideSetting.tsx` controls drag-follow duration from Off through 800 ms in 20 ms steps.
- The glide default is 400 ms and is stored as `symphony-popup-glide`.
- `AppearanceSections.tsx` places both controls under **Popup settings** and supplies their search terms.

`App.tsx` owns and persists both values. `popupGlide` is passed to every window, exposed as `--popup-glide-duration`, and also used to time the final coordinate commit after dragging. New windows must receive the same value or their glide behavior will diverge.

## Focus and inactive appearance

Each shell listens for document pointer and focus changes. The active window gets stronger chrome and its normal body rendering. Inactive windows receive:

- matching grey traffic controls;
- a muted title;
- grayscale, reduced saturation, and reduced body opacity; and
- hidden vertical overflow until focused again.

Keep feature content inside `.popup-window-body` so these effects apply automatically. Nested custom scrollers may need their own inactive overflow rule because the shell can only lock its direct body scroller.

## Project GitHub viewer

`GitHubWindow.tsx` is a repository viewer rather than an iframe. GitHub sends `X-Frame-Options: deny` and a `frame-ancestors 'none'` policy, so its website cannot be embedded in a normal DOM popup.

The viewer fetches public repository metadata and GitHub-rendered README HTML from the GitHub REST API. It provides repository statistics, README content, external navigation, loading state, and an error fallback. `GitHubWindow.css` supplies the compact repository-browser presentation and hides its scrollbar without disabling scrolling.

Possible extensions include branch selection, directory browsing through the Contents API, issue and release views, request caching, authenticated higher rate limits, and explicit retry controls. Treat rendered remote HTML as trusted only because it comes from GitHub's sanitized README renderer; use a sanitizer before supporting arbitrary hosts.

## Notepad module

`NotepadWindow.tsx` is an intentionally unsaved, in-memory editor. It demonstrates how a feature can remain independent while inheriting the full window system. It includes:

- synchronized line numbers;
- Undo and Redo history controls;
- line and column status;
- a UTF-8 indicator;
- a dynamic title derived from the first 28 characters of the first line; and
- a Windows Notepad-inspired layout.

`NotepadWindow.css` divides the tool into toolbar, line-number gutter, editor, and status surfaces. In Glass mode those regions stay translucent, but the editor uses a flat surface without grain or gradient; accent color is limited primarily to the caret and line numbers.

The current undo history records each text change. Future work could batch adjacent keystrokes, preserve selections with each history entry, add keyboard shortcuts, support find/replace, and move document state into `App.tsx` or a document store. Saving should use an explicit Tauri file capability and should not be inferred from the current in-memory design.

## Glass rendering on Linux

Windows and macOS WebViews normally composite `backdrop-filter` directly. Linux uses WebKitGTK and behavior varies by WebKitGTK version and desktop compositor. `App.tsx` records the runtime platform and CSS support on the root element. `App.css` then:

- adds Linux-specific layer-promotion hints to shared glass surfaces; and
- provides a stronger translucent frosted fallback when backdrop filtering is reported unsupported.

The fallback preserves readability and the glass visual language, but cannot manufacture true desktop blur on a compositor/WebKitGTK combination that does not expose it. Test Linux builds under both Wayland and X11 and on the oldest WebKitGTK version the application supports.

## Verification checklist

After changing the popup system:

1. Run `npm run build`.
2. For native menu changes, run `cargo check` in `src-tauri`.
3. Test at multiple UI scales.
4. Test Glass on/off, gradients on/off, dark/light/system themes, and reduced motion.
5. Open multiple windows and verify focus styling, inactive scroll locking, docking, and restore targets.
6. Exercise all resize corners, expand/restore, title-bar double-click, navbar clearance, and every snap zone.
7. Check a Tauri build on Windows, macOS, and Linux because transparent-window composition differs by platform.
