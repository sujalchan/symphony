# Appearance settings and search

Both the Settings panel and the Appearance popup render `AppearanceControls`. `App.tsx` owns the setting values and persistence. Search text and inner submenu state belong to each rendered controls instance; the outer Settings panel Appearance disclosure has its own saved state.

## Search flow

1. `AppearanceSearch.tsx` renders the search field and sends its text to `AppearanceControls.tsx`.
2. `appearanceMatching.ts` trims and lowercases the query, splits it into words, and matches a section only when **every** word occurs in its title or search text. Word order does not matter.
3. `AppearanceSections.tsx` defines the sections, their controls, and their searchable text together. Color search text includes preset names, the current hex color, and saved profile names.
4. `AppearanceControls.tsx` keeps all sections mounted while hiding nonmatches. Matching sections are forced open during a search; clearing the query restores each section's previous open or closed state. A status message appears when nothing matches.

Search filters whole sections, not individual controls inside a section. The query is local to the Settings panel or popup and is not saved.

The Color theme Mode control stores `system`, `dark`, or `light` under the existing `symphony-theme` key. Previously saved Dark and Light choices still load. System mode follows `prefers-color-scheme` changes while the app is open.

`ThemeModeSetting.tsx` renders a three-position switch backed by one radio group: Dark, System default, Light. `AppearanceSwitch.tsx` supplies the Effects and Interface switches. Their shared CSS in `SettingsPanel.css` uses translucent surfaces and blur when Glass surfaces is on; the Effects and Interface switches also use the same grain asset as the navbar.

## Adding a setting

Add its control to the appropriate entry in `AppearanceSections.tsx` and add its visible label or useful search terms to that entry's `searchText`. Add a new entry there for a new submenu, with a stable `id`. `AppearanceSubmenu.tsx` handles the disclosure button, animation, and accessibility state for every entry. Search styling and submenu styling live in `SettingsPanel.css`.
