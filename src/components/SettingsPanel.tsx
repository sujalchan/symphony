export default function SettingsPanel({ theme, onThemeToggle }: { theme: "dark" | "light"; onThemeToggle: () => void }) {
  return (
    <section className="workspace-panel-content" role="tabpanel" id="settings-panel" aria-labelledby="settings-tab">
      <h2>Settings</h2>
      <div className="settings-option">
        <span>Appearance</span>
        <button type="button" onClick={onThemeToggle}>
          {theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
        </button>
      </div>
    </section>
  );
}
