import { useRef, useState } from "react";
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

export default function Grid() {
  const [view, setView] = useState<View>({ zoom: 100, x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const canvasRef = useRef<HTMLDivElement>(null);
  const activePointer = useRef<{ id: number; x: number; y: number } | null>(null);

  const scale = view.zoom / 100;
  const level = Math.max(0, Math.min(GRID_SPACINGS.length - 1, Math.log2(1 / scale)));
  const lowerLevel = Math.floor(level);
  const blend = level - lowerLevel;
  const fade = blend * blend * (3 - 2 * blend);

  function changeZoom(amount: number) {
    const bounds = canvasRef.current?.getBoundingClientRect();
    if (!bounds) return;

    setView((current) => {
      const zoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, current.zoom + amount));
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

  function stopPanning(event: PointerEvent<HTMLElement>) {
    if (activePointer.current?.id !== event.pointerId) return;
    activePointer.current = null;
    setIsPanning(false);
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  }

  return (
    <div
      ref={canvasRef}
      className={isPanning ? "canvas is-panning" : "canvas"}
      aria-label="Infinite dotted canvas"
      onPointerDown={(event) => {
        if (event.button !== 0 || !event.isPrimary) return;
        activePointer.current = { id: event.pointerId, x: event.clientX, y: event.clientY };
        event.currentTarget.setPointerCapture(event.pointerId);
        setIsPanning(true);
      }}
      onPointerMove={(event) => {
        const pointer = activePointer.current;
        if (pointer?.id !== event.pointerId) return;

        const dx = event.clientX - pointer.x;
        const dy = event.clientY - pointer.y;
        pointer.x = event.clientX;
        pointer.y = event.clientY;
        setView((current) => ({ ...current, x: current.x + dx, y: current.y + dy }));
      }}
      onPointerUp={stopPanning}
      onPointerCancel={stopPanning}
      onLostPointerCapture={(event) => {
        if (activePointer.current?.id === event.pointerId) {
          activePointer.current = null;
          setIsPanning(false);
        }
      }}
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
        <output aria-live="polite" aria-label="Current zoom">{view.zoom}%</output>
        <button type="button" aria-label="Zoom out" disabled={view.zoom === MIN_ZOOM} onClick={() => changeZoom(-ZOOM_STEP)}>−</button>
      </div>
    </div>
  );
}
