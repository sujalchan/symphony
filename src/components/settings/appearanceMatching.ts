import type { AppearanceSection } from "./AppearanceSections";

export function appearanceSearchTerms(query: string): string[] {
  return query.trim().toLocaleLowerCase().split(/\s+/).filter(Boolean);
}

export function matchesAppearanceSection(section: AppearanceSection, terms: readonly string[]): boolean {
  const text = `${section.title} ${section.searchText}`.toLocaleLowerCase();
  return terms.every((term) => text.includes(term));
}
