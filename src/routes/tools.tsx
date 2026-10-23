import { publicSeo } from "@/lib/seo";
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell, Disclaimer } from "@/components/finly/AppShell";

import { Calculator } from "lucide-react";
import { cashflowMonth, emergencyFund, monthAfter, payoffPlan, type Debt, type FlowItem, type PayoffMethod } from "@/lib/finly/money-tools";

export const Route = createFileRoute("/tools")({
  head: () => {
    const seo = publicSeo('/tools', "Free Money Calculators — Savings, Loans, Inflation | Finly", "Quick calculators for savings goals, loan payments, inflation, net worth, 50/30/20 budgets and hourly pay.");
    return {
      meta: [
        { title: "Free Money Calculators — Savings, Loans, Inflation | Finly" },
        {
          name: "description",
          content:
            "Quick calculators for savings goals, loan payments, inflation, net worth, 50/30/20 budgets and hourly pay.",
        },
        { property: "og:title", content: "Free Money Calculators — Finly" },
        { property: "og:description", content: "Savings, loan, inflation, net worth and budget calculators." },
      ...seo.meta,
      ],
      links: seo.links,
    };
  },
  component: Tools,
});

const money = (n: number) => (Number.isFinite(n) ? n.toLocaleString("en", { maximumFractionDigits: 0 }) : "—");

function Tools() {
  return (
    <AppShell>
      <div className="grid grid-cols-[auto_minmax(0,1fr)] items-center gap-3">
        <span className="grid h-11 w-11 place-items-center rounded-2xl bg-accent-soft text-accent-foreground">
          <Calculator className="h-6 w-6" aria-hidden="true" />
        </span>
        <div>
          <h1 className="font-display text-3xl font-extrabold">Calculators</h1>
          <p className="mt-1 text-muted-foreground">Small tools for everyday money decisions. Numbers you type stay on this screen and are not saved.</p>
        </div>
      </div>
      
      <div className="mt-6 grid gap-5 lg:grid-cols-2">

        <SavingsGoal />
        <EmergencyFund />
        <DebtPayoff />
        <CashFlow />
        <LoanCalc />
        <Inflation />
        <NetWorth />
        <Rule503020 />
        <HourlyPay />
      </div>
      <Disclaimer className="mt-8" />
    </AppShell>
  );
}

const slug = (t: string) => ({ "🎯 Savings goal": "savings-goal", "🏦 Compare two loans": "loan-compare", "📉 Inflation impact": "inflation", "⚖️ Net worth": "net-worth", "🥧 50/30/20 budget": "budget-503020", "⏱️ Hourly to yearly": "hourly-pay", "🛟 Emergency fund": "emergency-fund", "🧾 Debt payoff planner": "debt-payoff", "📅 Monthly cash-flow calendar": "cash-flow" } as Record<string, string>)[t];

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section id={slug(title)} className="scroll-mt-24 rounded-2xl border border-border bg-card p-5">
      <h2 className="font-display text-lg font-bold">{title}</h2>
      <div className="mt-3 space-y-3">{children}</div>
    </section>
  );
}

function Field({
  label,
  value,
  onChange,
  step = 1,
  max = 100000000,
}: {
  label: string;
  value: number;
  onChange: (n: number) => void;
  step?: number;
  max?: number;
}) {
  return (
    <label className="block text-sm">
      <span className="font-semibold">{label}</span>
      <input
        type="number"
        min={0}
        max={max}
        step={step}
        value={value}
        onChange={(e) => { const n = Number(e.target.value); if (Number.isFinite(n)) onChange(Math.max(0, Math.min(max, n))); }}
        className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      />
    </label>
  );
}

function Result({ children }: { children: React.ReactNode }) {
  return <div aria-live="polite" className="rounded-lg bg-primary-soft px-4 py-3 text-sm font-semibold">{children}</div>;
}

function SavingsGoal() {
  const [goal, setGoal] = useState(5000);
  const [start, setStart] = useState(500);
  const [monthly, setMonthly] = useState(250);
  const [rate, setRate] = useState(3);
  const r = rate / 100 / 12;
  let months = 0, bal = start;
  while (bal < goal && months < 1200 && (monthly > 0 || r > 0 && bal > 0)) { bal = bal * (1 + r) + monthly; months++; }
  const reached = bal >= goal;
  const date = monthAfter(new Date(), months);
  return (
    <Panel title="🎯 Savings goal">
      <Field label="Goal amount" value={goal} onChange={setGoal} step={100} />
      <Field label="Already saved" value={start} onChange={setStart} step={100} />
      <Field label="Saving per month" value={monthly} onChange={setMonthly} step={25} />
      <Field label="Assumed yearly interest %" value={rate} onChange={setRate} step={0.25} max={30} />
      <Result>{reached ? (months === 0 ? "Goal already reached." : `${months} months — around ${date.toLocaleDateString("en", { month: "long", year: "numeric" })}. You contribute ${money(start + monthly * months)}; interest adds about ${money(bal - start - monthly * months)}.`) : "Not reachable within 100 years at this pace — increase the monthly amount or lower the goal."}</Result>
      <p className="text-xs text-muted-foreground">Assumes monthly compounding and a constant rate; real rates change.</p>
    </Panel>
  );
}

function payment(amount: number, apr: number, years: number) {
  const r = apr / 100 / 12, n = Math.round(years * 12);
  if (n <= 0) return NaN;
  return r ? (amount * r) / (1 - Math.pow(1 + r, -n)) : amount / n;
}

function LoanCalc() {
  const [amount, setAmount] = useState(15000);
  const [a, setA] = useState({ apr: 9, years: 5, fee: 0 });
  const [b, setB] = useState({ apr: 7, years: 7, fee: 300 });
  const rows = [a, b].map((o) => { const p = payment(amount, o.apr, o.years); const n = Math.round(o.years * 12); return { ...o, p, total: p * n + o.fee, cost: p * n + o.fee - amount }; });
  const cheaper = rows[0]!.cost <= rows[1]!.cost ? "A" : "B";
  const opt = (label: string, o: typeof a, set: (v: typeof a) => void) => (
    <div className="space-y-2 rounded-md border border-border p-3"><p className="text-sm font-bold">Option {label}</p>
      <Field label="APR %" value={o.apr} onChange={(v) => set({ ...o, apr: v })} step={0.25} max={100} />
      <Field label="Years" value={o.years} onChange={(v) => set({ ...o, years: v })} max={40} />
      <Field label="Upfront fees" value={o.fee} onChange={(v) => set({ ...o, fee: v })} step={50} /></div>
  );
  return (
    <Panel title="🏦 Compare two loans">
      <Field label="Loan amount" value={amount} onChange={setAmount} step={500} />
      <div className="grid gap-3 sm:grid-cols-2">{opt("A", a, setA)}{opt("B", b, setB)}</div>
      <div aria-live="polite" className="overflow-x-auto"><table className="w-full text-sm"><thead><tr className="text-left text-muted-foreground"><th className="py-1"></th><th>Monthly</th><th>Total paid</th><th>Total cost</th></tr></thead>
        <tbody>{rows.map((r, i) => <tr key={i} className="border-t border-border"><td className="py-1 font-semibold">{i ? "B" : "A"}</td><td>{money(r.p)}</td><td>{money(r.total)}</td><td>{money(r.cost)}</td></tr>)}</tbody></table></div>
      <Result>{rows.every((r) => Number.isFinite(r.p)) ? `Option ${cheaper} costs ${money(Math.abs(rows[0]!.cost - rows[1]!.cost))} less overall. A lower monthly payment can still cost more in total.` : "Enter a term greater than zero."}</Result>
      <p className="text-xs text-muted-foreground">Fixed-rate, equal monthly payments. Total cost = interest + fees.</p>
    </Panel>
  );
}

function Inflation() {
  const [amount, setAmount] = useState(10000);
  const [rate, setRate] = useState(4);
  const [years, setYears] = useState(10);
  const value = amount / Math.pow(1 + rate / 100, years);
  return (
    <Panel title="📉 Inflation impact">
      <Field label="Amount today" value={amount} onChange={setAmount} step={500} />
      <Field label="Inflation %" value={rate} onChange={setRate} step={0.5} max={100} />
      <Field label="Years" value={years} onChange={setYears} max={100} />
      <Result>
        Buying power in {years} years: {money(value)} in today's money.
      </Result>
    </Panel>
  );
}

function NetWorth() {
  const [assets, setAssets] = useState(20000);
  const [debts, setDebts] = useState(8000);
  return (
    <Panel title="⚖️ Net worth">
      <Field label="Everything you own" value={assets} onChange={setAssets} step={500} />
      <Field label="Everything you owe" value={debts} onChange={setDebts} step={500} />
      <Result>Net worth: {money(assets - debts)}</Result>
    </Panel>
  );
}

type Cat = { name: string; group: "Needs" | "Wants" | "Savings"; amount: number };

function Rule503020() {
  const [income, setIncome] = useState(3000);
  const [cats, setCats] = useState<Cat[]>([
    { name: "Rent", group: "Needs", amount: 1100 }, { name: "Groceries", group: "Needs", amount: 350 },
    { name: "Eating out", group: "Wants", amount: 200 }, { name: "Savings", group: "Savings", amount: 400 },
  ]);
  const upd = (i: number, c: Partial<Cat>) => setCats(cats.map((x, k) => (k === i ? { ...x, ...c } : x)));
  const groups = (["Needs", "Wants", "Savings"] as const).map((g, i) => { const spent = cats.filter((c) => c.group === g).reduce((s, c) => s + c.amount, 0); const target = income * [0.5, 0.3, 0.2][i]!; return { g, spent, target }; });
  const left = income - cats.reduce((s, c) => s + c.amount, 0);
  return (
    <Panel title="🥧 50/30/20 budget">
      <Field label="Monthly take-home pay" value={income} onChange={setIncome} step={50} />
      <ul className="space-y-2">{cats.map((c, i) => (
        <li key={i} className="grid grid-cols-[minmax(0,1fr)_auto_6rem_auto] items-center gap-2">
          <input aria-label="Category name" value={c.name} maxLength={30} onChange={(e) => upd(i, { name: e.target.value })} className="min-w-0 rounded-md border border-border bg-background px-2 py-1.5 text-sm" />
          <select aria-label={`${c.name} group`} value={c.group} onChange={(e) => upd(i, { group: e.target.value as Cat["group"] })} className="rounded-md border border-border bg-background px-1 py-1.5 text-sm"><option>Needs</option><option>Wants</option><option>Savings</option></select>
          <input aria-label={`${c.name} amount`} type="number" min={0} value={c.amount} onChange={(e) => { const n = Number(e.target.value); if (Number.isFinite(n)) upd(i, { amount: Math.max(0, Math.min(1e8, n)) }); }} className="rounded-md border border-border bg-background px-2 py-1.5 text-sm" />
          <button type="button" aria-label={`Remove ${c.name}`} onClick={() => setCats(cats.filter((_, k) => k !== i))} className="px-2 text-muted-foreground hover:text-destructive">✕</button>
        </li>))}</ul>
      {cats.length < 15 && <button type="button" className="text-sm font-semibold text-primary" onClick={() => setCats([...cats, { name: "New category", group: "Wants", amount: 0 }])}>+ Add category</button>}
      <div aria-live="polite" className="space-y-2">{groups.map(({ g, spent, target }) => (
        <div key={g}><div className="flex justify-between text-sm"><span>{g}</span><span className={g !== "Savings" && spent > target ? "font-semibold text-destructive" : ""}>{money(spent)} / {money(target)}</span></div>
          <progress aria-label={`${g} vs target`} value={Math.min(spent, target)} max={target || 1} /></div>))}</div>
      <Result>{left >= 0 ? `${money(left)} not yet assigned.` : `Over budget by ${money(-left)}.`}</Result>
    </Panel>
  );
}

function HourlyPay() {
  const [hourly, setHourly] = useState(20);
  const [hours, setHours] = useState(40);
  return (
    <Panel title="⏱️ Hourly to yearly">
      <Field label="Hourly rate" value={hourly} onChange={setHourly} step={0.5} />
      <Field label="Hours per week" value={hours} onChange={setHours} />
      <Result>
        {money(hourly * hours * 52)} per year · {money((hourly * hours * 52) / 12)} per month (before tax)
      </Result>
    </Panel>
  );
}

const inputCls = "min-w-0 w-full rounded-md border border-border bg-background px-2 py-1.5 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";
const clampNum = (v: string, max: number) => { const n = Number(v); return Number.isFinite(n) ? Math.max(0, Math.min(max, n)) : 0; };

function EmergencyFund() {
  const [exp, setExp] = useState(1800);
  const [months, setMonths] = useState(3);
  const [saved, setSaved] = useState(1000);
  const [monthly, setMonthly] = useState(200);
  const r = emergencyFund(exp, months, saved, monthly);
  return (
    <Panel title="🛟 Emergency fund">
      <Field label="Essential expenses per month" value={exp} onChange={setExp} step={50} />
      <Field label="Target months of cover" value={months} onChange={setMonths} max={24} />
      <Field label="Already saved for emergencies" value={saved} onChange={setSaved} step={100} />
      <Field label="Saving per month" value={monthly} onChange={setMonthly} step={25} />
      <Result>
        Target {money(r.target)}. {r.coverMonths !== null ? `Today you cover about ${r.coverMonths.toFixed(1)} months. ` : ""}
        {r.gap === 0 ? "Target reached." : r.months === null ? `You need ${money(r.gap)} more — add a monthly amount to see a timeline.` : `${money(r.gap)} to go: about ${r.months} month${r.months === 1 ? "" : "s"} at this pace.`}
      </Result>
      <p className="text-xs text-muted-foreground">Ignores interest and assumes the same deposit every month. Many guides suggest 3–6 months of essentials; choose what fits your job security.</p>
    </Panel>
  );
}

function DebtPayoff() {
  const [debts, setDebts] = useState<Debt[]>([
    { name: "Credit card", balance: 2500, apr: 22, minPayment: 75 },
    { name: "Car loan", balance: 6000, apr: 7, minPayment: 180 },
  ]);
  const [budget, setBudget] = useState(500);
  const upd = (i: number, d: Partial<Debt>) => setDebts(debts.map((x, k) => (k === i ? { ...x, ...d } : x)));
  const res = (["avalanche", "snowball"] as PayoffMethod[]).map((m) => ({ m, r: payoffPlan(debts, budget, m) }));
  const first = res[0]!.r;
  return (
    <Panel title="🧾 Debt payoff planner">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[30rem] text-sm">
          <thead><tr className="text-left text-xs text-muted-foreground"><th className="pb-1 font-semibold">Debt</th><th className="font-semibold">Balance</th><th className="font-semibold">APR %</th><th className="font-semibold">Minimum</th><th><span className="sr-only">Remove</span></th></tr></thead>
          <tbody>{debts.map((d, i) => (
            <tr key={i}>
              <td className="py-1 pr-1"><input aria-label={`Debt ${i + 1} name`} value={d.name} maxLength={30} onChange={(e) => upd(i, { name: e.target.value })} className={inputCls} /></td>
              <td className="pr-1"><input aria-label={`${d.name} balance`} type="number" min={0} value={d.balance} onChange={(e) => upd(i, { balance: clampNum(e.target.value, 1e8) })} className={inputCls} /></td>
              <td className="pr-1"><input aria-label={`${d.name} APR percent`} type="number" min={0} max={100} step={0.1} value={d.apr} onChange={(e) => upd(i, { apr: clampNum(e.target.value, 100) })} className={inputCls} /></td>
              <td className="pr-1"><input aria-label={`${d.name} minimum payment`} type="number" min={0} value={d.minPayment} onChange={(e) => upd(i, { minPayment: clampNum(e.target.value, 1e7) })} className={inputCls} /></td>
              <td><button type="button" aria-label={`Remove ${d.name}`} onClick={() => setDebts(debts.filter((_, k) => k !== i))} className="min-h-9 px-2 text-muted-foreground hover:text-destructive">✕</button></td>
            </tr>))}</tbody>
        </table>
      </div>
      {debts.length < 10 && <button type="button" className="text-sm font-semibold text-primary" onClick={() => setDebts([...debts, { name: `Debt ${debts.length + 1}`, balance: 1000, apr: 15, minPayment: 30 }])}>+ Add debt</button>}
      <Field label="Total monthly budget for debt payments" value={budget} onChange={setBudget} step={25} />
      <div aria-live="polite" className="space-y-2">
        {!first.ok && first.reason === "budget-below-minimums" ? (
          <p role="alert" className="rounded-lg bg-destructive/10 px-4 py-3 text-sm font-semibold text-destructive">Your budget is below the total minimum payments ({money(first.minimumsTotal)}). Raise it to at least that amount.</p>
        ) : (
          <div className="grid gap-2 sm:grid-cols-2">{res.map(({ m, r }) => (
            <div key={m} className="rounded-lg bg-primary-soft px-4 py-3 text-sm">
              <p className="font-bold capitalize">{m}</p>
              <p className="text-xs text-muted-foreground">{m === "avalanche" ? "Extra money to the highest rate first" : "Extra money to the smallest balance first"}</p>
              {r.ok ? <><p className="mt-1 font-semibold">{r.months === 0 ? "No debt left" : `Debt-free in ${r.months} months (${(r.months / 12).toFixed(1)} yrs)`}</p><p>Total interest: {money(r.totalInterest)}</p>{r.order.length > 1 && <p className="text-xs">Order: {r.order.join(" → ")}</p>}</> : <p className="mt-1 font-semibold text-destructive">Not paid off within 50 years — increase the budget.</p>}
            </div>))}</div>
        )}
      </div>
      <p className="text-xs text-muted-foreground">Assumes fixed APRs, interest added monthly (APR ÷ 12), no new borrowing or fees, and that freed-up minimums roll into the next debt. Real lenders may calculate interest daily.</p>
    </Panel>
  );
}

function CashFlow() {
  const [start, setStart] = useState(400);
  const [items, setItems] = useState<FlowItem[]>([
    { label: "Rent", day: 1, amount: 900, kind: "bill" },
    { label: "Salary", day: 15, amount: 1500, kind: "income" },
    { label: "Phone", day: 10, amount: 40, kind: "bill" },
    { label: "Salary", day: 30, amount: 1500, kind: "income" },
  ]);
  const upd = (i: number, d: Partial<FlowItem>) => setItems(items.map((x, k) => (k === i ? { ...x, ...d } : x)));
  const r = cashflowMonth(start, items);
  return (
    <Panel title="📅 Monthly cash-flow calendar">
      <Field label="Balance at start of month" value={start} onChange={setStart} step={50} />
      <ul className="space-y-2">{items.map((it, i) => (
        <li key={i} className="grid grid-cols-[minmax(0,1fr)_5.5rem] gap-2 sm:grid-cols-[minmax(0,1fr)_5.5rem_3.5rem_6rem_auto]">
          <input aria-label={`Item ${i + 1} name`} value={it.label} maxLength={30} onChange={(e) => upd(i, { label: e.target.value })} className={inputCls} />
          <select aria-label={`${it.label} type`} value={it.kind} onChange={(e) => upd(i, { kind: e.target.value as FlowItem["kind"] })} className={inputCls}><option value="income">Income</option><option value="bill">Bill</option></select>
          <input aria-label={`${it.label} day of month`} type="number" min={1} max={31} value={it.day} onChange={(e) => upd(i, { day: Math.max(1, Math.min(31, clampNum(e.target.value, 31) || 1)) })} className={inputCls} />
          <input aria-label={`${it.label} amount`} type="number" min={0} value={it.amount} onChange={(e) => upd(i, { amount: clampNum(e.target.value, 1e8) })} className={inputCls} />
          <button type="button" aria-label={`Remove ${it.label}`} onClick={() => setItems(items.filter((_, k) => k !== i))} className="min-h-9 px-2 text-muted-foreground hover:text-destructive">✕</button>
        </li>))}</ul>
      {items.length < 30 && <button type="button" className="text-sm font-semibold text-primary" onClick={() => setItems([...items, { label: "New bill", day: 20, amount: 50, kind: "bill" }])}>+ Add income or bill</button>}
      <div aria-live="polite" className="space-y-2">
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">{r.periods.map((p) => (
          <div key={p.label} className="rounded-lg border border-border px-3 py-2 text-xs"><p className="text-muted-foreground">{p.label}</p><p className={`text-sm font-bold ${p.end < 0 ? "text-destructive" : ""}`}>{money(p.end)}</p></div>))}</div>
        {r.firstNegativeDay !== null ? (
          <p role="alert" className="rounded-lg bg-destructive/10 px-4 py-3 text-sm font-semibold text-destructive">⚠ Balance may go negative on day {r.firstNegativeDay} (lowest {money(r.lowest)}). Consider moving a bill date, keeping a buffer, or asking a provider to change the due date.</p>
        ) : (
          <Result>Lowest balance {money(r.lowest)}{r.lowestDay ? ` on day ${r.lowestDay}` : ""}. Month ends at {money(r.endBalance)}.</Result>
        )}
      </div>
      <p className="text-xs text-muted-foreground">Same-day income is counted before bills. Periods show the balance at the end of each block of days.</p>
    </Panel>
  );
}
