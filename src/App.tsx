import { useEffect, useLayoutEffect, useRef, useState } from "react";
import type { CSSProperties, PointerEvent } from "react";
import { isTauri } from "@tauri-apps/api/core";
import { getCurrentWindow } from "@tauri-apps/api/window";
import Grid from "./components/Grid";
import AppearanceWindow from "./components/AppearanceWindow";
import Navbar from "./components/Navbar";
import WorkspacePanel from "./components/WorkspacePanel";
import WorkspaceTabs from "./components/WorkspaceTabs";
import type { WorkspaceTab } from "./components/WorkspaceTabs";
import type { AppearanceSettingsProps } from "./components/settings/AppearanceSettings";
import { accentChoices, isHexColor, presetColors, readColorProfiles } from "./theme";
import type { Accent, ColorProfile } from "./theme";
import "./App.css";

function storedChoice<T extends string>(key: string, choices: readonly T[], fallback: T): T {
  try {
    const value = localStorage.getItem(key);
    return choices.find((choice) => choice === value) ?? fallback;
  } catch {
    return fallback;
  }
}

function storedUiScale(): number {
  try {
    const value = Number(localStorage.getItem("symphony-ui-scale"));
    return Number.isInteger(value) && value >= 50 && value <= 150 ? value : 100;
  } catch {
    return 100;
  }
}

function App() {
  const [theme, setTheme] = useState<"dark" | "light">(() => storedChoice("symphony-theme", ["dark", "light"], "dark"));
  const [accent, setAccent] = useState<Accent>(() => storedChoice("symphony-accent", accentChoices, "grey"));
  const [customColor, setCustomColor] = useState(() => {
    try {
      const value = localStorage.getItem("symphony-custom-color");
      return isHexColor(value) ? value : presetColors.grey;
    } catch {
      return presetColors.grey;
    }
  });
  const [savedProfiles, setSavedProfiles] = useState<ColorProfile[]>(readColorProfiles);
  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(() => {
    try { return localStorage.getItem("symphony-selected-color-profile"); }
    catch { return null; }
  });
  const [glass, setGlass] = useState(() => storedChoice("symphony-glass", ["on", "off"], "on") === "on");
  const [gradients, setGradients] = useState(() => storedChoice("symphony-gradients", ["on", "off"], "on") === "on");
  const [uiScale, setUiScale] = useState(storedUiScale);
  const color = accent === "custom" ? customColor : presetColors[accent];
  const displayedColor = useRef<[number, number, number] | null>(null);

  useEffect(() => {
    const isMac = /Macintosh|Mac OS X/i.test(navigator.userAgent);

    function handleScaleShortcut(event: KeyboardEvent) {
      if (event.altKey || !(isMac ? event.metaKey : event.ctrlKey)) return;

      const increase = event.key === "+" || event.key === "=" || event.code === "NumpadAdd";
      const decrease = event.key === "-" || event.key === "_" || event.code === "NumpadSubtract";
      if (!increase && !decrease) return;

      event.preventDefault();
      setUiScale((current) => Math.max(50, Math.min(150, current + (increase ? 10 : -10))));
    }

    window.addEventListener("keydown", handleScaleShortcut, true);
    return () => window.removeEventListener("keydown", handleScaleShortcut, true);
  }, []);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    try {
      localStorage.setItem("symphony-theme", theme);
    } catch {
      // Keep theme switching available when storage is unavailable.
    }
  }, [theme]);

  useLayoutEffect(() => {
    const target: [number, number, number] = [1, 3, 5].map((index) => parseInt(color.slice(index, index + 2), 16)) as [number, number, number];
    const start = displayedColor.current;
    const root = document.documentElement;
    const applyColor = (rgb: [number, number, number]) => {
      displayedColor.current = rgb;
      root.style.setProperty("--accent", `rgb(${rgb.join(", ")})`);
      root.style.setProperty("--accent-soft", `rgba(${rgb.join(", ")}, 0.2)`);
    };

    if (!start || start.every((channel, index) => channel === target[index]) || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      applyColor(target);
      return;
    }

    let frameId: number;
    let startTime: number | null = null;
    const animate = (time: number) => {
      if (startTime === null) startTime = time;
      const progress = Math.min((time - startTime) / 320, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      applyColor(start.map((channel, index) => Math.round(channel + (target[index] - channel) * eased)) as [number, number, number]);
      if (progress < 1) frameId = requestAnimationFrame(animate);
    };
    frameId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frameId);
  }, [color]);

  useEffect(() => {
    const root = document.documentElement;
    root.dataset.glass = glass ? "on" : "off";
    root.dataset.gradients = gradients ? "on" : "off";
    root.style.setProperty("--ui-scale", String(uiScale / 100));
    try {
      localStorage.setItem("symphony-accent", accent);
      localStorage.setItem("symphony-custom-color", customColor);
      localStorage.setItem("symphony-color-profiles", JSON.stringify(savedProfiles));
      if (selectedProfileId) localStorage.setItem("symphony-selected-color-profile", selectedProfileId);
      else localStorage.removeItem("symphony-selected-color-profile");
      localStorage.setItem("symphony-glass", glass ? "on" : "off");
      localStorage.setItem("symphony-gradients", gradients ? "on" : "off");
      localStorage.setItem("symphony-ui-scale", String(uiScale));
    } catch {
      // Appearance settings still work for this session.
    }
  }, [accent, color, customColor, savedProfiles, selectedProfileId, glass, gradients, uiScale]);

  function selectPreset(choice: Accent) {
    setAccent(choice);
    setSelectedProfileId(null);
  }

  function chooseColor(value: string) {
    if (!isHexColor(value)) return;
    setCustomColor(value);
    setAccent("custom");
    setSelectedProfileId(null);
  }

  function selectProfile(profile: ColorProfile) {
    setCustomColor(profile.color);
    setAccent("custom");
    setSelectedProfileId(profile.id);
  }

  function saveProfile(name: string) {
    const trimmedName = name.trim();
    if (!trimmedName) return;
    const existing = savedProfiles.find((profile) => profile.name.toLowerCase() === trimmedName.toLowerCase());
    const id = existing?.id ?? crypto.randomUUID();
    setSavedProfiles((profiles) => existing
      ? profiles.map((profile) => profile.id === id ? { ...profile, name: trimmedName, color } : profile)
      : [...profiles, { id, name: trimmedName, color }]);
    setCustomColor(color);
    setAccent("custom");
    setSelectedProfileId(id);
  }

  function deleteProfile(id: string) {
    setSavedProfiles((profiles) => profiles.filter((profile) => profile.id !== id));
    if (selectedProfileId === id) setSelectedProfileId(null);
  }

  const [isFullscreen, setIsFullscreen] = useState(false);
  const [activeTab, setActiveTab] = useState<WorkspaceTab>("code");
  const [isAppearanceWindowOpen, setIsAppearanceWindowOpen] = useState(false);
  const [isAppearanceWindowMinimized, setIsAppearanceWindowMinimized] = useState(false);
  const [isAppearanceWindowMinimizing, setIsAppearanceWindowMinimizing] = useState(false);
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
    const width = currentDrag.startWidth + (clientX - currentDrag.startX) / (uiScale / 100);
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

  function openAppearanceWindow() {
    setIsAppearanceWindowMinimized(false);
    setIsAppearanceWindowMinimizing(false);
    setIsAppearanceWindowOpen(true);
    requestAnimationFrame(() => document.querySelector<HTMLButtonElement>(".popup-window .close-control")?.focus());
  }

  function minimizeAppearanceWindow() {
    setIsAppearanceWindowMinimizing(false);
    setIsAppearanceWindowMinimized(true);
  }

  function startMinimizingAppearanceWindow() {
    setIsAppearanceWindowMinimizing(true);
  }

  function restoreWindow(id: string) {
    if (id === "appearance") {
      setIsAppearanceWindowMinimized(false);
      setIsAppearanceWindowMinimizing(false);
    }
  }

  function closeAppearanceWindow() {
    setIsAppearanceWindowMinimized(false);
    setIsAppearanceWindowMinimizing(false);
    setIsAppearanceWindowOpen(false);
    requestAnimationFrame(() => document.querySelector<HTMLButtonElement>('[aria-controls="window-dropdown"]')?.focus());
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


  const appearanceSettings: AppearanceSettingsProps = {
    theme, onThemeToggle: toggleTheme,
    accent, onAccentChange: selectPreset, color, onColorChange: chooseColor,
    savedProfiles, selectedProfileId, onProfileSelect: selectProfile,
    onProfileSave: saveProfile, onProfileDelete: deleteProfile,
    glass, onGlassChange: setGlass, gradients, onGradientsChange: setGradients,
    uiScale, onUiScaleChange: setUiScale,
  };

  return (
    <>
      <Navbar isFullscreen={isFullscreen} onFullscreenChange={setIsFullscreen}
        onAppearanceOpen={openAppearanceWindow}
        minimizedWindows={isAppearanceWindowMinimized || isAppearanceWindowMinimizing ? [{ id: "appearance", title: "Appearance" }] : []}
        onWindowRestore={restoreWindow} uiScale={uiScale} />
      <WorkspaceTabs activeTab={activeTab} uiScale={uiScale} onSelect={(tab) => {
        setActiveTab(tab);
        if (!isPanelOpen) setPanelWidth(lastExpandedWidth.current);
      }} />

      <main
        ref={appContent}
        className={`app-content${isPanelOpen ? "" : " is-panel-collapsed"}${isResizing ? " is-resizing" : ""}`}
        style={{ "--panel-width": panelWidth === null ? "max(320px, 25%)" : `${panelWidth}px` } as CSSProperties}
      >
        <WorkspacePanel collapsed={!isPanelOpen} activeTab={activeTab} settings={appearanceSettings} />
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
              startWidth: panel.getBoundingClientRect().width / (uiScale / 100),
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
        <div className="grid-pane"><Grid uiScale={uiScale} /></div>
      </main>
      {isAppearanceWindowOpen && <AppearanceWindow settings={appearanceSettings} onClose={closeAppearanceWindow}
        onMinimizeStart={startMinimizingAppearanceWindow} onMinimize={minimizeAppearanceWindow}
        minimized={isAppearanceWindowMinimized} />}
    </>
  );
}

export default App;
