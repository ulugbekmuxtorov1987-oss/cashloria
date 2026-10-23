import { describe, expect, it } from "vitest";
import { cashflowMonth, emergencyFund, monthAfter, payoffPlan, type Debt, type FlowItem } from "./money-tools";

const bill = (label: string, day: number, amount: number): FlowItem => ({ label, day, amount, kind: "bill" });
const income = (label: string, day: number, amount: number): FlowItem => ({ label, day, amount, kind: "income" });

/** Independent, deliberately simple month-by-month schedule for ONE debt paid with a fixed payment. */
function singleDebtReference(balance: number, apr: number, payment: number) {
  const monthlyRate = apr / 1200;
  let left = balance;
  let paid = 0;
  let months = 0;
  while (left > 0.005) {
    left *= 1 + monthlyRate;
    const pay = Math.min(payment, left);
    left -= pay;
    paid += pay;
    months++;
  }
  return { months, interest: paid - balance };
}

describe("debt payoff accuracy", () => {
  for (const { balance, apr, payment } of [
    { balance: 3000, apr: 24, payment: 150 },
    { balance: 12000, apr: 7, payment: 250 },
    { balance: 800, apr: 29.9, payment: 60 },
  ]) {
    it(`matches an independent schedule for a single debt (${balance} at ${apr}% APR, paying ${payment})`, () => {
      const debt: Debt = { name: "Only", balance, apr, minPayment: payment };
      const result = payoffPlan([debt], payment, "avalanche");
      const reference = singleDebtReference(balance, apr, payment);
      if (!result.ok) throw new Error("expected a payable plan");
      expect(result.months).toBe(reference.months);
      expect(result.totalInterest).toBeCloseTo(reference.interest, 6);
    });
  }

  it("matches the closed-form number of payments for a loan", () => {
    const rate = 0.24 / 12;
    const closedForm = Math.ceil(-Math.log(1 - (rate * 3000) / 150) / Math.log(1 + rate) - 1e-9);
    expect(closedForm).toBe(26);
    expect(payoffPlan([{ name: "Card", balance: 3000, apr: 24, minPayment: 150 }], 150, "snowball")).toMatchObject({ ok: true, months: 26 });
  });

  it("never pays off when the payment does not cover the monthly interest", () => {
    const result = payoffPlan([{ name: "Card", balance: 10000, apr: 30, minPayment: 100 }], 100, "avalanche");
    expect(result).toEqual({ ok: false, reason: "never-paid-off", minimumsTotal: 100 });
  });

  it("lists every debt in the payoff order even when two debts share a name", () => {
    const result = payoffPlan(
      [
        { name: "Card", balance: 500, apr: 20, minPayment: 50 },
        { name: "Card", balance: 900, apr: 10, minPayment: 50 },
      ],
      300,
      "avalanche",
    );
    if (!result.ok) throw new Error("expected a payable plan");
    expect(result.order).toEqual(["Card", "Card"]);
  });

  it("avalanche never costs more interest than snowball on a typical set of debts", () => {
    const debts: Debt[] = [
      { name: "Card", balance: 3000, apr: 24, minPayment: 90 },
      { name: "Loan", balance: 1000, apr: 6, minPayment: 50 },
      { name: "Store", balance: 1500, apr: 18, minPayment: 40 },
    ];
    const avalanche = payoffPlan(debts, 500, "avalanche");
    const snowball = payoffPlan(debts, 500, "snowball");
    if (!avalanche.ok || !snowball.ok) throw new Error("expected payable plans");
    expect(avalanche.totalInterest).toBeLessThanOrEqual(snowball.totalInterest);
  });
});

describe("cash flow accuracy", () => {
  it("does not report a balance of exactly 0.00 as negative", () => {
    const result = cashflowMonth(0.3, [bill("a", 1, 0.1), bill("b", 2, 0.1), bill("c", 3, 0.1)]);
    expect(result.firstNegativeDay).toBeNull();
    expect(result.lowest).toBe(0);
    expect(result.endBalance).toBe(0);
  });

  it("gives no false warning when bills use up the balance to the cent", () => {
    const result = cashflowMonth(797.24, [bill("a", 1, 535.6), bill("b", 2, 80.54), bill("c", 3, 50.63), bill("d", 4, 75.02), bill("e", 5, 55.45)]);
    expect(result.firstNegativeDay).toBeNull();
    expect(result.endBalance).toBe(0);
  });

  it("warns on the first day the balance really goes below zero", () => {
    const result = cashflowMonth(100, [bill("a", 3, 60), bill("b", 4, 60)]);
    expect(result).toMatchObject({ firstNegativeDay: 4, lowest: -20, lowestDay: 4, endBalance: -20 });
  });

  it("counts same-day income before bills", () => {
    const result = cashflowMonth(0, [bill("Rent", 5, 100), income("Pay", 5, 100)]);
    expect(result.firstNegativeDay).toBeNull();
    expect(result.endBalance).toBe(0);
  });

  it("keeps items of the same kind on the same day in the order they were entered", () => {
    const result = cashflowMonth(1000, [income("a", 5, 10), income("b", 5, 10), bill("c", 5, 10), bill("d", 5, 10)]);
    expect(result.rows.map((r) => r.label)).toEqual(["a", "b", "c", "d"]);
  });

  it("reports the balance at the end of each block of days", () => {
    const result = cashflowMonth(1000, [bill("a", 3, 100), income("b", 10, 200)]);
    expect(result.periods.map((p) => p.end)).toEqual([900, 1100, 1100, 1100]);
  });
});

describe("emergency fund accuracy", () => {
  it("does not add a month when the gap is an exact multiple of the deposit (cents)", () => {
    expect(emergencyFund(500.1, 3, 0.3, 500)).toMatchObject({ gap: 1500, months: 3 });
    expect(emergencyFund(2575.03, 5, 2771.99, 841.93)).toMatchObject({ months: 12 });
  });

  it("still rounds up when the gap is not a multiple of the deposit", () => {
    expect(emergencyFund(1000, 1, 0, 333.33).months).toBe(4);
  });

  it("needs no time once the target is reached, and has no timeline without a deposit", () => {
    expect(emergencyFund(1000, 3, 3000, 100)).toMatchObject({ gap: 0, months: 0 });
    expect(emergencyFund(1000, 3, 100, 0).months).toBeNull();
  });
});

describe("monthAfter", () => {
  const ym = (d: Date) => [d.getFullYear(), d.getMonth()];

  it("does not skip a month when today is the 30th or 31st", () => {
    expect(ym(monthAfter(new Date(2026, 9, 31), 4))).toEqual([2027, 1]);
    expect(ym(monthAfter(new Date(2026, 9, 30), 4))).toEqual([2027, 1]);
    expect(ym(monthAfter(new Date(2027, 0, 31), 1))).toEqual([2027, 1]);
  });

  it("handles zero months and year boundaries", () => {
    expect(ym(monthAfter(new Date(2026, 9, 23), 0))).toEqual([2026, 9]);
    expect(ym(monthAfter(new Date(2026, 10, 15), 14))).toEqual([2028, 0]);
  });
});
