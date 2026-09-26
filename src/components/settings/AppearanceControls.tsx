import ColorThemeSettings from "./ColorThemeSettings";
import UiScaleSetting from "./UiScaleSetting";
import type { AppearanceSettingsProps } from "./AppearanceSettings";

export default function AppearanceControls(props: AppearanceSettingsProps) {
  return (
    <div className="appearance-settings-body">
      <div className="settings-option">
        <span>Mode</span>
        <button type="button" onClick={props.onThemeToggle}>{props.theme === "dark" ? "Dark mode" : "Light mode"}</button>
      </div>

      <ColorThemeSettings {...props} />

      <label className="settings-option settings-toggle">
        <span>Glass surfaces</span>
        <input type="checkbox" checked={props.glass} onChange={(event) => props.onGlassChange(event.target.checked)} />
      </label>
      <label className="settings-option settings-toggle">
        <span>Gradients and glow</span>
        <input type="checkbox" checked={props.gradients} onChange={(event) => props.onGradientsChange(event.target.checked)} />
      </label>
      <label className="settings-option settings-toggle">
        <span>Automatically hide navbar</span>
        <input type="checkbox" checked={props.autoHideNavbar} onChange={(event) => props.onAutoHideNavbarChange(event.target.checked)} />
      </label>
      <UiScaleSetting {...props} />
    </div>
  );
}
