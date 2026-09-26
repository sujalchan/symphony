import { useEffect, useId, useRef, useState } from "react";
import type { AnimationEvent, CSSProperties, KeyboardEvent, PointerEvent, ReactNode } from "react";
import "./Navbar.css";
import "./PopupWindow.css";

type Position = { x: number; y: number };
type Size = { width: number; height: number };
type Gesture = {
  kind: "move" | "resize";
  pointerId: number;
  clientX: number;
  clientY: number;
  position: Position;
  size: Size;
};

type PopupWindowProps = {
  title: string;
  children: ReactNode;
  onClose: () => void;
  onMinimizeStart?: () => void;
  onMinimize?: () => void;
  minimized?: boolean;
  windowId?: string;
  bodyClassName?: string;
  uiScale: number;
  initialSize?: Size;
  minSize?: Size;
  resizable?: boolean;
};

const DEFAULT_MIN_SIZE = { width: 280, height: 220 };

export default function PopupWindow({ title, children, onClose, onMinimizeStart, onMinimize, minimized = false, windowId, bodyClassName = "", uiScale, initialSize = { width: 360, height: 420 }, minSize = DEFAULT_MIN_SIZE, resizable = true }: PopupWindowProps) {
  const titleId = useId();
  const windowRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const gesture = useRef<Gesture | null>(null);
  const stopListening = useRef<(() => void) | null>(null);
  const minimizePending = useRef(false);
  const rubberbandTimer = useRef<number | null>(null);
  const wasMinimized = useRef(minimized);
  const [position, setPosition] = useState<Position | null>(null);
  const [size, setSize] = useState<Size>(initialSize);
  const [focused, setFocused] = useState(true);
  const [previewResizing, setPreviewResizing] = useState(false);
  const [rubberbanding, setRubberbanding] = useState(false);
  const [motion, setMotion] = useState<"idle" | "minimizing" | "restoring">("idle");
  const scale = uiScale / 100;

  function limits() {
    const root = windowRef.current?.parentElement;
    return {
      width: Math.max(0, (root?.clientWidth ?? initialSize.width) - 24),
      height: Math.max(0, (root?.clientHeight ?? initialSize.height) - 24),
    };
  }

  function clampSize(next: Size, at: Position): Size {
    const available = limits();
    const maxWidth = Math.max(0, available.width + 12 - at.x);
    const maxHeight = Math.max(0, available.height + 12 - at.y);
    return {
      width: Math.min(Math.max(Math.min(minSize.width, maxWidth), next.width), maxWidth),
      height: Math.min(Math.max(Math.min(minSize.height, maxHeight), next.height), maxHeight),
    };
  }

  function clampPosition(next: Position, currentSize: Size): Position {
    const available = limits();
    return {
      x: Math.max(12, Math.min(next.x, Math.max(12, available.width + 12 - currentSize.width))),
      y: Math.max(12, Math.min(next.y, Math.max(12, available.height + 12 - currentSize.height))),
    };
  }

  useEffect(() => {
    closeRef.current?.focus();
    const onPointerDown = (event: globalThis.PointerEvent) => {
      setFocused(event.target instanceof Node && !!windowRef.current?.contains(event.target));
    };
    const onFocusIn = (event: FocusEvent) => {
      setFocused(event.target instanceof Node && !!windowRef.current?.contains(event.target));
    };
    document.addEventListener("pointerdown", onPointerDown, true);
    document.addEventListener("focusin", onFocusIn, true);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown, true);
      document.removeEventListener("focusin", onFocusIn, true);
      stopListening.current?.();
      if (rubberbandTimer.current !== null) window.clearTimeout(rubberbandTimer.current);
    };
  }, []);

  useEffect(() => {
    if (minimized) {
      setMotion("idle");
    } else {
      if (wasMinimized.current) setMotion("restoring");
      closeRef.current?.focus();
    }
    wasMinimized.current = minimized;
  }, [minimized]);

  function minimizeWindow() {
    if (!onMinimize || minimizePending.current || motion === "minimizing") return;
    minimizePending.current = true;
    onMinimizeStart?.();
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const element = windowRef.current;
        const target = windowId && [...document.querySelectorAll<HTMLElement>(".minimized-window-button")]
          .find((button) => button.dataset.windowId === windowId);
        if (element && target) {
          const sourceBounds = element.getBoundingClientRect();
          const targetBounds = target.getBoundingClientRect();
          element.style.setProperty("--popup-minimize-x", `${(targetBounds.left + targetBounds.width / 2 - sourceBounds.left - sourceBounds.width / 2) / scale}px`);
          element.style.setProperty("--popup-minimize-y", `${(targetBounds.top + targetBounds.height / 2 - sourceBounds.top - sourceBounds.height / 2) / scale}px`);
        } else {
          element?.style.setProperty("--popup-minimize-x", "0px");
          element?.style.setProperty("--popup-minimize-y", "-22px");
        }
        setMotion("minimizing");
      });
    });
  }

  function finishMotion(event: AnimationEvent<HTMLDivElement>) {
    if (event.target !== event.currentTarget) return;
    if (motion === "minimizing") {
      minimizePending.current = false;
      setMotion("idle");
      onMinimize?.();
    } else if (motion === "restoring") {
      setMotion("idle");
    }
  }

  useEffect(() => {
    function closeOnEscape(event: globalThis.KeyboardEvent) {
      if (event.key !== "Escape") return;
      event.stopPropagation();
      onClose();
    }
    window.addEventListener("keydown", closeOnEscape, true);
    return () => window.removeEventListener("keydown", closeOnEscape, true);
  }, [onClose]);

  useEffect(() => {
    const element = windowRef.current;
    const root = element?.parentElement;
    if (!element || !root) return;
    const observer = new ResizeObserver(() => {
      const available = limits();
      setSize((current) => ({
        width: Math.min(current.width, available.width),
        height: Math.min(current.height, available.height),
      }));
      setPosition((current) => current && clampPosition(current, {
        width: Math.min(element.offsetWidth, available.width),
        height: Math.min(element.offsetHeight, available.height),
      }));
    });
    observer.observe(root);
    return () => observer.disconnect();
  }, []);

  function beginGesture(event: PointerEvent<HTMLElement>, kind: Gesture["kind"]) {
    if (event.button !== 0 || !event.isPrimary || (kind === "move" && event.target instanceof Element && event.target.closest("button"))) return;
    const element = windowRef.current;
    const root = element?.parentElement;
    if (!element || !root) return;
    const bounds = element.getBoundingClientRect();
    const rootBounds = root.getBoundingClientRect();
    const start = {
      x: (bounds.left - rootBounds.left) / scale,
      y: (bounds.top - rootBounds.top) / scale,
    };
    const currentSize = { width: element.offsetWidth, height: element.offsetHeight };
    setPreviewResizing(false);
    setRubberbanding(false);
    if (rubberbandTimer.current !== null) {
      window.clearTimeout(rubberbandTimer.current);
      rubberbandTimer.current = null;
    }
    gesture.current = { kind, pointerId: event.pointerId, clientX: event.clientX, clientY: event.clientY, position: start, size: currentSize };
    setPosition(start);
    setSize(currentSize);
    if (kind === "move") {
      element.style.left = `${start.x}px`;
      element.style.top = `${start.y}px`;
      element.style.willChange = "transform";
      element.style.transform = "translate3d(0, 0, 0)";
    }
    const target = event.currentTarget;
    target.setPointerCapture(event.pointerId);
    event.preventDefault();

    stopListening.current?.();
    const draggedPosition = (pointer: globalThis.PointerEvent, current: Gesture) => clampPosition({
      x: current.position.x + (pointer.clientX - current.clientX) / scale,
      y: current.position.y + (pointer.clientY - current.clientY) / scale,
    }, current.size);
    const move = (pointer: globalThis.PointerEvent) => {
      const current = gesture.current;
      if (current?.pointerId !== pointer.pointerId) return;
      if (current.kind === "move") {
        const next = draggedPosition(pointer, current);
        element.style.transform = `translate3d(${next.x - current.position.x}px, ${next.y - current.position.y}px, 0)`;
      } else {
        const dx = (pointer.clientX - current.clientX) / scale;
        const dy = (pointer.clientY - current.clientY) / scale;
        setSize(clampSize({ width: current.size.width + dx, height: current.size.height + dy }, current.position));
        if (!resizable) setPreviewResizing(true);
      }
    };
    const stop = (pointer: globalThis.PointerEvent) => {
      const current = gesture.current;
      if (current?.pointerId !== pointer.pointerId) return;
      gesture.current = null;
      stopListening.current?.();
      if (current.kind === "move") {
        const next = draggedPosition(pointer, current);
        element.style.left = `${next.x}px`;
        element.style.top = `${next.y}px`;
        element.style.transform = "";
        element.style.willChange = "";
        setPosition(next);
      }
      if (!resizable && current.kind === "resize") {
        setPreviewResizing(false);
        if (Math.abs(pointer.clientX - current.clientX) > 1 || Math.abs(pointer.clientY - current.clientY) > 1) {
          setRubberbanding(true);
          setSize(current.size);
          rubberbandTimer.current = window.setTimeout(() => {
            rubberbandTimer.current = null;
            setRubberbanding(false);
          }, 340);
        }
      }
      if (target.hasPointerCapture(pointer.pointerId)) target.releasePointerCapture(pointer.pointerId);
    };
    window.addEventListener("pointermove", move, true);
    window.addEventListener("pointerup", stop, true);
    window.addEventListener("pointercancel", stop, true);
    stopListening.current = () => {
      window.removeEventListener("pointermove", move, true);
      window.removeEventListener("pointerup", stop, true);
      window.removeEventListener("pointercancel", stop, true);
      stopListening.current = null;
    };
  }

  function resizeWithKeyboard(event: KeyboardEvent<HTMLDivElement>) {
    if (!resizable) return;
    const step = event.shiftKey ? 20 : 10;
    const delta = {
      ArrowRight: { width: step, height: 0 },
      ArrowLeft: { width: -step, height: 0 },
      ArrowDown: { width: 0, height: step },
      ArrowUp: { width: 0, height: -step },
    }[event.key];
    if (!delta) return;
    event.preventDefault();
    const element = windowRef.current;
    if (!element) return;
    const at = position ?? {
      x: (element.parentElement!.clientWidth - element.offsetWidth) / 2,
      y: (element.parentElement!.clientHeight - element.offsetHeight) / 2,
    };
    setPosition(at);
    setSize((current) => clampSize({ width: current.width + delta.width, height: current.height + delta.height }, at));
  }

  const contentScale = Math.min(size.width / initialSize.width, size.height / initialSize.height);
  const style = {
    width: size.width,
    height: size.height,
    "--popup-content-scale": contentScale,
    ...(position ? { left: position.x, top: position.y } : {}),
  } as CSSProperties;
  return (
    <div ref={windowRef} className={`popup-window${position ? " is-positioned" : ""}${focused ? " is-focused" : ""}${motion !== "idle" ? ` is-${motion}` : ""}${!resizable ? " is-non-resizable" : ""}${previewResizing ? " is-preview-resizing" : ""}${rubberbanding ? " is-rubberbanding" : ""}`}
      role="dialog" aria-labelledby={titleId} data-popup-id={windowId} style={style} hidden={minimized} onAnimationEnd={finishMotion}>
      <div className="popup-window-header" onPointerDown={(event) => beginGesture(event, "move")}>
        <span id={titleId}>{title}</span>
        <div className="popup-window-controls">
          {onMinimize && <button className="window-control minimize-control" type="button"
            aria-label={`Minimize ${title}`} data-label={`Minimize ${title}`} onClick={minimizeWindow} />}
          <button ref={closeRef} className="window-control close-control" type="button"
            aria-label={`Close ${title}`} data-label={`Close ${title}`} onClick={onClose} />
        </div>
      </div>
      <div className={`popup-window-body ${bodyClassName}`}>{children}</div>
      <div className="popup-window-resize" role={resizable ? "button" : undefined} aria-label={`Resize ${title} window`}
        tabIndex={resizable ? 0 : -1} onPointerDown={(event) => beginGesture(event, "resize")}
        onKeyDown={resizeWithKeyboard} />
    </div>
  );
}
