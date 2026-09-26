import AppearanceControls from "./settings/AppearanceControls";
import type { AppearanceSettingsProps } from "./settings/AppearanceSettings";
import PopupWindow from "./PopupWindow";
import "./SettingsPanel.css";

export default function AppearanceWindow({ settings, onClose, onMinimizeStart, onMinimize, minimized }: {
  settings: AppearanceSettingsProps;
  onClose: () => void;
  onMinimizeStart: () => void;
  onMinimize: () => void;
  minimized: boolean;
}) {
  return (
    <PopupWindow title="Appearance" windowId="appearance" onClose={onClose} onMinimizeStart={onMinimizeStart}
      onMinimize={onMinimize} minimized={minimized}
      uiScale={settings.uiScale} initialSize={{ width: 360, height: 520 }} minSize={{ width: 360, height: 520 }}>
      <AppearanceControls {...settings} />
    </PopupWindow>
  );
}
