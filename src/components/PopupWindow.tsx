import { useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import type { AnimationEvent, CSSProperties, KeyboardEvent, PointerEvent, ReactNode } from "react";
import "./Navbar.css";
import "./PopupWindow.css";

type Position = { x: number; y: number };
type Size = { width: number; height: number };
type Geometry = { position: Position; size: Size };
type SnapTarget = Geometry & { id: string };
type ResizeDirection = "nw" | "ne" | "sw" | "se";
type Gesture = {
  kind: "move" | "resize";
  pointerId: number;
  clientX: number;
  clientY: number;
  position: Position;
  size: Size;
  direction: ResizeDirection;
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
  popupGlide: number;
};

const DEFAULT_MIN_SIZE = { width: 280, height: 220 };
const POPUP_GAP = 12;
const NAVBAR_HEIGHT = 40;
const POPUP_TOP = NAVBAR_HEIGHT + POPUP_GAP;

export default function PopupWindow({ title, children, onClose, onMinimizeStart, onMinimize, minimized = false, windowId, bodyClassName = "", uiScale, initialSize = { width: 360, height: 420 }, minSize = DEFAULT_MIN_SIZE, resizable = true, popupGlide }: PopupWindowProps) {
  const titleId = useId();
  const windowRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const gesture = useRef<Gesture | null>(null);
  const stopListening = useRef<(() => void) | null>(null);
  const minimizePending = useRef(false);
  const rubberbandTimer = useRef<number | null>(null);
  const geometryAnimationTimer = useRef<number | null>(null);
  const dragSettleTimer = useRef<number | null>(null);
  const wasMinimized = useRef(minimized);
  const maximizedRef = useRef(false);
  const restoredGeometry = useRef<Geometry | null>(null);
  const snapTargetRef = useRef<SnapTarget | null>(null);
  const [position, setPosition] = useState<Position | null>(null);
  const [size, setSize] = useState<Size>(initialSize);
  const [focused, setFocused] = useState(true);
  const [previewResizing, setPreviewResizing] = useState(false);
  const [rubberbanding, setRubberbanding] = useState(false);
  const [maximized, setMaximized] = useState(false);
  const [geometryAnimating, setGeometryAnimating] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [snapPreview, setSnapPreview] = useState<SnapTarget | null>(null);
  const [motion, setMotion] = useState<"idle" | "minimizing" | "restoring">("idle");
  const scale = uiScale / 100;

  function limits() {
    const root = windowRef.current?.parentElement;
    return {
      width: Math.max(0, (root?.clientWidth ?? initialSize.width) - POPUP_GAP * 2),
      height: Math.max(0, (root?.clientHeight ?? initialSize.height) - POPUP_TOP - POPUP_GAP),
    };
  }

  function clampSize(next: Size, at: Position): Size {
    const available = limits();
    const maxWidth = Math.max(0, available.width + POPUP_GAP - at.x);
    const maxHeight = Math.max(0, available.height + POPUP_TOP - at.y);
    return {
      width: Math.min(Math.max(Math.min(minSize.width, maxWidth), next.width), maxWidth),
      height: Math.min(Math.max(Math.min(minSize.height, maxHeight), next.height), maxHeight),
    };
  }

  function clampPosition(next: Position, currentSize: Size): Position {
    const available = limits();
    return {
      x: Math.max(POPUP_GAP, Math.min(next.x, Math.max(POPUP_GAP, available.width + POPUP_GAP - currentSize.width))),
      y: Math.max(POPUP_TOP, Math.min(next.y, Math.max(POPUP_TOP, available.height + POPUP_TOP - currentSize.height))),
    };
  }

  function snapTargetAt(clientX: number, clientY: number): SnapTarget | null {
    if (!resizable) return null;
    const root = windowRef.current?.parentElement;
    if (!root) return null;
    const bounds = root.getBoundingClientRect();
    const x = (clientX - bounds.left) / scale;
    const y = (clientY - bounds.top) / scale;
    const edge = 52;
    const side = x <= edge ? "left" : x >= root.clientWidth - edge ? "right" : null;
    if (!side) return null;

    const available = limits();
    const halfWidth = available.width / 2;
    const halfHeight = available.height / 2;
    const horizontal = side === "left" ? POPUP_GAP : POPUP_GAP + halfWidth;
    if (y <= root.clientHeight * 0.28) {
      return { id: `top-${side}`, position: { x: horizontal, y: POPUP_TOP }, size: { width: halfWidth, height: halfHeight } };
    }
    if (y >= root.clientHeight * 0.65) {
      return { id: `bottom-${side}`, position: { x: horizontal, y: POPUP_TOP + halfHeight }, size: { width: halfWidth, height: halfHeight } };
    }
    return { id: side, position: { x: horizontal, y: POPUP_TOP }, size: { width: halfWidth, height: available.height } };
  }

  function updateSnapPreview(target: SnapTarget | null) {
    snapTargetRef.current = target;
    setSnapPreview((current) => current?.id === target?.id ? current : target);
  }

  function toggleMaximized() {
    if (!resizable) return;
    const element = windowRef.current;
    const root = element?.parentElement;
    if (!element || !root) return;

    if (maximizedRef.current) {
      const restored = restoredGeometry.current;
      if (restored) {
        animateGeometry(() => {
          setPosition(clampPosition(restored.position, restored.size));
          setSize(restored.size);
        });
      }
      maximizedRef.current = false;
      setMaximized(false);
      return;
    }

    const currentSize = { width: element.offsetWidth, height: element.offsetHeight };
    const rootBounds = root.getBoundingClientRect();
    const elementBounds = element.getBoundingClientRect();
    restoredGeometry.current = {
      position: position ?? {
        x: (elementBounds.left - rootBounds.left) / scale,
        y: (elementBounds.top - rootBounds.top) / scale,
      },
      size: currentSize,
    };
    const expand = () => {
      maximizedRef.current = true;
      animateGeometry(() => {
        setPosition({ x: POPUP_GAP, y: POPUP_TOP });
        setSize(limits());
        setMaximized(true);
      });
    };

    if (position === null) {
      setPosition(restoredGeometry.current.position);
      requestAnimationFrame(() => requestAnimationFrame(expand));
    } else {
      expand();
    }
  }

  function animateGeometry(update: () => void) {
    if (geometryAnimationTimer.current !== null) window.clearTimeout(geometryAnimationTimer.current);
    setGeometryAnimating(true);
    requestAnimationFrame(update);
    geometryAnimationTimer.current = window.setTimeout(() => {
      geometryAnimationTimer.current = null;
      setGeometryAnimating(false);
    }, 320);
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
      if (geometryAnimationTimer.current !== null) window.clearTimeout(geometryAnimationTimer.current);
      if (dragSettleTimer.current !== null) window.clearTimeout(dragSettleTimer.current);
    };
  }, []);

  useLayoutEffect(() => {
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
      if (maximizedRef.current) {
        setPosition({ x: POPUP_GAP, y: POPUP_TOP });
        setSize(available);
        return;
      }
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

  function beginGesture(event: PointerEvent<HTMLElement>, kind: Gesture["kind"], direction: ResizeDirection = "se") {
    if (dragSettleTimer.current !== null || event.button !== 0 || !event.isPrimary || (kind === "move" && event.target instanceof Element && event.target.closest("button"))) return;
    if (maximizedRef.current && kind !== "move") return;
    const element = windowRef.current;
    const root = element?.parentElement;
    if (!element || !root) return;
    const bounds = element.getBoundingClientRect();
    const rootBounds = root.getBoundingClientRect();
    let start = {
      x: (bounds.left - rootBounds.left) / scale,
      y: (bounds.top - rootBounds.top) / scale,
    };
    let currentSize = { width: element.offsetWidth, height: element.offsetHeight };

    setPreviewResizing(false);
    setRubberbanding(false);
    if (rubberbandTimer.current !== null) {
      window.clearTimeout(rubberbandTimer.current);
      rubberbandTimer.current = null;
    }
    gesture.current = {
      kind, pointerId: event.pointerId, clientX: event.clientX, clientY: event.clientY,
      position: start, size: currentSize, direction,
    };
    setPosition(start);
    setSize(currentSize);
    if (kind === "move") {
      const wasCentered = position === null;
      if (wasCentered) element.style.transition = "none";
      element.style.left = `${start.x}px`;
      element.style.top = `${start.y}px`;
      element.style.willChange = "transform";
      element.style.transform = "translate3d(0, 0, 0)";
      if (wasCentered) {
        void element.offsetWidth;
        element.style.transition = "";
      }
      setDragging(true);
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
        if (maximizedRef.current) {
          if (Math.abs(pointer.clientX - current.clientX) <= 2 && Math.abs(pointer.clientY - current.clientY) <= 2) return;
          const restored = restoredGeometry.current;
          const available = limits();
          const restoredSize = {
            width: Math.min(restored?.size.width ?? initialSize.width, available.width),
            height: Math.min(restored?.size.height ?? initialSize.height, available.height),
          };
          const pointerX = (pointer.clientX - rootBounds.left) / scale;
          const pointerY = (pointer.clientY - rootBounds.top) / scale;
          const horizontalAnchor = Math.max(0, Math.min(1, (pointer.clientX - bounds.left) / bounds.width));
          const restoredPosition = clampPosition({
            x: pointerX - restoredSize.width * horizontalAnchor,
            y: pointerY - 20,
          }, restoredSize);
          maximizedRef.current = false;
          setMaximized(false);
          setGeometryAnimating(false);
          if (geometryAnimationTimer.current !== null) {
            window.clearTimeout(geometryAnimationTimer.current);
            geometryAnimationTimer.current = null;
          }
          element.style.width = `${restoredSize.width}px`;
          element.style.height = `${restoredSize.height}px`;
          element.style.left = `${restoredPosition.x}px`;
          element.style.top = `${restoredPosition.y}px`;
          element.style.transform = "translate3d(0, 0, 0)";
          setPosition(restoredPosition);
          setSize(restoredSize);
          current.position = restoredPosition;
          current.size = restoredSize;
          current.clientX = pointer.clientX;
          current.clientY = pointer.clientY;
          if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
            element.animate([
              { left: `${start.x}px`, top: `${start.y}px`, width: `${currentSize.width}px`, height: `${currentSize.height}px` },
              { left: `${restoredPosition.x}px`, top: `${restoredPosition.y}px`, width: `${restoredSize.width}px`, height: `${restoredSize.height}px` },
            ], { duration: 280, easing: "cubic-bezier(0.2, 0.8, 0.2, 1)" });
          }
          return;
        }
        const next = draggedPosition(pointer, current);
        element.style.transform = `translate3d(${next.x - current.position.x}px, ${next.y - current.position.y}px, 0)`;
        updateSnapPreview(snapTargetAt(pointer.clientX, pointer.clientY));
      } else {
        const dx = (pointer.clientX - current.clientX) / scale;
        const dy = (pointer.clientY - current.clientY) / scale;
        const rootWidth = root.clientWidth;
        const rootHeight = root.clientHeight;
        const right = current.position.x + current.size.width;
        const bottom = current.position.y + current.size.height;
        const nextPosition = { ...current.position };
        const nextSize = { ...current.size };

        if (current.direction.includes("w")) {
          const minimumWidth = Math.min(minSize.width, right - POPUP_GAP);
          nextPosition.x = Math.max(POPUP_GAP, Math.min(current.position.x + dx, right - minimumWidth));
          nextSize.width = right - nextPosition.x;
        } else {
          nextSize.width = Math.max(Math.min(minSize.width, rootWidth - POPUP_GAP - current.position.x),
            Math.min(current.size.width + dx, rootWidth - POPUP_GAP - current.position.x));
        }

        if (current.direction.includes("n")) {
          const minimumHeight = Math.min(minSize.height, bottom - POPUP_TOP);
          nextPosition.y = Math.max(POPUP_TOP, Math.min(current.position.y + dy, bottom - minimumHeight));
          nextSize.height = bottom - nextPosition.y;
        } else {
          nextSize.height = Math.max(Math.min(minSize.height, rootHeight - POPUP_GAP - current.position.y),
            Math.min(current.size.height + dy, rootHeight - POPUP_GAP - current.position.y));
        }

        setPosition(nextPosition);
        setSize(nextSize);
        if (!resizable) setPreviewResizing(true);
      }
    };
    const stop = (pointer: globalThis.PointerEvent) => {
      const current = gesture.current;
      if (current?.pointerId !== pointer.pointerId) return;
      gesture.current = null;
      stopListening.current?.();
      if (current.kind === "move") {
        const snap = snapTargetRef.current;
        const moved = Math.abs(pointer.clientX - current.clientX) > 2 || Math.abs(pointer.clientY - current.clientY) > 2;
        updateSnapPreview(null);
        if (!moved) {
          element.style.transform = "";
          element.style.willChange = "";
          setPosition(current.position);
          setDragging(false);
        } else if (snap) {
          const currentBounds = element.getBoundingClientRect();
          const rootBounds = root.getBoundingClientRect();
          const from = {
            position: {
              x: (currentBounds.left - rootBounds.left) / scale,
              y: (currentBounds.top - rootBounds.top) / scale,
            },
            size: { width: currentBounds.width / scale, height: currentBounds.height / scale },
          };
          element.style.transform = "";
          element.style.willChange = "";
          element.style.left = `${snap.position.x}px`;
          element.style.top = `${snap.position.y}px`;
          element.style.width = `${snap.size.width}px`;
          element.style.height = `${snap.size.height}px`;
          setPosition(snap.position);
          setSize(snap.size);
          setDragging(false);
          if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
            element.animate([
              { left: `${from.position.x}px`, top: `${from.position.y}px`, width: `${from.size.width}px`, height: `${from.size.height}px` },
              { left: `${snap.position.x}px`, top: `${snap.position.y}px`, width: `${snap.size.width}px`, height: `${snap.size.height}px` },
            ], { duration: 300, easing: "cubic-bezier(0.2, 0.8, 0.2, 1)" });
          }
        } else {
          const next = draggedPosition(pointer, current);
          element.style.transform = `translate3d(${next.x - current.position.x}px, ${next.y - current.position.y}px, 0)`;
          const settleDelay = window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : popupGlide + 10;
          dragSettleTimer.current = window.setTimeout(() => {
            dragSettleTimer.current = null;
            element.style.left = `${next.x}px`;
            element.style.top = `${next.y}px`;
            element.style.transform = "";
            element.style.willChange = "";
            setPosition(next);
            setDragging(false);
          }, settleDelay);
        }
      }
      if (!resizable && current.kind === "resize") {
        setPreviewResizing(false);
        if (Math.abs(pointer.clientX - current.clientX) > 1 || Math.abs(pointer.clientY - current.clientY) > 1) {
          setRubberbanding(true);
          setPosition(current.position);
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
    "--popup-glide-duration": `${popupGlide}ms`,
    ...(position ? { left: position.x, top: position.y } : {}),
  } as CSSProperties;
  return (
    <>
    {snapPreview && <div className="popup-snap-preview" aria-hidden="true" style={{
      left: snapPreview.position.x,
      top: snapPreview.position.y,
      width: snapPreview.size.width,
      height: snapPreview.size.height,
    }} />}
    <div ref={windowRef} className={`popup-window${position ? " is-positioned" : ""}${focused ? " is-focused" : ""}${motion !== "idle" ? ` is-${motion}` : ""}${!resizable ? " is-non-resizable" : ""}${maximized ? " is-maximized" : ""}${geometryAnimating ? " is-geometry-animating" : ""}${dragging ? " is-dragging" : ""}${previewResizing ? " is-preview-resizing" : ""}${rubberbanding ? " is-rubberbanding" : ""}`}
      role="dialog" aria-labelledby={titleId} data-popup-id={windowId} style={style} hidden={minimized} onAnimationEnd={finishMotion}>
      <div className="popup-window-header" onPointerDown={(event) => beginGesture(event, "move")}
        onDoubleClick={(event) => {
          if (!resizable || (event.target instanceof Element && event.target.closest("button"))) return;
          toggleMaximized();
        }}>
        <span id={titleId}>{title}</span>
        <div className="popup-window-controls">
          <button className="window-control fullscreen-control" type="button" disabled={!resizable}
            aria-label={`${maximized ? "Restore" : "Expand"} ${title}`} data-label={`${maximized ? "Restore" : "Expand"} ${title}`}
            aria-pressed={maximized} onClick={toggleMaximized} />
          {onMinimize && <button className="window-control minimize-control" type="button"
            aria-label={`Minimize ${title}`} data-label={`Minimize ${title}`} onClick={minimizeWindow} />}
          <button ref={closeRef} className="window-control close-control" type="button"
            aria-label={`Close ${title}`} data-label={`Close ${title}`} onClick={onClose} />
        </div>
      </div>
      <div className={`popup-window-body ${bodyClassName}`}>{children}</div>
      {(["nw", "ne", "sw", "se"] as const).map((direction) => <div key={direction}
        className={`popup-window-resize is-${direction}`} role={resizable ? "button" : undefined}
        aria-label={`Resize ${title} window from ${direction}`} tabIndex={resizable ? 0 : -1}
        onPointerDown={(event) => beginGesture(event, "resize", direction)} onKeyDown={resizeWithKeyboard} />)}
    </div>
    </>
  );
}
