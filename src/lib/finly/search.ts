export type Searchable = {
  id: string;
  title: string;
  summary: string;
  category: string;
  body: string[];
};

export type SearchHit<T extends Searchable> = { item: T; score: number };

/** Lowercase, strip accents, collapse everything that is not a letter/digit into single spaces. */
export function normalizeText(value: string): string {
  return value
    .normalize("NFKD")
    .replace(/\p{M}+/gu, "")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim();
}

/**
 * Ranks items for a free-text query. Every query word must appear somewhere (AND);
 * title matches outweigh summary matches, which outweigh body matches.
 * Returns items in original order when the query is empty.
 */
export function searchItems<T extends Searchable>(items: readonly T[], query: string): SearchHit<T>[] {
  const words = normalizeText(query).split(" ").filter(Boolean);
  if (words.length === 0) return items.map((item) => ({ item, score: 0 }));
  const hits: SearchHit<T>[] = [];
  for (const item of items) {
    const title = normalizeText(item.title);
    const summary = normalizeText(item.summary);
    const body = normalizeText(item.body.join(" "));
    const category = normalizeText(item.category);
    let score = 0;
    let matchedAll = true;
    for (const word of words) {
      let wordScore = 0;
      if (title.split(" ").some((t) => t.startsWith(word))) wordScore += 10;
      else if (title.includes(word)) wordScore += 6;
      if (summary.includes(word)) wordScore += 4;
      if (category.includes(word)) wordScore += 3;
      if (body.includes(word)) wordScore += 1;
      if (wordScore === 0) {
        matchedAll = false;
        break;
      }
      score += wordScore;
    }
    if (matchedAll) hits.push({ item, score });
  }
  // Array#sort is stable, so equal scores keep curriculum order.
  return hits.sort((a, b) => b.score - a.score);
}

/** Splits text into plain and matched parts for highlighting, without using HTML. */
export function highlightParts(text: string, query: string): { text: string; match: boolean }[] {
  const words = [...new Set(normalizeText(query).split(" ").filter((w) => w.length > 0))];
  if (words.length === 0) return [{ text, match: false }];
  const escaped = words
    .sort((a, b) => b.length - a.length)
    .map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
  const pattern = new RegExp(`(${escaped.join("|")})`, "giu");
  return text
    .split(pattern)
    .filter((part) => part !== "")
    .map((part) => ({ text: part, match: words.includes(part.toLowerCase()) }));
}