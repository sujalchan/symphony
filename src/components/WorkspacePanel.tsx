import type { WorkspaceTab } from "./WorkspaceTabs";
import CodePanel from "./CodePanel";
import CostumePanel from "./CostumePanel";
import SoundsPanel from "./SoundsPanel";
import SettingsPanel from "./SettingsPanel";
import "./WorkspacePanel.css";

export default function WorkspacePanel({ collapsed, activeTab, theme, onThemeToggle }: {
  collapsed: boolean;
  activeTab: WorkspaceTab;
  theme: "dark" | "light";
  onThemeToggle: () => void;
}) {
  return (
    <aside className="workspace-panel" id="workspace-panel" aria-label="Workspace tools" aria-hidden={collapsed} inert={collapsed}>
      {activeTab === "code" && <CodePanel />}
      {activeTab === "costume" && <CostumePanel />}
      {activeTab === "sounds" && <SoundsPanel />}
      {activeTab === "settings" && <SettingsPanel theme={theme} onThemeToggle={onThemeToggle} />}
    </aside>
  );
}
