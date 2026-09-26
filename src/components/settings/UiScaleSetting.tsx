import { useEffect, useId, useState } from "react";

export type UiScaleSettingProps = {
  uiScale: number;
  onUiScaleChange: (scale: number) => void;
};

const scaleWarning = "This scaling value can make text appear blurry or hard to read";

export default function UiScaleSetting({ uiScale, onUiScaleChange }: UiScaleSettingProps) {
  const [scaleInput, setScaleInput] = useState(String(uiScale));
  const inputId = useId();

  useEffect(() => setScaleInput(String(uiScale)), [uiScale]);

  function commitScale() {
    const value = Number(scaleInput);
    if (scaleInput.trim() === "" || !Number.isFinite(value)) {
      setScaleInput(String(uiScale));
      return;
    }
    const scale = Math.max(50, Math.min(150, Math.round(value)));
    onUiScaleChange(scale);
    setScaleInput(String(scale));
  }

  return (
    <div className="settings-option ui-scale-option">
      <label htmlFor={inputId}>UI scale</label>
      <div className="ui-scale-control">
        <input id={inputId} type="number" min={50} max={150} step={1} inputMode="numeric"
          value={scaleInput}
          onChange={(event) => {
            const next = event.target.value;
            setScaleInput(next);
            if (/^\d+$/.test(next)) {
              const scale = Number(next);
              if (scale >= 50 && scale <= 150) onUiScaleChange(scale);
            }
          }}
          onBlur={commitScale}
          onKeyDown={(event) => { if (event.key === "Enter") event.currentTarget.blur(); }} />
        <span aria-hidden="true">%</span>
        {uiScale < 100 && (
          <span className="scale-warning" role="img" aria-label={scaleWarning} data-label={scaleWarning} tabIndex={0}>
            <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
              <path d="M12 3 1.8 20.5h20.4L12 3Z" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
              <path d="M12 9v5.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              <circle cx="12" cy="17.5" r="1" fill="currentColor" />
            </svg>
          </span>
        )}
      </div>
    </div>
  );
}
