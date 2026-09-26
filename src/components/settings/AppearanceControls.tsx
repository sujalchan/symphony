import { useState } from "react";
import AppearanceSearch from "./AppearanceSearch";
import { buildAppearanceSections } from "./AppearanceSections";
import { appearanceSearchTerms, matchesAppearanceSection } from "./appearanceMatching";
import AppearanceSubmenu from "./AppearanceSubmenu";
import type { AppearanceSettingsProps } from "./AppearanceSettings";

export default function AppearanceControls(props: AppearanceSettingsProps) {
  const [search, setSearch] = useState("");
  const terms = appearanceSearchTerms(search);
  const searching = terms.length > 0;
  const sections = buildAppearanceSections(props).map((section) => ({
    ...section,
    visible: matchesAppearanceSection(section, terms),
  }));

  return (
    <div className="appearance-settings-body">
      <AppearanceSearch value={search} onChange={setSearch} />
      {sections.map((section) => (
        <AppearanceSubmenu key={section.id} title={section.title} visible={section.visible}
          forceExpanded={searching && section.visible}>
          {section.content}
        </AppearanceSubmenu>
      ))}
      {searching && !sections.some((section) => section.visible) && (
        <p className="appearance-search-empty" role="status">No appearance settings found.</p>
      )}
    </div>
  );
}
