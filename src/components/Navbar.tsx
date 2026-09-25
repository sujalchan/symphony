import type { MouseEvent } from "react";
import "./Navbar.css";
import { getCurrentWindow } from "@tauri-apps/api/window";

function isInteractiveTarget(event: MouseEvent<HTMLElement>) {
    return event.target instanceof Element &&
        event.target.closest("button, a, input, select, textarea, [role='button']") !== null;
}

type NavbarProps = {
    isFullscreen: boolean;
    onFullscreenChange: (fullscreen: boolean) => void;
};

export default function Navbar({ isFullscreen, onFullscreenChange }: NavbarProps) {
    const window = getCurrentWindow();

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
                <div className="dropdown">
                    <button className="menu-button">File</button>

                    <div className="dropdown-content">
                        <button>New Project</button>
                        <button>Load Project</button>
                    </div>
                </div>

                <div className="dropdown">
                    <button className="menu-button">Project</button>

                    <div className="dropdown-content">
                        <button>Project Settings</button>
                    </div>
                </div>
            </div>

            <div className="navbar-right">
                <div className="window-controls">

                    <button
                        className="window-control fullscreen-control"
                        type="button"
                        aria-label="Toggle fullscreen"
                        onClick={toggleFullscreen}
                    />
                    <button
                        className="window-control minimize-control"
                        type="button"
                        aria-label="Minimize window"
                        disabled={isFullscreen}
                        onClick={async () => {
                            if (!(await window.isFullscreen())) await window.minimize();
                        }}
                    />
                    <button
                        className="window-control close-control"
                        type="button"
                        aria-label="Close window"
                        onClick={() => window.close()}
                    />

                </div>
            </div>
        </nav>
    );
}
