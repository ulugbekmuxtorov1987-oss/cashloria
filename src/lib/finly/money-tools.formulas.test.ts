import { describe, expect, it } from "vitest";
import {
  budgetSplit,
  compareLoans,
  compoundGrowth,
  hourlyToYearly,
  inflationAdjusted,
  loanPayment,
  loanSummary,
  savingsGoal,
  singleDebtPayoff,
  type BudgetCategory,
} from "./money-tools";

describe("savingsGoal", () => {
  it("matches the closed-form month count with interest", () => {
    for (const c of [
      { goal: 5000, start: 500, monthly: 250, rate: 3 },
      { goal: 20000, start: 1000, monthly: 300, rate: 5 },
      { goal: 1000000, start: 0, monthly: 1500, rate: 7 },
    ]) {
      const r = c.rate / 1200;
      const expected = Math.ceil(Math.log((c.goal * r + c.monthly) / (c.start * r + c.monthly)) / Math.log(1 + r));
      const result = savingsGoal(c.goal, c.start, c.monthly, c.rate);
      expect(result.months).toBe(expected);
      expect(result.reached).toBe(true);
    }
  });

  it("counts exact deposits when the rate is zero", () => {
    expect(savingsGoal(5000, 500, 250, 0)).toMatchObject({ months: 18, reached: true });
    expect(savingsGoal(1, 0, 0.1, 0)).toMatchObject({ months: 10, reached: true });
  });

  it("handles already-reached, unreachable and capped goals", () => {
    expect(savingsGoal(500, 500, 0, 0)).toMatchObject({ months: 0, reached: true });
    expect(savingsGoal(1000, 100, 0, 0)).toMatchObject({ months: 0, reached: false });
    expect(savingsGoal(1e9, 0, 1, 0).reached).toBe(false);
  });

  it("reports contributions and interest consistently", () => {
    const result = savingsGoal(5000, 500, 250, 3);
    expect(result.contributed).toBe(500 + 250 * result.months);
    expect(result.interest).toBeGreaterThan(0);
  });
});

describe("loanPayment", () => {
  it("matches a known payment", () => {
    expect(loanPayment(15000, 9, 5)).toBeCloseTo(311.38, 2);
  });

  it("amortises to zero over the term", () => {
    for (const c of [
      { amount: 15000, apr: 9, years: 5 },
      { amount: 250000, apr: 6.5, years: 30 },
      { amount: 3000, apr: 24, years: 2 },
    ]) {
      const payment = loanPayment(c.amount, c.apr, c.years);
      let left = c.amount;
      for (let i = 0; i < Math.round(c.years * 12); i++) {
        left = left * (1 + c.apr / 1200) - payment;
      }
      expect(Math.abs(left)).toBeLessThan(1e-6);
    }
  });

  it("handles zero interest and rejects zero-length terms", () => {
    expect(loanPayment(1200, 0, 1)).toBe(100);
    expect(loanPayment(1000, 5, 0)).toBeNaN();
    expect(loanPayment(1000, 5, 0.04)).toBeNaN();
  });
});

describe("loanSummary and compareLoans", () => {
  it("summarises a loan with fees", () => {
    const s = loanSummary(15000, { apr: 7, years: 7, fee: 300 });
    expect(s.months).toBe(84);
    expect(s.total).toBeCloseTo(s.monthly * 84 + 300, 6);
    expect(s.cost).toBeCloseTo(s.total - 15000, 6);
  });

  it("picks the cheaper option either way round", () => {
    const a = { apr: 9, years: 5, fee: 0 };
    const b = { apr: 7, years: 7, fee: 300 };
    const forward = compareLoans(15000, a, b);
    expect(forward.cheaper).toBe("A");
    expect(compareLoans(15000, b, a).cheaper).toBe("B");
    expect(forward.difference).toBeCloseTo(Math.abs(forward.a.cost - forward.b.cost), 6);
  });

  it("reports a tie for equal or uncomputable options", () => {
    const a = { apr: 9, years: 5, fee: 0 };
    expect(compareLoans(15000, a, { ...a }).cheaper).toBe("same");
    expect(compareLoans(15000, a, { apr: 9, years: 0, fee: 0 }).cheaper).toBe("same");
  });
});

describe("inflationAdjusted", () => {
  it("matches a known buying-power figure", () => {
    expect(inflationAdjusted(10000, 4, 10)).toBeCloseTo(6755.64, 2);
  });

  it("returns the amount unchanged for zero years or zero rate", () => {
    expect(inflationAdjusted(10000, 4, 0)).toBe(10000);
    expect(inflationAdjusted(10000, 0, 10)).toBe(10000);
  });
});

describe("compoundGrowth", () => {
  it("matches a month-by-month simulation", () => {
    for (const c of [
      { start: 1000, monthly: 100, rate: 7, years: 20 },
      { start: 0, monthly: 500, rate: 4.5, years: 10 },
      { start: 5000, monthly: 0, rate: 3, years: 5 },
    ]) {
      let balance = c.start;
      for (let i = 0; i < c.years * 12; i++) {
        balance = balance * (1 + c.rate / 1200) + c.monthly;
      }
      const result = compoundGrowth(c.start, c.monthly, c.rate, c.years);
      expect(result.future).toBeCloseTo(balance, 6);
      expect(result.contributed).toBe(c.start + c.monthly * c.years * 12);
    }
  });

  it("handles a zero rate and rounds partial years to whole months", () => {
    expect(compoundGrowth(1000, 100, 0, 2)).toEqual({ future: 3400, contributed: 3400, growth: 0 });
    expect(compoundGrowth(0, 100, 0, 2.55).contributed).toBe(3100);
  });
});

describe("hourlyToYearly", () => {
  it("converts with cents rounding", () => {
    expect(hourlyToYearly(20.1, 40)).toEqual({ yearly: 41808, monthly: 3484 });
    expect(hourlyToYearly(20, 40)).toEqual({ yearly: 41600, monthly: 3466.67 });
    expect(hourlyToYearly(0, 40)).toEqual({ yearly: 0, monthly: 0 });
  });
});

describe("budgetSplit", () => {
  const cat = (name: string, group: BudgetCategory["group"], amount: number): BudgetCategory => ({ name, group, amount });

  it("computes group targets, spending and the unassigned amount", () => {
    const result = budgetSplit(3000, [cat("Rent", "Needs", 1100), cat("Food", "Needs", 350), cat("Out", "Wants", 200), cat("Save", "Savings", 400)]);
    expect(result.groups).toEqual([
      { group: "Needs", spent: 1450, target: 1500 },
      { group: "Wants", spent: 200, target: 900 },
      { group: "Savings", spent: 400, target: 600 },
    ]);
    expect(result.left).toBe(950);
  });

  it("sums in whole cents so exact budgets leave exactly zero", () => {
    expect(budgetSplit(0.3, [cat("a", "Needs", 0.1), cat("b", "Wants", 0.2)]).left).toBe(0);
    expect(budgetSplit(100, [cat("a", "Needs", 33.33), cat("b", "Wants", 33.33), cat("c", "Needs", 33.34)]).left).toBe(0);
  });

  it("reports overspending as a negative remainder", () => {
    expect(budgetSplit(100, [cat("a", "Needs", 60), cat("b", "Wants", 60)]).left).toBe(-20);
  });
});

describe("singleDebtPayoff", () => {
  it("matches an independent month-by-month schedule", () => {
    for (const c of [
      { balance: 3000, apr: 22, payment: 150 },
      { balance: 12000, apr: 7, payment: 250 },
      { balance: 800, apr: 0, payment: 100 },
    ]) {
      let left = c.balance;
      let interest = 0;
      let months = 0;
      while (left > 0.005) {
        const i = (left * c.apr) / 1200;
        interest += i;
        left = left + i - Math.min(c.payment, left + i);
        months++;
      }
      const result = singleDebtPayoff(c.balance, c.apr, c.payment);
      if (result.kind !== "paid-off") throw new Error("expected paid-off");
      expect(result.months).toBe(months);
      expect(result.totalInterest).toBeCloseTo(interest, 6);
    }
  });

  it("reports never when the payment does not cover the interest", () => {
    expect(singleDebtPayoff(12000, 12, 120)).toEqual({ kind: "never" });
    expect(singleDebtPayoff(12000, 12, 50)).toEqual({ kind: "never" });
    expect(singleDebtPayoff(1000, 0, 0)).toEqual({ kind: "never" });
  });

  it("reports too-long when payoff exceeds the horizon and paid-off for no balance", () => {
    expect(singleDebtPayoff(1000000, 12, 10001)).toEqual({ kind: "too-long" });
    expect(singleDebtPayoff(0, 20, 100)).toEqual({ kind: "paid-off", months: 0, totalInterest: 0 });
  });
});
