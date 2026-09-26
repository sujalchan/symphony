import { useId } from "react";

type PopupTransparencySettingProps = {
  value: number;
  onChange: (value: number) => void;
  glass: boolean;
};

export default function PopupTransparencySetting({ value, onChange, glass }: PopupTransparencySettingProps) {
  const id = useId();

  return (
    <div className="settings-option popup-transparency-setting">
      <div className="popup-transparency-heading">
        <label htmlFor={id}>Popup window transparency</label>
        <output>{value}%</output>
      </div>
      <input id={id} type="range" min="0" max="100" step="1" value={value}
        onChange={(event) => onChange(Number(event.target.value))} disabled={!glass}
        aria-valuetext={`${value}%`} aria-describedby={!glass ? `${id}-hint` : undefined} />
      {!glass && <span id={`${id}-hint`} className="popup-transparency-hint">Enable Glass surfaces to adjust this.</span>}
    </div>
  );
}
