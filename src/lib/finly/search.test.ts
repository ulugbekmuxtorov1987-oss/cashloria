import { describe, expect, it } from "vitest";
import { highlightParts, normalizeText, searchItems, type Searchable } from "./search";

const items: Searchable[] = [
  { id: "body", title: "Daily choices", summary: "Money habits", category: "planning", body: ["Make a budget"] },
  { id: "title", title: "Budget basics", summary: "Money growing over time", category: "investing", body: [] },
  { id: "tie", title: "Budget basics", summary: "Money growing over time", category: "investing", body: [] },
];

describe("normalizeText", () => {
  it("strips accents, punctuation and extra spaces", () => {
    expect(normalizeText("  Café, $Money%! ")).toBe("cafe money");
  });
});

describe("searchItems", () => {
  it("returns all items in original order for an empty query", () => {
    expect(searchItems(items, "")).toEqual(items.map((item) => ({ item, score: 0 })));
  });

  it("ranks a title match above a body-only match", () => {
    expect(searchItems(items, "budget").map(({ item }) => item.id)).toEqual(["title", "tie", "body"]);
  });

  it("requires every query word to match", () => {
    expect(searchItems(items, "money growing").map(({ item }) => item.id)).toEqual(["title", "tie"]);
    expect(searchItems(items, "money zebra")).toEqual([]);
  });

  it("matches category regardless of case or punctuation", () => {
    expect(searchItems(items, "INVESTING!").map(({ item }) => item.id)).toEqual(["title", "tie"]);
  });

  it("keeps original order for equal scores", () => {
    const hits = searchItems(items, "growing");
    expect(hits.map(({ item }) => item.id)).toEqual(["title", "tie"]);
    expect(hits.map(({ score }) => score)).toEqual([4, 4]);
  });
});

describe("highlightParts", () => {
  it("marks both Budget matches and preserves the original text", () => {
    const text = "Budgeting for a Budget";
    const parts = highlightParts(text, "budget");
    expect(parts.filter((part) => part.match)).toEqual([
      { text: "Budget", match: true },
      { text: "Budget", match: true },
    ]);
    expect(parts.map((part) => part.text).join("")).toBe(text);
  });

  it("handles a parenthesis safely", () => {
    expect(highlightParts("Budget (monthly)", "(")).toEqual([{ text: "Budget (monthly)", match: false }]);
  });

  it("returns plain text for an empty query", () => {
    expect(highlightParts("Budget", "")).toEqual([{ text: "Budget", match: false }]);
  });
});