import { useEffect, useRef, useState } from "react";
import type { MouseEvent } from "react";
import "./Navbar.css";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { isTauri } from "@tauri-apps/api/core";
import { openUrl } from "@tauri-apps/plugin-opener";

function isInteractiveTarget(event: MouseEvent<HTMLElement>) {
    return event.target instanceof Element &&
        event.target.closest("button, a, input, select, textarea, [role='button']") !== null;
}

type NavbarProps = {
    isFullscreen: boolean;
    onFullscreenChange: (isFullscreen: boolean) => void;
    onAppearanceOpen: () => void;
    minimizedWindows: Array<{ id: string; title: string }>;
    onWindowRestore: (id: string) => void;
    uiScale: number;
};

export default function Navbar({ isFullscreen, onFullscreenChange, onAppearanceOpen, minimizedWindows, onWindowRestore, uiScale }: NavbarProps) {
    const appWindow = isTauri() ? getCurrentWindow() : null;
    const [openMenu, setOpenMenu] = useState<"file" | "project" | "window" | "help" | null>(null);
    const [navbarVisible, setNavbarVisible] = useState(false);
    const activeDropdown = useRef<HTMLDivElement>(null);
    const minimizedSection = useRef<HTMLDivElement>(null);
    const [showFullWindowNames, setShowFullWindowNames] = useState(true);

    useEffect(() => {
        const section = minimizedSection.current;
        if (!section || minimizedWindows.length === 0) {
            setShowFullWindowNames(true);
            return;
        }

        const updateLabelMode = () => {
            const buttons = [...section.querySelectorAll<HTMLButtonElement>(".minimized-window-button")];
            const style = getComputedStyle(section);
            const gap = parseFloat(style.columnGap) || 0;
            const neededWidth = buttons.reduce((total, button) => {
                const measure = button.querySelector<HTMLElement>(".minimized-window-measure");
                const buttonStyle = getComputedStyle(button);
                return total + (measure?.getBoundingClientRect().width ?? 0)
                    + parseFloat(buttonStyle.paddingLeft) + parseFloat(buttonStyle.paddingRight)
                    + parseFloat(buttonStyle.borderLeftWidth) + parseFloat(buttonStyle.borderRightWidth);
            }, 0) + Math.max(0, buttons.length - 1) * gap;
            setShowFullWindowNames(neededWidth <= section.clientWidth);
        };

        const observer = new ResizeObserver(updateLabelMode);
        observer.observe(section);
        updateLabelMode();
        return () => observer.disconnect();
    }, [minimizedWindows]);

    useEffect(() => {
        if (!isFullscreen) {
            setNavbarVisible(false);
            return;
        }

        function revealAtTop(event: globalThis.PointerEvent) {
            if (event.pointerType !== "mouse") return;
            if (event.clientY <= 12) {
                setNavbarVisible(true);
            } else if (event.clientY > 48 &&
                !(event.target instanceof Element && event.target.closest(".navbar"))) {
                setNavbarVisible(false);
                setOpenMenu(null);
            }
        }

        document.addEventListener("pointermove", revealAtTop);
        return () => document.removeEventListener("pointermove", revealAtTop);
    }, [isFullscreen]);

    useEffect(() => {
        function closeOutside(event: globalThis.PointerEvent) {
            if (event.target instanceof Node && !activeDropdown.current?.contains(event.target)) {
                setOpenMenu(null);
            }
        }
        function closeOnEscape(event: KeyboardEvent) {
            if (event.key === "Escape") {
                activeDropdown.current?.querySelector("button")?.focus();
                setOpenMenu(null);
            }
        }
        document.addEventListener("pointerdown", closeOutside, true);
        document.addEventListener("keydown", closeOnEscape);
        return () => {
            document.removeEventListener("pointerdown", closeOutside, true);
            document.removeEventListener("keydown", closeOnEscape);
        };
    }, []);

    async function toggleFullscreen() {
        if (!appWindow) return;
        const fullscreen = !(await appWindow.isFullscreen());
        await appWindow.setFullscreen(fullscreen);
        if (fullscreen && document.activeElement instanceof HTMLElement) {
            document.activeElement.blur();
        }
        onFullscreenChange(fullscreen);
    }

    return (
        <nav
            className={`navbar${isFullscreen && navbarVisible ? " is-revealed" : ""}`}
            onPointerMove={(event) => {
                if (event.pointerType !== "mouse") return;
                const navbar = event.currentTarget;
                const bounds = navbar.getBoundingClientRect();
                navbar.style.setProperty("--glow-x", `${(event.clientX - bounds.left) / (uiScale / 100)}px`);
                navbar.style.setProperty("--glow-y", `${(event.clientY - bounds.top) / (uiScale / 100)}px`);
                navbar.style.setProperty("--glow-opacity", "1");
            }}
            onPointerLeave={(event) => {
                event.currentTarget.style.setProperty("--glow-opacity", "0");
            }}
            onMouseDown={(event) => {
                if (event.button === 0 && event.detail === 1 && !isInteractiveTarget(event)) {
                    void appWindow?.startDragging();
                }
            }}
            onDoubleClick={(event) => {
                if (event.button === 0 && !isInteractiveTarget(event)) {
                    void appWindow?.toggleMaximize();
                }
            }}
        >
            <div className="navbar-left">
                <div className="dropdown" ref={openMenu === "file" ? activeDropdown : null}>
                    <button className="menu-button" aria-expanded={openMenu === "file"} aria-controls="file-dropdown" onClick={() => setOpenMenu(openMenu === "file" ? null : "file")}>File</button>

                    <div id="file-dropdown" className="dropdown-content" hidden={openMenu !== "file"} onClick={() => setOpenMenu(null)}>
                        <button>New .sb3</button>
                        <button>Load .sb3</button>
                    </div>
                </div>

                <div className="dropdown" ref={openMenu === "project" ? activeDropdown : null}>
                    <button className="menu-button" aria-expanded={openMenu === "project"} aria-controls="project-dropdown" onClick={() => setOpenMenu(openMenu === "project" ? null : "project")}>Project</button>

                    <div id="project-dropdown" className="dropdown-content" hidden={openMenu !== "project"} onClick={() => setOpenMenu(null)}>
                        <button>Project Settings</button>
                    </div>
                </div>
                <div className="dropdown" ref={openMenu === "window" ? activeDropdown : null}>
                    <button className="menu-button" aria-expanded={openMenu === "window"} aria-controls="window-dropdown" onClick={() => setOpenMenu(openMenu === "window" ? null : "window")}>Window</button>

                    <div id="window-dropdown" className="dropdown-content" hidden={openMenu !== "window"} onClick={() => setOpenMenu(null)}>
                        <button type="button" onClick={onAppearanceOpen}>Appearance</button>
                    </div>
                </div>
                <div className="dropdown" ref={openMenu === "help" ? activeDropdown : null}>
                    <button className="menu-button" aria-expanded={openMenu === "help"} aria-controls="help-dropdown" onClick={() => setOpenMenu(openMenu === "help" ? null : "help")}>Help</button>

                    <div id="help-dropdown" className="dropdown-content" hidden={openMenu !== "help"} onClick={() => setOpenMenu(null)}>
                        <a
                            href="https://github.com/sujalchan/symphony"
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(event) => {
                                if (isTauri()) {
                                    event.preventDefault();
                                    void openUrl(event.currentTarget.href);
                                }
                            }}
                        >
                            Project GitHub
                        </a>
                    </div>
                </div>
            </div>

            {minimizedWindows.length > 0 && (
                <div ref={minimizedSection} className="navbar-minimized-windows" role="group" aria-label="Minimized windows">
                    {minimizedWindows.map((item) => (
                        <button key={item.id} type="button" className="minimized-window-button"
                            data-window-id={item.id} title={`${item.title} Popup`} aria-label={`Restore ${item.title}`}
                            onClick={() => onWindowRestore(item.id)}>
                            <span>{showFullWindowNames ? item.title : `${item.title.slice(0, 3)}...`}</span>
                            <span className="minimized-window-measure" aria-hidden="true">{item.title}</span>
                        </button>
                    ))}
                </div>
            )}

            <div className="navbar-right">
                <div className="window-controls">
                    <button
                        className="window-control fullscreen-control"
                        type="button"
                        aria-label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
                        data-label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
                        onClick={toggleFullscreen}
                    />
                    <button
                        className="window-control minimize-control"
                        type="button"
                        aria-label="Minimize window"
                        data-label="Minimize"
                        disabled={isFullscreen}
                        onClick={() => appWindow?.minimize()}
                    />
                    <button
                        className="window-control close-control"
                        type="button"
                        aria-label="Close Symphony IDE"
                        data-label="Close Symphony IDE"
                        onClick={() => appWindow?.close()}
                    />
                </div>
            </div>
        </nav>
    );
}
