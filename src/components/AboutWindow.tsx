import PopupWindow from "./PopupWindow";
import SymphonyMark from "./SymphonyMark";
import "./AboutWindow.css";

export default function AboutWindow({ onClose, onMinimizeStart, onMinimize, minimized, uiScale }: {
  onClose: () => void;
  onMinimizeStart: () => void;
  onMinimize: () => void;
  minimized: boolean;
  uiScale: number;
}) {
  return (
    <PopupWindow title="About Symphony IDE" windowId="about" onClose={onClose} onMinimizeStart={onMinimizeStart}
      onMinimize={onMinimize} minimized={minimized} uiScale={uiScale} initialSize={{ width: 420, height: 250 }}
      minSize={{ width: 420, height: 250 }} resizable={false} bodyClassName="about-popup-body">
      <div className="about-window-content">
        <SymphonyMark className="about-window-logo" />
        <h1>Symphony IDE</h1>
        <p className="about-window-copyright">Static Talent Group 2026 ©</p>
      </div>
    </PopupWindow>
  );
}
