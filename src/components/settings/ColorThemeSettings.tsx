import { useId, useState } from "react";
import { presetColors, presetNames } from "../../theme";
import type { Accent, ColorProfile, PresetAccent } from "../../theme";

export type ColorThemeSettingsProps = {
  accent: Accent;
  onAccentChange: (accent: Accent) => void;
  color: string;
  onColorChange: (color: string) => void;
  savedProfiles: ColorProfile[];
  selectedProfileId: string | null;
  onProfileSelect: (profile: ColorProfile) => void;
  onProfileSave: (name: string) => void;
  onProfileDelete: (id: string) => void;
};

const accents = Object.keys(presetColors) as PresetAccent[];

export default function ColorThemeSettings({ accent, onAccentChange, color, onColorChange, savedProfiles, selectedProfileId, onProfileSelect, onProfileSave, onProfileDelete }: ColorThemeSettingsProps) {
  const [profileName, setProfileName] = useState("");
  const colorId = useId();
  const accentGroupName = useId();

  return (
    <>
      <fieldset className="settings-option accent-options">
        <legend>Preset colors</legend>
        <div className="accent-choices">
          {accents.map((choice) => (
            <label key={choice} className="accent-choice">
              <input type="radio" name={accentGroupName} value={choice} checked={accent === choice} onChange={() => onAccentChange(choice)} />
              <span className="accent-swatch" style={{ background: presetColors[choice] }} aria-hidden="true" />
              <span>{presetNames[choice]}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <div className="settings-option color-picker-option">
        <label htmlFor={colorId}>Custom color</label>
        <div className="color-picker-row">
          <input id={colorId} type="color" value={color} onChange={(event) => onColorChange(event.target.value)} />
          <output htmlFor={colorId}>{color.toUpperCase()}</output>
        </div>
      </div>

      <div className="settings-option profile-option">
        <span>Saved color profiles</span>
        <form className="profile-form" onSubmit={(event) => {
          event.preventDefault();
          onProfileSave(profileName);
        }}>
          <input aria-label="Profile name" placeholder="Profile name" maxLength={32} value={profileName} onChange={(event) => setProfileName(event.target.value)} />
          <button type="submit" disabled={!profileName.trim()}>Save</button>
        </form>
        {savedProfiles.length > 0 && (
          <ul className="profile-list">
            {savedProfiles.map((profile) => (
              <li key={profile.id}>
                <button type="button" className={selectedProfileId === profile.id ? "profile-select is-selected" : "profile-select"}
                  aria-pressed={selectedProfileId === profile.id}
                  onClick={() => { onProfileSelect(profile); setProfileName(profile.name); }}>
                  <span className="accent-swatch" style={{ background: profile.color }} aria-hidden="true" />
                  <span>{profile.name}</span>
                </button>
                <button type="button" className="profile-delete" aria-label={`Delete ${profile.name} profile`} onClick={() => onProfileDelete(profile.id)}>Delete</button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  );
}
