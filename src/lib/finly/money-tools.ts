// Pure calculation helpers for the money tools. Educational estimates only.

export type Debt = { name: string; balance: number; apr: number; minPayment: number };
export type PayoffMethod = "avalanche" | "snowball";
export type PayoffResult =
  | { ok: true; months: number; totalInterest: number; order: string[] }
  | { ok: false; reason: "budget-below-minimums" | "never-paid-off"; minimumsTotal: number };

const MAX_MONTHS = 600;

/** Whole cents, so sums like 0.1 + 0.2 - 0.3 compare exactly instead of leaving 1e-17 residues. */
const toCents = (amount: number) => Math.round(amount * 100);

/**
 * First day of the month that is `months` months after `from`. Only the month and year are meaningful:
 * Date#setMonth would overflow on the 29th-31st (31 Oct + 4 months = 3 Mar, not February).
 */
export function monthAfter(from: Date, months: number): Date {
  return new Date(from.getFullYear(), from.getMonth() + months, 1);
}

/** Monthly simulation: interest accrues, minimums are paid, all spare budget goes to the target debt. */
export function payoffPlan(debts: Debt[], monthlyBudget: number, method: PayoffMethod): PayoffResult {
  const list = debts.filter((d) => d.balance > 0).map((d) => ({ ...d }));
  const minimumsTotal = list.reduce((s, d) => s + d.minPayment, 0);
  if (list.length === 0) return { ok: true, months: 0, totalInterest: 0, order: [] };
  if (monthlyBudget < minimumsTotal) return { ok: false, reason: "budget-below-minimums", minimumsTotal };
  let months = 0;
  let totalInterest = 0;
  const order: string[] = [];
  // Tracked per debt (not by name) so two debts with the same name are both reported.
  const paidOff = new Set<(typeof list)[number]>();
  while (list.some((d) => d.balance > 0.005)) {
    if (months >= MAX_MONTHS) return { ok: false, reason: "never-paid-off", minimumsTotal };
    months++;
    for (const d of list) {
      if (d.balance <= 0) continue;
      const interest = d.balance * (d.apr / 100 / 12);
      d.balance += interest;
      totalInterest += interest;
    }
    let left = monthlyBudget;
    for (const d of list) {
      if (d.balance <= 0) continue;
      const pay = Math.min(d.minPayment, d.balance, left);
      d.balance -= pay;
      left -= pay;
    }
    const targets = list
      .filter((d) => d.balance > 0)
      .sort((a, b) => (method === "avalanche" ? b.apr - a.apr || a.balance - b.balance : a.balance - b.balance || b.apr - a.apr));
    for (const d of targets) {
      if (left <= 0) break;
      const pay = Math.min(left, d.balance);
      d.balance -= pay;
      left -= pay;
    }
    for (const d of list) {
      if (d.balance <= 0.005 && !paidOff.has(d)) {
        d.balance = 0;
        paidOff.add(d);
        order.push(d.name);
      }
    }
  }
  return { ok: true, months, totalInterest, order };
}

export type FlowItem = { label: string; day: number; amount: number; kind: "income" | "bill" };
export type CashflowResult = {
  rows: (FlowItem & { balance: number })[];
  periods: { label: string; end: number }[];
  lowest: number;
  lowestDay: number | null;
  firstNegativeDay: number | null;
  endBalance: number;
};

export function cashflowMonth(start: number, items: FlowItem[]): CashflowResult {
  // Same-day income is counted before bills; items of the same kind keep the order they were entered in.
  const sorted = items
    .map((i) => ({ ...i, day: Math.min(31, Math.max(1, Math.round(i.day))) }))
    .sort((a, b) => a.day - b.day || (a.kind === b.kind ? 0 : a.kind === "income" ? -1 : 1));
  // Balances are tracked in whole cents so a balance of exactly 0.00 is never reported as negative.
  const startCents = toCents(start);
  let balCents = startCents;
  let lowestCents = startCents;
  let lowestDay: number | null = null;
  let firstNegativeDay: number | null = startCents < 0 ? 1 : null;
  const rows = sorted.map((i) => {
    balCents += (i.kind === "income" ? 1 : -1) * toCents(i.amount);
    if (balCents < lowestCents) { lowestCents = balCents; lowestDay = i.day; }
    if (balCents < 0 && firstNegativeDay === null) firstNegativeDay = i.day;
    return { ...i, balance: balCents / 100 };
  });
  const bounds: [string, number][] = [["Days 1–7", 7], ["Days 8–14", 14], ["Days 15–21", 21], ["Days 22–31", 31]];
  const periods = bounds.map(([label, endDay]) => {
    const last = [...rows].reverse().find((r) => r.day <= endDay);
    return { label, end: last ? last.balance : startCents / 100 };
  });
  return { rows, periods, lowest: lowestCents / 100, lowestDay, firstNegativeDay, endBalance: balCents / 100 };
}

export function emergencyFund(monthlyExpenses: number, targetMonths: number, saved: number, monthlyContribution: number) {
  // Whole cents, so a gap that is an exact multiple of the deposit never rounds up to an extra month.
  const targetCents = Math.round(toCents(monthlyExpenses) * targetMonths);
  const gapCents = Math.max(0, targetCents - toCents(saved));
  const contributionCents = toCents(monthlyContribution);
  const months = gapCents === 0 ? 0 : contributionCents > 0 ? Math.ceil(gapCents / contributionCents) : null;
  const coverMonths = monthlyExpenses > 0 ? saved / monthlyExpenses : null;
  return { target: targetCents / 100, gap: gapCents / 100, months, coverMonths };
}

// ---------------------------------------------------------------------------------------------
// Calculators that used to live inline in the route files. Pure and unit-tested.
// ---------------------------------------------------------------------------------------------

const monthlyRate = (yearlyPercent: number) => yearlyPercent / 100 / 12;

const MAX_SAVINGS_MONTHS = 1200;

export type SavingsGoalResult = { months: number; reached: boolean; balance: number; contributed: number; interest: number };

/** Months until `start` grows to `goal` with a fixed monthly deposit and monthly compounding (deposit at month end). */
export function savingsGoal(goal: number, start: number, monthly: number, yearlyRatePercent: number): SavingsGoalResult {
  const r = monthlyRate(yearlyRatePercent);
  const goalCents = toCents(goal);
  let months = 0;
  let balance = start;
  // Compared in whole cents so ten deposits of 0.10 reach 1.00 instead of stopping at 0.9999999999999999.
  while (toCents(balance) < goalCents && months < MAX_SAVINGS_MONTHS && (monthly > 0 || (r > 0 && balance > 0))) {
    balance = balance * (1 + r) + monthly;
    months++;
  }
  const contributed = start + monthly * months;
  return { months, reached: toCents(balance) >= goalCents, balance, contributed, interest: balance - contributed };
}

/** Equal monthly payment of a fixed-rate loan. NaN when the term rounds to zero months. */
export function loanPayment(amount: number, aprPercent: number, years: number): number {
  const n = Math.round(years * 12);
  if (n <= 0) return Number.NaN;
  const r = monthlyRate(aprPercent);
  return r > 0 ? (amount * r) / (1 - Math.pow(1 + r, -n)) : amount / n;
}

export type LoanOption = { apr: number; years: number; fee: number };
export type LoanSummary = { monthly: number; months: number; total: number; cost: number };

export function loanSummary(amount: number, option: LoanOption): LoanSummary {
  const months = Math.round(option.years * 12);
  const monthly = loanPayment(amount, option.apr, option.years);
  const total = monthly * months + option.fee;
  return { monthly, months, total, cost: total - amount };
}

/** "same" when the two total costs differ by less than half a cent (or cannot be computed). */
export function compareLoans(amount: number, a: LoanOption, b: LoanOption): { a: LoanSummary; b: LoanSummary; cheaper: "A" | "B" | "same"; difference: number } {
  const first = loanSummary(amount, a);
  const second = loanSummary(amount, b);
  const difference = Math.abs(first.cost - second.cost);
  const cheaper = !(difference >= 0.005) ? "same" : first.cost < second.cost ? "A" : "B";
  return { a: first, b: second, cheaper, difference };
}

/** What `amount` today buys after `years` of constant yearly inflation, in today's money. */
export function inflationAdjusted(amount: number, yearlyPercent: number, years: number): number {
  return amount / Math.pow(1 + yearlyPercent / 100, years);
}

/** Future value with monthly compounding and deposits at the end of each month. Years are rounded to whole months. */
export function compoundGrowth(start: number, monthly: number, yearlyReturnPercent: number, years: number) {
  const n = Math.round(years * 12);
  const r = monthlyRate(yearlyReturnPercent);
  const factor = Math.pow(1 + r, n);
  const future = start * factor + (r > 0 ? monthly * ((factor - 1) / r) : monthly * n);
  const contributed = start + monthly * n;
  return { future, contributed, growth: future - contributed };
}

/** Gross yearly and monthly pay from an hourly rate (52 paid weeks), in whole cents. */
export function hourlyToYearly(hourly: number, hoursPerWeek: number) {
  const yearlyCents = Math.round(toCents(hourly) * hoursPerWeek * 52);
  return { yearly: yearlyCents / 100, monthly: Math.round(yearlyCents / 12) / 100 };
}

export type BudgetGroup = "Needs" | "Wants" | "Savings";
export type BudgetCategory = { name: string; group: BudgetGroup; amount: number };
const BUDGET_SHARES: Record<BudgetGroup, number> = { Needs: 0.5, Wants: 0.3, Savings: 0.2 };

/** 50/30/20 targets per group and the unassigned amount, summed in whole cents. */
export function budgetSplit(income: number, categories: BudgetCategory[]) {
  const incomeCents = toCents(income);
  const groups = (["Needs", "Wants", "Savings"] as const).map((group) => {
    const spentCents = categories.filter((c) => c.group === group).reduce((sum, c) => sum + toCents(c.amount), 0);
    return { group, spent: spentCents / 100, target: Math.round(incomeCents * BUDGET_SHARES[group]) / 100 };
  });
  const totalCents = categories.reduce((sum, c) => sum + toCents(c.amount), 0);
  return { groups, left: (incomeCents - totalCents) / 100 };
}

export type SingleDebtResult =
  | { kind: "paid-off"; months: number; totalInterest: number }
  | { kind: "never" }
  | { kind: "too-long" };

/** One debt, one fixed payment. "never" when the payment does not even cover the first month's interest. */
export function singleDebtPayoff(balance: number, aprPercent: number, payment: number): SingleDebtResult {
  if (balance <= 0) return { kind: "paid-off", months: 0, totalInterest: 0 };
  if (payment <= balance * monthlyRate(aprPercent)) return { kind: "never" };
  const plan = payoffPlan([{ name: "Debt", balance, apr: aprPercent, minPayment: payment }], payment, "avalanche");
  return plan.ok ? { kind: "paid-off", months: plan.months, totalInterest: plan.totalInterest } : { kind: "too-long" };
}
