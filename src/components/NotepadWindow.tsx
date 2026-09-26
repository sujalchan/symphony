import { useRef, useState } from "react";
import PopupWindow from "./PopupWindow";
import "./NotepadWindow.css";

export default function NotepadWindow({ onClose, onMinimizeStart, onMinimize, minimized, uiScale, popupGlide }: {
  onClose: () => void;
  onMinimizeStart: () => void;
  onMinimize: () => void;
  minimized: boolean;
  uiScale: number;
  popupGlide: number;
}) {
  const [history, setHistory] = useState([""]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [caret, setCaret] = useState({ line: 1, column: 1 });
  const gutterContent = useRef<HTMLDivElement>(null);
  const text = history[historyIndex];
  const lines = text.split("\n");
  const firstLine = lines[0].trim();
  const titlePreview = firstLine.length > 28 ? `${firstLine.slice(0, 28)}…` : firstLine;
  const title = titlePreview ? `Notepad - ${titlePreview}` : "Notepad";

  function changeText(value: string) {
    setHistory((current) => [...current.slice(0, historyIndex + 1), value]);
    setHistoryIndex((current) => current + 1);
  }

  function undo() {
    setHistoryIndex((current) => Math.max(0, current - 1));
  }

  function redo() {
    setHistoryIndex((current) => Math.min(history.length - 1, current + 1));
  }

  function updateCaret(target: HTMLTextAreaElement) {
    const beforeCaret = target.value.slice(0, target.selectionStart);
    const caretLines = beforeCaret.split("\n");
    setCaret({ line: caretLines.length, column: caretLines[caretLines.length - 1].length + 1 });
  }

  return (
    <PopupWindow title={title} windowId="notepad" onClose={onClose} onMinimizeStart={onMinimizeStart}
      onMinimize={onMinimize} minimized={minimized} uiScale={uiScale} popupGlide={popupGlide}
      initialSize={{ width: 520, height: 420 }} minSize={{ width: 520, height: 420 }} bodyClassName="notepad-popup-body">
      <div className="notepad-menu" role="menubar" aria-label="Notepad menu">
        <button type="button" className="notepad-history-control" onClick={undo} disabled={historyIndex === 0}
          aria-label="Undo" title="Undo">↶ <span>Undo</span></button>
        <button type="button" className="notepad-history-control" onClick={redo} disabled={historyIndex === history.length - 1}
          aria-label="Redo" title="Redo">↷ <span>Redo</span></button>
      </div>
      <div className="notepad-editor">
        <div className="notepad-gutter" aria-hidden="true">
          <div ref={gutterContent}>{lines.map((_, index) => <span key={index}>{index + 1}</span>)}</div>
        </div>
        <textarea value={text} onChange={(event) => { changeText(event.target.value); updateCaret(event.target); }}
          onSelect={(event) => updateCaret(event.currentTarget)}
          onScroll={(event) => {
            if (gutterContent.current) gutterContent.current.style.transform = `translateY(${-event.currentTarget.scrollTop}px)`;
          }}
          placeholder="Start typing…" aria-label="Notepad text" spellCheck wrap="off" />
      </div>
      <div className="notepad-status" aria-live="polite">
        <span>Ln {caret.line}, Col {caret.column}</span>
        <span>UTF-8</span>
      </div>
    </PopupWindow>
  );
}
