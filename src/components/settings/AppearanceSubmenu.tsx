import { useId, useState } from "react";
import type { ReactNode } from "react";

export default function AppearanceSubmenu({ title, children, visible = true, forceExpanded = false }: {
  title: string;
  children: ReactNode;
  visible?: boolean;
  forceExpanded?: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const contentId = useId();
  const isExpanded = expanded || forceExpanded;

  return (
    <div className="appearance-submenu" data-expanded={isExpanded} hidden={!visible}>
      <button className="appearance-toggle appearance-submenu-toggle" type="button"
        aria-expanded={isExpanded} aria-controls={contentId} disabled={forceExpanded}
        onClick={() => setExpanded((current) => !current)}>
        <span>{title}</span>
        <svg viewBox="0 0 12 12" aria-hidden="true" focusable="false"><path d="m3 4.5 3 3 3-3" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
      </button>
      <div id={contentId} className="appearance-submenu-content" aria-hidden={!isExpanded} inert={!isExpanded}>
        <div className="appearance-submenu-inner">
          <div className="appearance-submenu-fields">{children}</div>
        </div>
      </div>
    </div>
  );
}
