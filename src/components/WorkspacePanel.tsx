import type { WorkspaceTab } from "./WorkspaceTabs";
import CodePanel from "./CodePanel";
import CostumePanel from "./CostumePanel";
import SoundsPanel from "./SoundsPanel";
import SettingsPanel from "./SettingsPanel";
import type { AppearanceSettingsProps } from "./settings/AppearanceSettings";
import "./WorkspacePanel.css";

export default function WorkspacePanel({ collapsed, activeTab, settings }: {
  collapsed: boolean;
  activeTab: WorkspaceTab;
  settings: AppearanceSettingsProps;
}) {
  return (
    <aside className="workspace-panel" id="workspace-panel" aria-label="Workspace tools" aria-hidden={collapsed} inert={collapsed}>
      {activeTab === "code" && <CodePanel />}
      {activeTab === "costume" && <CostumePanel />}
      {activeTab === "sounds" && <SoundsPanel />}
      {activeTab === "settings" && <SettingsPanel {...settings} />}
    </aside>
  );
}
