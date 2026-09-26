import { useId } from "react";

export default function PopupGlideSetting({ value, onChange }: {
  value: number;
  onChange: (value: number) => void;
}) {
  const id = useId();
  return (
    <div className="settings-option popup-glide-setting">
      <div className="popup-glide-heading">
        <label htmlFor={id}>Window glide effect</label>
        <output>{value === 0 ? "Off" : `${value} ms`}</output>
      </div>
      <input id={id} type="range" min="0" max="800" step="20" value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        aria-valuetext={value === 0 ? "Off" : `${value} milliseconds`} />
    </div>
  );
}
