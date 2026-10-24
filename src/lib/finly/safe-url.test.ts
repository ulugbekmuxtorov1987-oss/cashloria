import { describe, expect, it } from "vitest";
import { safeEmail, safeHttpUrl } from "./safe-url";

describe("safeHttpUrl", () => {
  it.each(["https://example.com", "http://example.com"])("accepts %s", (value) => {
    expect(safeHttpUrl(value)).toBe(value);
  });
  it("trims whitespace", () => {
    expect(safeHttpUrl("  https://example.com \n")).toBe("https://example.com");
  });
  it.each([
    "javascript:alert(1)", "JAVASCRIPT:alert(1)", " javascript:alert(1)",
    "data:text/html,<script>alert(1)</script>", "vbscript:msgbox(1)",
    "//evil.com", "example.com", "garbage", "", "   ", null, undefined,
  ])("rejects %s", (value) => {
    expect(safeHttpUrl(value)).toBeNull();
  });
});

describe("safeEmail", () => {
  it.each(["person@example.com", "first.last+tag@example.co.uk"])("accepts %s", (value) => {
    expect(safeEmail(value)).toBe(value);
  });
  it("trims whitespace", () => {
    expect(safeEmail("  person@example.com \n")).toBe("person@example.com");
  });
  it("accepts the 254-character boundary", () => {
    const value = `${"a".repeat(242)}@example.com`;
    expect(value.length).toBe(254);
    expect(safeEmail(value)).toBe(value);
  });
  it.each([
    "", "   ", null, undefined, "example.com", "person@example", "@example.com",
    "person@@example.com", "a b@example.com", "<person>@example.com", '"person"@example.com',
    `${"a".repeat(243)}@example.com`,
  ])("rejects %s", (value) => {
    expect(safeEmail(value)).toBeNull();
  });
});