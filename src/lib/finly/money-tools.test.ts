import { describe, expect, it } from "vitest";
import { cashflowMonth, emergencyFund, payoffPlan } from "./money-tools";

const debts = [
  { name: "Card", balance: 3000, apr: 24, minPayment: 90 },
  { name: "Loan", balance: 1000, apr: 6, minPayment: 50 },
];

describe("debt payoff", () => {
  it("rejects a budget below the sum of minimums", () => {
    const r = payoffPlan(debts, 100, "avalanche");
    expect(r).toEqual({ ok: false, reason: "budget-below-minimums", minimumsTotal: 140 });
  });
  it("avalanche pays less interest than snowball here", () => {
    const a = payoffPlan(debts, 400, "avalanche");
    const s = payoffPlan(debts, 400, "snowball");
    if (!a.ok || !s.ok) throw new Error("expected payable");
    expect(a.totalInterest).toBeLessThan(s.totalInterest);
    expect(s.order[0]).toBe("Loan");
    expect(a.order[0]).toBe("Card");
  });
  it("zero-interest debt takes balance / budget months", () => {
    const r = payoffPlan([{ name: "A", balance: 1000, apr: 0, minPayment: 10 }], 100, "snowball");
    expect(r).toMatchObject({ ok: true, months: 10, totalInterest: 0 });
  });
});

describe("cash flow", () => {
  it("flags the first day the balance goes negative", () => {
    const r = cashflowMonth(200, [
      { label: "Rent", day: 1, amount: 500, kind: "bill" },
      { label: "Pay", day: 15, amount: 1000, kind: "income" },
    ]);
    expect(r.firstNegativeDay).toBe(1);
    expect(r.lowest).toBe(-300);
    expect(r.endBalance).toBe(700);
  });
});

describe("emergency fund", () => {
  it("computes target and months to reach it", () => {
    expect(emergencyFund(2000, 3, 1000, 500)).toMatchObject({ target: 6000, gap: 5000, months: 10 });
    expect(emergencyFund(2000, 3, 1000, 0).months).toBeNull();
  });
});
