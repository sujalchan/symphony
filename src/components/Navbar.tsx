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
    theme: "dark" | "light";
    onThemeToggle: () => void;
};

export default function Navbar({ isFullscreen, onFullscreenChange, theme, onThemeToggle }: NavbarProps) {
    const window = getCurrentWindow();
    const [openMenu, setOpenMenu] = useState<"file" | "project" | "window" | "help" | null>(null);
    const activeDropdown = useRef<HTMLDivElement>(null);

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
        const fullscreen = !(await window.isFullscreen());
        await window.setFullscreen(fullscreen);
        onFullscreenChange(fullscreen);
    }

    return (
        <nav
            className="navbar"
            onMouseDown={(event) => {
                if (event.button === 0 && event.detail === 1 && !isInteractiveTarget(event)) {
                    void window.startDragging();
                }
            }}
            onDoubleClick={(event) => {
                if (event.button === 0 && !isInteractiveTarget(event)) {
                    void window.toggleMaximize();
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
                        <button type="button" onClick={onThemeToggle}>
                            {theme === "dark" ? "Light mode" : "Dark mode"}
                        </button>
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
                        onClick={() => window.minimize()}
                    />
                    <button
                        className="window-control close-control"
                        type="button"
                        aria-label="Close window"
                        data-label="Close Symphony"
                        onClick={() => window.close()}
                    />
                </div>
            </div>
        </nav>
    );
}
