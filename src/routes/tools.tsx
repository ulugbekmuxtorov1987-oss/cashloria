import { publicSeo } from "@/lib/seo";
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell, Disclaimer } from "@/components/finly/AppShell";

import { Calculator } from "lucide-react";

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

const money = (n: number) => (Number.isFinite(n) ? n.toLocaleString(undefined, { maximumFractionDigits: 0 }) : "—");

function Tools() {
  return (
    <AppShell>
      <div className="grid grid-cols-[auto_minmax(0,1fr)] items-center gap-3">
        <span className="grid h-11 w-11 place-items-center rounded-2xl bg-accent-soft text-accent-foreground">
          <Calculator className="h-6 w-6" aria-hidden="true" />
        </span>
        <div>
          <h1 className="font-display text-3xl font-extrabold">Calculators</h1>
          <p className="mt-1 text-muted-foreground">Small tools for everyday money decisions.</p>
        </div>
      </div>
      
      <div className="mt-6 grid gap-5 lg:grid-cols-2">

        <SavingsGoal />
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

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-border bg-card p-5">
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
        className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2"
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
  const date = new Date(); date.setMonth(date.getMonth() + months);
  return (
    <Panel title="🎯 Savings goal">
      <Field label="Goal amount" value={goal} onChange={setGoal} step={100} />
      <Field label="Already saved" value={start} onChange={setStart} step={100} />
      <Field label="Saving per month" value={monthly} onChange={setMonthly} step={25} />
      <Field label="Assumed yearly interest %" value={rate} onChange={setRate} step={0.25} max={30} />
      <Result>{reached ? (months === 0 ? "Goal already reached." : `${months} months — around ${date.toLocaleDateString("en", { month: "long", year: "numeric" })}. You contribute ${money(start + monthly * months)}; interest adds about ${money(bal - start - monthly * months)}.`) : "Not reachable within 100 years — add a monthly amount."}</Result>
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
