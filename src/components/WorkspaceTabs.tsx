import { useLayoutEffect, useRef, useState } from "react";
import "./WorkspaceTabs.css";

export type WorkspaceTab = "code" | "costume" | "sounds" | "settings";

const tabs: WorkspaceTab[] = ["code", "costume", "sounds", "settings"];
const labels: Record<WorkspaceTab, string> = {
  code: "Code",
  costume: "Costume",
  sounds: "Sounds",
  settings: "Settings",
};

function TabIcon({ tab }: { tab: WorkspaceTab }) {
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
  if (tab === "sounds") return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M3 10v4M7 6v12M11 3v18M15 7v10M19 5v14M23 10v4" />
    </svg>
  );
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M9.7 3.3 10.2 2h3.6l.5 1.3a2 2 0 0 0 2.5 1.1l1.3-.5 2.5 2.5-.5 1.3a2 2 0 0 0 1.1 2.5l1.3.5v3.6l-1.3.5a2 2 0 0 0-1.1 2.5l.5 1.3-2.5 2.5-1.3-.5a2 2 0 0 0-2.5 1.1l-.5 1.3h-3.6l-.5-1.3a2 2 0 0 0-2.5-1.1l-1.3.5-2.5-2.5.5-1.3a2 2 0 0 0-1.1-2.5L2 14.3v-3.6l1.3-.5a2 2 0 0 0 1.1-2.5l-.5-1.3 2.5-2.5 1.3.5a2 2 0 0 0 2.5-1.1Z" />
      <circle cx="12" cy="12.5" r="3" />
    </svg>
  );
}

function TabButton({ tab, index, activeTab, onSelect }: { tab: WorkspaceTab; index: number; activeTab: WorkspaceTab; onSelect: (tab: WorkspaceTab) => void }) {
  return (
    <button
      type="button"
      role="tab"
      id={`${tab}-tab`}
      aria-label={labels[tab]}
      title={labels[tab]}
      aria-controls={`${tab}-panel`}
      aria-selected={activeTab === tab}
      tabIndex={activeTab === tab ? 0 : -1}
      className={activeTab === tab ? "is-active" : ""}
      onClick={() => onSelect(tab)}
      onKeyDown={(event) => {
        let next = index;
        if (event.key === "ArrowDown") next = (index + 1) % tabs.length;
        else if (event.key === "ArrowUp") next = (index - 1 + tabs.length) % tabs.length;
        else if (event.key === "Home") next = 0;
        else if (event.key === "End") next = tabs.length - 1;
        else return;
        event.preventDefault();
        onSelect(tabs[next]);
        event.currentTarget.closest(".workspace-tab-rail")?.querySelectorAll<HTMLButtonElement>("[role='tab']")[next]?.focus();
      }}
    >
      <TabIcon tab={tab} />
    </button>
  );
}

export default function WorkspaceTabs({ activeTab, onSelect }: { activeTab: WorkspaceTab; onSelect: (tab: WorkspaceTab) => void }) {
  const railRef = useRef<HTMLDivElement>(null);
  const [indicatorY, setIndicatorY] = useState(4);

  useLayoutEffect(() => {
    const rail = railRef.current;
    if (!rail) return;

    function updateIndicator() {
      const selected = rail?.querySelector<HTMLButtonElement>('[role="tab"][aria-selected="true"]');
      if (selected && rail) {
        setIndicatorY(selected.getBoundingClientRect().top - rail.getBoundingClientRect().top);
      }
    }

    updateIndicator();
    const observer = new ResizeObserver(updateIndicator);
    observer.observe(rail);
    return () => observer.disconnect();
  }, [activeTab]);

  return (
    <div ref={railRef} className="workspace-tab-rail" role="tablist" aria-label="Workspace panels" aria-orientation="vertical">
      <div className="workspace-tab-indicator" aria-hidden="true" style={{ transform: `translate(4px, ${indicatorY}px)` }} />
      <div className="workspace-tab-group" role="presentation">
        {tabs.slice(0, 3).map((tab, index) => (
          <TabButton key={tab} tab={tab} index={index} activeTab={activeTab} onSelect={onSelect} />
        ))}
      </div>
      <div className="workspace-settings-slot" role="presentation">
        <TabButton tab="settings" index={3} activeTab={activeTab} onSelect={onSelect} />
      </div>
    </div>
  );
}
