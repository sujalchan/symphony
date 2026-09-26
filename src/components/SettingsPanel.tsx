import AppearanceSettings from "./settings/AppearanceSettings";
import type { AppearanceSettingsProps } from "./settings/AppearanceSettings";
import "./SettingsPanel.css";

export default function SettingsPanel(props: AppearanceSettingsProps) {
  return (
    <section className="workspace-panel-content settings-panel" role="tabpanel" id="settings-panel" aria-labelledby="settings-tab">
      <h2>Settings</h2>
      <AppearanceSettings {...props} />
    </section>
  );
}
