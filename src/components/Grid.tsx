import { useEffect, useRef, useState } from "react";
import type { PointerEvent } from "react";
import "./Grid.css";

const GRID_SPACINGS = [24, 48, 96, 192];
const MIN_ZOOM = 10;
const MAX_ZOOM = 200;
const ZOOM_STEP = 10;

type View = {
  zoom: number;
  x: number;
  y: number;
};

type PointerPosition = { x: number; y: number };

export default function Grid() {
  const [view, setView] = useState<View>({ zoom: 100, x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const canvasRef = useRef<HTMLDivElement>(null);
  const activePointers = useRef(new Map<number, PointerPosition>());
  const pinch = useRef<{ distance: number; x: number; y: number } | null>(null);

  const scale = view.zoom / 100;
  const level = Math.max(0, Math.min(GRID_SPACINGS.length - 1, Math.log2(1 / scale)));
  const lowerLevel = Math.floor(level);
  const blend = level - lowerLevel;
  const fade = blend * blend * (3 - 2 * blend);

  function changeZoom(amount: number) {
    const bounds = canvasRef.current?.getBoundingClientRect();
    if (!bounds) return;

    setView((current) => {
      const zoom = Math.round(Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, current.zoom + amount)));
      if (zoom === current.zoom) return current;

      const ratio = zoom / current.zoom;
      const centerX = bounds.width / 2;
      const centerY = bounds.height / 2;
      return {
        zoom,
        x: centerX - (centerX - current.x) * ratio,
        y: centerY - (centerY - current.y) * ratio,
      };
    });
  }

  function pinchPosition() {
    const [first, second] = [...activePointers.current.values()];
    if (!first || !second) return null;
    return {
      distance: Math.hypot(second.x - first.x, second.y - first.y),
      x: (first.x + second.x) / 2,
      y: (first.y + second.y) / 2,
    };
  }

  function stopPointer(event: PointerEvent<HTMLElement>, releaseCapture = true) {
    if (!activePointers.current.delete(event.pointerId)) return;
    pinch.current = null;
    if (activePointers.current.size === 0) setIsPanning(false);
    if (releaseCapture && event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  }

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    function zoomWithTrackpad(event: WheelEvent) {
      if (!event.ctrlKey || !canvas) return;
      event.preventDefault();
      const bounds = canvas.getBoundingClientRect();
      const x = event.clientX - bounds.left;
      const y = event.clientY - bounds.top;
      const factor = Math.exp(-event.deltaY * 0.005);
      setView((current) => {
        const zoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, current.zoom * factor));
        const ratio = zoom / current.zoom;
        return {
          zoom,
          x: x - (x - current.x) * ratio,
          y: y - (y - current.y) * ratio,
        };
      });
    }

    canvas.addEventListener("wheel", zoomWithTrackpad, { passive: false });
    return () => canvas.removeEventListener("wheel", zoomWithTrackpad);
  }, []);

  return (
    <div
      ref={canvasRef}
      className={isPanning ? "canvas is-panning" : "canvas"}
      aria-label="Infinite dotted canvas"
      onPointerDown={(event) => {
        if (event.pointerType !== "touch" && (event.button !== 0 || !event.isPrimary)) return;
        if (activePointers.current.size >= 2) return;
        activePointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
        if (activePointers.current.size === 2) pinch.current = pinchPosition();
        event.currentTarget.setPointerCapture(event.pointerId);
        setIsPanning(true);
      }}
      onPointerMove={(event) => {
        const pointer = activePointers.current.get(event.pointerId);
        if (!pointer) return;
        const dx = event.clientX - pointer.x;
        const dy = event.clientY - pointer.y;
        pointer.x = event.clientX;
        pointer.y = event.clientY;

        if (activePointers.current.size === 1) {
          setView((current) => ({ ...current, x: current.x + dx, y: current.y + dy }));
          return;
        }

        const previous = pinch.current;
        const next = pinchPosition();
        const bounds = event.currentTarget.getBoundingClientRect();
        if (!next || !previous) return;
        pinch.current = next;
        setView((current) => {
          const factor = previous.distance > 1 ? next.distance / previous.distance : 1;
          const zoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, current.zoom * factor));
          const ratio = zoom / current.zoom;
          const previousX = previous.x - bounds.left;
          const previousY = previous.y - bounds.top;
          return {
            zoom,
            x: next.x - bounds.left - (previousX - current.x) * ratio,
            y: next.y - bounds.top - (previousY - current.y) * ratio,
          };
        });
      }}
      onPointerUp={stopPointer}
      onPointerCancel={stopPointer}
      onLostPointerCapture={(event) => stopPointer(event, false)}
    >
      {GRID_SPACINGS.map((spacing, index) => (
        <div
          key={spacing}
          className="grid-layer"
          style={{
            backgroundSize: `${spacing * scale}px ${spacing * scale}px`,
            backgroundPosition: `${view.x - spacing * scale / 2}px ${view.y - spacing * scale / 2}px`,
            opacity: index === lowerLevel ? 1 - fade : index === lowerLevel + 1 ? fade : 0,
          }}
        />
      ))}

      <div className="zoom-toolbox" role="group" aria-label="Grid zoom controls" onPointerDown={(event) => event.stopPropagation()}>
        <button type="button" aria-label="Zoom in" disabled={view.zoom === MAX_ZOOM} onClick={() => changeZoom(ZOOM_STEP)}>+</button>
        <output aria-live="polite" aria-label="Current zoom">{Math.round(view.zoom)}%</output>
        <button type="button" aria-label="Zoom out" disabled={view.zoom === MIN_ZOOM} onClick={() => changeZoom(-ZOOM_STEP)}>−</button>
      </div>
    </div>
  );
}
