import { useEffect, useId, useState } from "react";
import AppearanceControls from "./AppearanceControls";
import type { ColorThemeSettingsProps } from "./ColorThemeSettings";
import type { UiScaleSettingProps } from "./UiScaleSetting";

export type AppearanceSettingsProps = ColorThemeSettingsProps & UiScaleSettingProps & {
  theme: "dark" | "light";
  onThemeToggle: () => void;
  glass: boolean;
  onGlassChange: (enabled: boolean) => void;
  gradients: boolean;
  onGradientsChange: (enabled: boolean) => void;
};

function storedExpanded(): boolean {
  try {
    return localStorage.getItem("symphony-appearance-expanded") === "true";
  } catch {
    return false;
  }
}

export default function AppearanceSettings(props: AppearanceSettingsProps) {
  const [expanded, setExpanded] = useState(storedExpanded);
  const contentId = useId();

  useEffect(() => {
    try {
      localStorage.setItem("symphony-appearance-expanded", String(expanded));
    } catch {
      // The section can still be expanded for this session.
    }
  }, [expanded]);

  return (
    <div className="appearance-settings" data-expanded={expanded}>
      <button className="appearance-toggle" type="button" aria-expanded={expanded} aria-controls={contentId} onClick={() => setExpanded((current) => !current)}>
        <span>Appearance</span>
        <svg viewBox="0 0 12 12" aria-hidden="true" focusable="false"><path d="m3 4.5 3 3 3-3" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
      </button>
      <div id={contentId} className="appearance-settings-content" aria-hidden={!expanded} inert={!expanded}>
        <div className="appearance-settings-inner">
          <AppearanceControls {...props} />
        </div>
      </div>
    </div>
  );
}
