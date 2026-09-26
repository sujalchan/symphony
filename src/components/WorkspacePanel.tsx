import type { WorkspaceTab } from "./WorkspaceTabs";
import CodePanel from "./CodePanel";
import CostumePanel from "./CostumePanel";
import SoundsPanel from "./SoundsPanel";
import "./WorkspacePanel.css";

export default function WorkspacePanel({ collapsed, activeTab }: { collapsed: boolean; activeTab: WorkspaceTab }) {
  return (
    <aside className="workspace-panel" id="workspace-panel" aria-label="Workspace tools" aria-hidden={collapsed} inert={collapsed}>
      {activeTab === "code" && <CodePanel />}
      {activeTab === "costume" && <CostumePanel />}
      {activeTab === "sounds" && <SoundsPanel />}
    </aside>
  );
}
