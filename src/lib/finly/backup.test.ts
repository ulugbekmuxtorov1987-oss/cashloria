import { describe, expect, it } from "vitest";
import { BACKUP_KEYS, parseBackup } from "./backup";
import { ALL_LESSONS } from "./curriculum";
import { GOALS } from "./plan";

const [first, second] = ALL_LESSONS;
if (!first || !second) throw new Error("The curriculum must contain at least two lessons for these tests.");
const FIRST_ID: string = first.id;
const SECOND_ID: string = second.id;

const COMPLETED_AT = "2026-10-01T10:00:00.000Z";

function backupWith(overrides: Record<string, unknown> = {}) {
  return {
    app: "finly",
    version: 1,
    exportedAt: "2026-10-20T00:00:00.000Z",
    progress: {
      xp: 120,
      lessons: {
        [FIRST_ID]: { correct: 3, total: 4, xp: 20, completedAt: COMPLETED_AT },
        [SECOND_ID]: { correct: 4, total: 4, xp: 30, completedAt: COMPLETED_AT },
      },
      challenges: [FIRST_ID],
      achievements: ["first-lesson"],
      streak: { count: 3, best: 5, lastDay: "2026-10-19" },
      country: "UZ",
      language: "ru",
    },
    plan: { goal: "debt", experience: "some", weeklyTarget: 3 },
    ...overrides,
  };
}

function mustParse(value: unknown) {
  const result = parseBackup(JSON.stringify(value));
  if (!result.ok) throw new Error(`Expected the backup to be accepted, got: ${result.error}`);
  return result;
}

function mustReject(text: string) {
  const result = parseBackup(text);
  if (result.ok) throw new Error("Expected the backup to be rejected.");
  return result.error;
}

describe("parseBackup: valid backups", () => {
  it("restores progress and plan with exactly the ProgressState shape", () => {
    const result = mustParse(backupWith());
    expect(result.lessonCount).toBe(2);
    expect(result.data.progress).toEqual({
      xp: 120,
      lessons: {
        [FIRST_ID]: { correct: 3, total: 4, xp: 20, completedAt: COMPLETED_AT },
        [SECOND_ID]: { correct: 4, total: 4, xp: 30, completedAt: COMPLETED_AT },
      },
      challenges: [FIRST_ID],
      achievements: ["first-lesson"],
      streak: { count: 3, best: 5, lastDay: "2026-10-19" },
      country: "UZ",
      // Only English is selectable in Settings until translations ship, so imports always restore "en".
      language: "en",
    });
    expect(result.data.plan).toMatchObject({ goal: "debt", experience: "some", weeklyTarget: 3 });
  });

  it("accepts a plan-only backup and clamps the weekly target", () => {
    const result = mustParse({ app: "finly", version: 1, plan: { goal: "save", experience: "new", weeklyTarget: 99 } });
    expect(result.data.progress).toBeNull();
    expect(result.data.plan?.weeklyTarget).toBe(14);
    expect(result.lessonCount).toBe(0);
  });

  it.each(GOALS.map((g) => g.id))("accepts the plan goal %s", (goal) => {
    expect(mustParse(backupWith({ plan: { goal, experience: "confident", weeklyTarget: 2 } })).data.plan?.goal).toBe(goal);
  });
});

describe("parseBackup: rejected files", () => {
  it("rejects text that is not JSON", () => {
    expect(mustReject("{nope")).toBe("This file is not valid JSON.");
  });

  it.each(["[]", "null", "5", '"text"'])("rejects the JSON root %s", (text) => {
    expect(mustReject(text)).toBe("This is not a Cashloria backup file (version 1).");
  });

  it("rejects another app or another version", () => {
    expect(mustReject(JSON.stringify(backupWith({ app: "other" })))).toContain("not a Cashloria backup");
    expect(mustReject(JSON.stringify(backupWith({ version: 2 })))).toContain("not a Cashloria backup");
  });

  it("rejects a damaged progress section", () => {
    expect(mustReject(JSON.stringify(backupWith({ progress: { xp: 1 } })))).toBe("The progress section is damaged.");
    expect(mustReject(JSON.stringify(backupWith({ progress: "text" })))).toBe("The progress section is damaged.");
  });

  it("rejects a damaged plan section", () => {
    expect(mustReject(JSON.stringify(backupWith({ plan: { goal: "nope", experience: "new" } })))).toBe("The plan section is damaged.");
    expect(mustReject(JSON.stringify(backupWith({ plan: { goal: "save", experience: "pro" } })))).toBe("The plan section is damaged.");
  });

  it("rejects a file with neither progress nor plan", () => {
    expect(mustReject(JSON.stringify({ app: "finly", version: 1 }))).toBe("The file has no progress or plan to restore.");
  });
});

describe("parseBackup: sanitising untrusted values", () => {
  it("drops lessons and challenges that are not in the curriculum", () => {
    const base = backupWith();
    const result = mustParse({
      ...base,
      progress: {
        ...base.progress,
        lessons: { ...base.progress.lessons, "no-such-lesson": { correct: 1, total: 1, xp: 5, completedAt: COMPLETED_AT } },
        challenges: [FIRST_ID, "no-such-lesson"],
      },
    });
    expect(Object.keys(result.data.progress?.lessons ?? {}).sort()).toEqual([FIRST_ID, SECOND_ID].sort());
    expect(result.data.progress?.challenges).toEqual([FIRST_ID]);
  });

  it("does not let a __proto__ key pollute objects", () => {
    const text = '{"app":"finly","version":1,"progress":{"xp":1,"lessons":{"__proto__":{"correct":1,"total":1,"xp":1,"completedAt":"2026-01-01"}}}}';
    const result = parseBackup(text);
    expect(result.ok).toBe(true);
    expect(({} as Record<string, unknown>)["correct"]).toBeUndefined();
    expect(result.ok && result.lessonCount).toBe(0);
  });

  it("clamps numbers and replaces unusable values", () => {
    const result = mustParse(
      backupWith({
        progress: {
          xp: -50,
          lessons: { [FIRST_ID]: { correct: 999, total: "9", xp: 1e9, completedAt: "not a date" } },
          streak: { count: 1e9, best: -3, lastDay: "yesterday" },
          country: "ZZ",
        },
      }),
    );
    const lesson = result.data.progress?.lessons[FIRST_ID];
    expect(result.data.progress?.xp).toBe(0);
    expect(lesson?.total).toBe(0);
    expect(lesson?.correct).toBe(0);
    expect(lesson?.xp).toBe(1000);
    expect(Number.isNaN(Date.parse(lesson?.completedAt ?? ""))).toBe(false);
    expect(result.data.progress?.streak).toEqual({ count: 10000, best: 0, lastDay: null });
    expect(result.data.progress?.country).toBe("US");
  });

  it("never records more correct answers than total", () => {
    const result = mustParse(backupWith({ progress: { xp: 0, lessons: { [FIRST_ID]: { correct: 50, total: 4, xp: 0, completedAt: COMPLETED_AT } } } }));
    expect(result.data.progress?.lessons[FIRST_ID]).toMatchObject({ correct: 4, total: 4 });
  });

  it("keeps only short string achievements", () => {
    const result = mustParse(backupWith({ progress: { xp: 0, lessons: {}, achievements: ["x".repeat(200), "ok", 5, null] } }));
    expect(result.data.progress?.achievements).toEqual(["ok"]);
  });
});

describe("BACKUP_KEYS", () => {
  it("lists only Cashloria learning data, never auth or session keys", () => {
    for (const key of Object.values(BACKUP_KEYS)) {
      expect(key.startsWith("finly.")).toBe(true);
      expect(key.toLowerCase()).not.toContain("auth");
      expect(key.toLowerCase()).not.toContain("token");
    }
  });
});
