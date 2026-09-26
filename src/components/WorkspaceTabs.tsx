import "./WorkspaceTabs.css";

export type WorkspaceTab = "code" | "costume" | "sounds";

const tabs: WorkspaceTab[] = ["code", "costume", "sounds"];

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
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M3 10v4M7 6v12M11 3v18M15 7v10M19 5v14M23 10v4" />
    </svg>
  );
}

export default function WorkspaceTabs({ activeTab, onSelect }: { activeTab: WorkspaceTab; onSelect: (tab: WorkspaceTab) => void }) {
  return (
    <div className="workspace-tab-rail" role="tablist" aria-label="Workspace panels" aria-orientation="vertical">
      {tabs.map((tab, index) => {
        const label = tab === "sounds" ? "Sounds" : tab === "costume" ? "Costume" : "Code";
        return (
          <button
            key={tab}
            type="button"
            role="tab"
            id={`${tab}-tab`}
            aria-label={label}
            title={label}
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
              event.currentTarget.parentElement?.querySelectorAll<HTMLButtonElement>("[role='tab']")[next]?.focus();
            }}
          >
            <TabIcon tab={tab} />
          </button>
        );
      })}
    </div>
  );
}
