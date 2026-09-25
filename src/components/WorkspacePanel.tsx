import { useState } from "react";
import CodePanel from "./CodePanel";
import CostumePanel from "./CostumePanel";
import SoundsPanel from "./SoundsPanel";
import "./WorkspacePanel.css";

type Tab = "code" | "costume" | "sounds";

function TabIcon({ tab }: { tab: Tab }) {
  if (tab === "code") {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="m8 7-5 5 5 5M16 7l5 5-5 5M14 4l-4 16" />
      </svg>
    );
  }
  if (tab === "costume") {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M12 3a9 9 0 1 0 0 18h1.5a2 2 0 0 0 1.4-3.4 1.7 1.7 0 0 1 1.2-2.9H18A3 3 0 0 0 21 11a8 8 0 0 0-9-8Z" />
        <circle cx="7.5" cy="11" r="1" /><circle cx="10" cy="7" r="1" /><circle cx="16" cy="8" r="1" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M3 10v4M7 6v12M11 3v18M15 7v10M19 5v14M23 10v4" />
    </svg>
  );
}

export default function WorkspacePanel({ collapsed }: { collapsed: boolean }) {
  const [activeTab, setActiveTab] = useState<Tab>("code");
  const tabs = ["code", "costume", "sounds"] as const;

  return (
    <aside className="workspace-panel" id="workspace-panel" aria-label="Workspace tools" aria-hidden={collapsed} inert={collapsed}>
      <div className="workspace-tabs" role="tablist" aria-label="Workspace tabs">
        {tabs.map((tab, index) => (
          <button
            key={tab}
            type="button"
            role="tab"
            id={`${tab}-tab`}
            aria-controls={`${tab}-panel`}
            aria-selected={activeTab === tab}
            tabIndex={activeTab === tab ? 0 : -1}
            className={activeTab === tab ? "is-active" : ""}
            onClick={() => setActiveTab(tab)}
            onKeyDown={(event) => {
              const direction = event.key === "ArrowRight" ? 1 : event.key === "ArrowLeft" ? -1 : 0;
              if (!direction) return;
              event.preventDefault();
              const next = (index + direction + tabs.length) % tabs.length;
              setActiveTab(tabs[next]);
              event.currentTarget.parentElement?.querySelectorAll<HTMLButtonElement>("[role='tab']")[next]?.focus();
            }}
          >
            <TabIcon tab={tab} />
            <span>{tab === "sounds" ? "Sounds" : tab === "costume" ? "Costume" : "Code"}</span>
          </button>
        ))}
      </div>
      {activeTab === "code" && <CodePanel />}
      {activeTab === "costume" && <CostumePanel />}
      {activeTab === "sounds" && <SoundsPanel />}
    </aside>
  );
}
