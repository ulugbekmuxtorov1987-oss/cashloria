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
