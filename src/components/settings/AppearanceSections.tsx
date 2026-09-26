import type { ReactNode } from "react";
import { presetNames } from "../../theme";
import AppearanceSwitch from "./AppearanceSwitch";
import ColorThemeSettings from "./ColorThemeSettings";
import PopupTransparencySetting from "./PopupTransparencySetting";
import ThemeModeSetting from "./ThemeModeSetting";
import UiScaleSetting from "./UiScaleSetting";
import type { AppearanceSettingsProps } from "./AppearanceSettings";

export type AppearanceSection = {
  id: string;
  title: string;
  searchText: string;
  content: ReactNode;
};

export function buildAppearanceSections(props: AppearanceSettingsProps): AppearanceSection[] {
  return [
    {
      id: "color",
      title: "Color theme",
      searchText: `Mode Use system default Dark mode Light mode Preset colors Custom color ${props.color} Saved color profiles ${Object.values(presetNames).join(" ")} ${props.savedProfiles.map((profile) => profile.name).join(" ")}`,
      content: (
        <>
          <ThemeModeSetting value={props.themePreference} onChange={props.onThemePreferenceChange} />
          <ColorThemeSettings {...props} />
        </>
      ),
    },
    {
      id: "popup",
      title: "Popup settings",
      searchText: "Popup window transparency",
      content: <PopupTransparencySetting value={props.popupTransparency} onChange={props.onPopupTransparencyChange} glass={props.glass} />,
    },
    {
      id: "effects",
      title: "Effects",
      searchText: "Glass surfaces Gradients and glow",
      content: (
        <>
          <AppearanceSwitch label="Glass surfaces" checked={props.glass} onChange={props.onGlassChange} />
          <AppearanceSwitch label="Gradients and glow" checked={props.gradients} onChange={props.onGradientsChange} />
        </>
      ),
    },
    {
      id: "interface",
      title: "Interface",
      searchText: "Automatically hide navbar UI scale",
      content: (
        <>
          <AppearanceSwitch label="Automatically hide navbar" checked={props.autoHideNavbar} onChange={props.onAutoHideNavbarChange} />
          <UiScaleSetting {...props} />
        </>
      ),
    },
  ];
}
