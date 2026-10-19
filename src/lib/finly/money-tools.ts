// Pure calculation helpers for the money tools. Educational estimates only.

export type Debt = { name: string; balance: number; apr: number; minPayment: number };
export type PayoffMethod = "avalanche" | "snowball";
export type PayoffResult =
  | { ok: true; months: number; totalInterest: number; order: string[] }
  | { ok: false; reason: "budget-below-minimums" | "never-paid-off"; minimumsTotal: number };

const MAX_MONTHS = 600;

/** Monthly simulation: interest accrues, minimums are paid, all spare budget goes to the target debt. */
export function payoffPlan(debts: Debt[], monthlyBudget: number, method: PayoffMethod): PayoffResult {
  const list = debts.filter((d) => d.balance > 0).map((d) => ({ ...d }));
  const minimumsTotal = list.reduce((s, d) => s + d.minPayment, 0);
  if (list.length === 0) return { ok: true, months: 0, totalInterest: 0, order: [] };
  if (monthlyBudget < minimumsTotal) return { ok: false, reason: "budget-below-minimums", minimumsTotal };
  let months = 0;
  let totalInterest = 0;
  const order: string[] = [];
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
      if (d.balance <= 0.005 && !order.includes(d.name)) {
        d.balance = 0;
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
  const sorted = items
    .map((i) => ({ ...i, day: Math.min(31, Math.max(1, Math.round(i.day))) }))
    .sort((a, b) => a.day - b.day || (a.kind === "income" ? -1 : 1));
  let bal = start;
  let lowest = start;
  let lowestDay: number | null = null;
  let firstNegativeDay: number | null = start < 0 ? 1 : null;
  const rows = sorted.map((i) => {
    bal += i.kind === "income" ? i.amount : -i.amount;
    if (bal < lowest) { lowest = bal; lowestDay = i.day; }
    if (bal < 0 && firstNegativeDay === null) firstNegativeDay = i.day;
    return { ...i, balance: bal };
  });
  const bounds: [string, number][] = [["Days 1–7", 7], ["Days 8–14", 14], ["Days 15–21", 21], ["Days 22–31", 31]];
  const periods = bounds.map(([label, endDay]) => {
    const last = [...rows].reverse().find((r) => r.day <= endDay);
    return { label, end: last ? last.balance : start };
  });
  return { rows, periods, lowest, lowestDay, firstNegativeDay, endBalance: bal };
}

export function emergencyFund(monthlyExpenses: number, targetMonths: number, saved: number, monthlyContribution: number) {
  const target = monthlyExpenses * targetMonths;
  const gap = Math.max(0, target - saved);
  const months = gap === 0 ? 0 : monthlyContribution > 0 ? Math.ceil(gap / monthlyContribution) : null;
  const coverMonths = monthlyExpenses > 0 ? saved / monthlyExpenses : null;
  return { target, gap, months, coverMonths };
}
