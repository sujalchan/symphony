type AppearanceSwitchProps = {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
};

export default function AppearanceSwitch({ label, checked, onChange }: AppearanceSwitchProps) {
  return (
    <label className="settings-option settings-toggle">
      <span>{label}</span>
      <span className="settings-switch-control">
        <input type="checkbox" role="switch" checked={checked}
          onChange={(event) => onChange(event.target.checked)} />
        <span className="settings-switch-track" aria-hidden="true" />
      </span>
    </label>
  );
}
