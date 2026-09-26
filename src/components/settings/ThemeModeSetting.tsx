import { useId } from "react";
import type { ThemePreference } from "../../theme";

type ThemeModeSettingProps = {
  value: ThemePreference;
  onChange: (value: ThemePreference) => void;
};

export default function ThemeModeSetting({ value, onChange }: ThemeModeSettingProps) {
  const groupName = useId();
  const modes: { value: ThemePreference; label: string; description: string }[] = [
    { value: "dark", label: "Dark", description: "Dark mode" },
    { value: "system", label: "System default", description: "Use system default" },
    { value: "light", label: "Light", description: "Light mode" },
  ];

  return (
    <fieldset className="settings-option theme-mode-option">
      <legend>Mode</legend>
      <div className="theme-mode-switch" data-value={value}>
        <span className="theme-mode-thumb" aria-hidden="true" />
        {modes.map((mode) => (
          <label className="theme-mode-choice" key={mode.value}>
            <input type="radio" name={groupName} value={mode.value} aria-label={mode.description} checked={value === mode.value}
              onChange={() => onChange(mode.value)} />
            <span>{mode.label}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}
