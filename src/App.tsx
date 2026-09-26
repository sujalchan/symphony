import { useEffect, useRef, useState } from "react";
import type { CSSProperties, PointerEvent } from "react";
import { isTauri } from "@tauri-apps/api/core";
import { getCurrentWindow } from "@tauri-apps/api/window";
import Grid from "./components/Grid";
import Navbar from "./components/Navbar";
import WorkspacePanel from "./components/WorkspacePanel";
import WorkspaceTabs from "./components/WorkspaceTabs";
import type { WorkspaceTab } from "./components/WorkspaceTabs";
import "./App.css";

function App() {
  const [theme, setTheme] = useState<"dark" | "light">(() => {
    try {
      return localStorage.getItem("symphony-theme") === "light" ? "light" : "dark";
    } catch {
      return "dark";
    }
  });

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    try {
      localStorage.setItem("symphony-theme", theme);
    } catch {
      // Keep theme switching available when storage is unavailable.
    }
  }, [theme]);

  const [isFullscreen, setIsFullscreen] = useState(false);
  const [activeTab, setActiveTab] = useState<WorkspaceTab>("code");
  const [panelWidth, setPanelWidth] = useState<number | null>(null);
  const [isResizing, setIsResizing] = useState(false);
  const appContent = useRef<HTMLElement>(null);
  const lastExpandedWidth = useRef<number | null>(null);
  const drag = useRef<{ id: number; startX: number; startWidth: number; startValue: number | null; moved: boolean } | null>(null);
  const suppressClickUntil = useRef(0);
  const isPanelOpen = panelWidth !== 0;

  function maximumPanelWidth(contentWidth: number) {
    return Math.max(0, (contentWidth - 12) / 2);
  }

  function availableContentWidth() {
    const content = appContent.current;
    if (!content) return 0;
    const style = getComputedStyle(content);
    return content.clientWidth - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight);
  }

  function draggedWidth(clientX: number) {
    const currentDrag = drag.current;
    if (!currentDrag || !appContent.current) return panelWidth ?? 320;
    const contentWidth = availableContentWidth();
    const width = currentDrag.startWidth + clientX - currentDrag.startX;
    return Math.max(0, Math.min(maximumPanelWidth(contentWidth), width));
  }

  useEffect(() => {
    const content = appContent.current;
    if (!content) return;

    const observer = new ResizeObserver(() => {
      const maximum = maximumPanelWidth(availableContentWidth());
      setPanelWidth((width) => width === null || width === 0 ? width : Math.min(width, maximum));
      if (lastExpandedWidth.current !== null) {
        lastExpandedWidth.current = Math.min(lastExpandedWidth.current, maximum);
      }
    });
    observer.observe(content);
    return () => observer.disconnect();
  }, []);

  function toggleTheme() {
    setTheme((current) => current === "dark" ? "light" : "dark");
  }

  useEffect(() => {
    if (!isTauri()) return;

    const preventContextMenu = (event: MouseEvent) => event.preventDefault();
    document.addEventListener("contextmenu", preventContextMenu, true);
    return () => document.removeEventListener("contextmenu", preventContextMenu, true);
  }, []);

  useEffect(() => {
    if (!isTauri()) return;
    void getCurrentWindow().setMinimizable(!isFullscreen);
  }, [isFullscreen]);

  useEffect(() => {
    if (!isTauri()) return;

    const appWindow = getCurrentWindow();
    let disposed = false;
    let unlisten: (() => void) | undefined;

    async function updateWindowState() {
      const fullscreen = await appWindow.isFullscreen();
      if (!disposed) {
        setIsFullscreen(fullscreen);
        document.documentElement.classList.toggle("window-fullscreen", fullscreen);
      }
    }

    void updateWindowState();
    void appWindow.onResized(() => {
      void updateWindowState();
    }).then((stopListening) => {
      if (disposed) stopListening();
      else unlisten = stopListening;
    });

    return () => {
      disposed = true;
      unlisten?.();
      document.documentElement.classList.remove("window-fullscreen");
    };
  }, []);


  return (
    <>
      <Navbar isFullscreen={isFullscreen} onFullscreenChange={setIsFullscreen} theme={theme} onThemeToggle={toggleTheme} />
      <WorkspaceTabs activeTab={activeTab} onSelect={(tab) => {
        setActiveTab(tab);
        if (!isPanelOpen) setPanelWidth(lastExpandedWidth.current);
      }} />

      <main
        ref={appContent}
        className={`app-content${isPanelOpen ? "" : " is-panel-collapsed"}${isResizing ? " is-resizing" : ""}`}
        style={{ "--panel-width": panelWidth === null ? "max(320px, 25%)" : `${panelWidth}px` } as CSSProperties}
      >
        <WorkspacePanel collapsed={!isPanelOpen} activeTab={activeTab} theme={theme} onThemeToggle={toggleTheme} />
        <button
          className="workspace-divider"
          type="button"
          aria-label={isPanelOpen ? "Hide left panel" : "Show left panel"}
          aria-controls="workspace-panel"
          aria-expanded={isPanelOpen}
          onPointerDown={(event: PointerEvent<HTMLButtonElement>) => {
            if (event.button !== 0 || !event.isPrimary) return;
            const panel = appContent.current?.querySelector<HTMLElement>(".workspace-panel");
            if (!panel) return;
            drag.current = {
              id: event.pointerId,
              startX: event.clientX,
              startWidth: panel.getBoundingClientRect().width,
              startValue: panelWidth,
              moved: false,
            };
            event.currentTarget.setPointerCapture(event.pointerId);
          }}
          onPointerMove={(event: PointerEvent<HTMLButtonElement>) => {
            const currentDrag = drag.current;
            if (currentDrag?.id !== event.pointerId) return;
            if (Math.abs(event.clientX - currentDrag.startX) > 4) currentDrag.moved = true;
            if (!currentDrag.moved) return;
            setIsResizing(true);
            setPanelWidth(draggedWidth(event.clientX));
          }}
          onPointerUp={(event: PointerEvent<HTMLButtonElement>) => {
            const currentDrag = drag.current;
            if (currentDrag?.id !== event.pointerId) return;
            if (currentDrag.moved) {
              const width = draggedWidth(event.clientX);
              const maximum = appContent.current ? maximumPanelWidth(availableContentWidth()) : width;
              const snappedWidth = width < 100 ? 0 : Math.min(maximum, Math.max(320, width));
              setPanelWidth(snappedWidth);
              if (snappedWidth > 0) lastExpandedWidth.current = snappedWidth;
              suppressClickUntil.current = performance.now() + 250;
            }
            drag.current = null;
            setIsResizing(false);
            event.currentTarget.releasePointerCapture(event.pointerId);
          }}
          onPointerCancel={(event: PointerEvent<HTMLButtonElement>) => {
            if (drag.current?.id !== event.pointerId) return;
            setPanelWidth(drag.current.startValue);
            drag.current = null;
            setIsResizing(false);
          }}
          onClick={() => {
            if (performance.now() < suppressClickUntil.current) return;
            setPanelWidth((width) => width === 0 ? lastExpandedWidth.current : 0);
          }}
        ><span aria-hidden="true">{isPanelOpen ? "‹" : "›"}</span></button>
        <div className="grid-pane"><Grid /></div>
      </main>
    </>
  );
}

export default App;
