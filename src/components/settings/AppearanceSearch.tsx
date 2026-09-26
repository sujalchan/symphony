export default function AppearanceSearch({ value, onChange }: {
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="appearance-search-field">
      <svg viewBox="0 0 20 20" aria-hidden="true" focusable="false">
        <circle cx="8.5" cy="8.5" r="5.5" fill="none" stroke="currentColor" strokeWidth="1.8" />
        <path d="m13 13 4 4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
      <input className="appearance-search" type="search" aria-label="Search appearance settings"
        placeholder="Search appearance settings" value={value} onChange={(event) => onChange(event.target.value)} />
    </div>
  );
}
