import { useRef, useState } from "react";
import type { PointerEvent } from "react";
import "./Grid.css";

export default function Grid() {
  const [gridOffset, setGridOffset] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const activePointer = useRef<{ id: number; x: number; y: number } | null>(null);

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
        className={isPanning ? "canvas is-panning" : "canvas"}
        aria-label="Infinite dotted canvas"
        style={{ backgroundPosition: `${gridOffset.x}px ${gridOffset.y}px` }}
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
          setGridOffset(({ x, y }) => ({ x: (x + dx) % 24, y: (y + dy) % 24 }));
        }}
        onPointerUp={stopPanning}
        onPointerCancel={stopPanning}
        onLostPointerCapture={(event) => {
          if (activePointer.current?.id === event.pointerId) {
            activePointer.current = null;
            setIsPanning(false);
          }
        }}
      />
  );
}
