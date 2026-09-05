import { publicSeo } from "@/lib/seo";
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell, Disclaimer } from "@/components/finly/AppShell";

export const Route = createFileRoute("/simulators")({
  head: () => {
    const seo = publicSeo('/simulators', "Money Simulators — Budget, Compound Interest, Debt | Finly", "Play with real-world money scenarios: monthly budget, compound growth, debt payoff and emergency fund planning.");
    return {
      meta: [
        { title: "Money Simulators — Budget, Compound Interest, Debt | Finly" },
        {
          name: "description",
          content:
            "Play with real-world money scenarios: monthly budget, compound growth, debt payoff and emergency fund planning.",
        },
        { property: "og:title", content: "Money Simulators — Finly" },
        { property: "og:description", content: "Interactive budget, investing, debt and emergency fund simulators." },
      ...seo.meta,
      ],
      links: seo.links,
    };
  },
  component: Simulators,
});

const money = (n: number) => n.toLocaleString(undefined, { maximumFractionDigits: 0 });

function Simulators() {
  return (
    <AppShell>
      <h1 className="font-display text-3xl font-extrabold">Simulators</h1>
      <p className="mt-2 text-muted-foreground">Change the numbers and see what happens to your money.</p>

      <div className="mt-6 grid gap-5 lg:grid-cols-2">
        <BudgetSim />
        <CompoundSim />
        <DebtSim />
        <EmergencySim />
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
}: {
  label: string;
  value: number;
  onChange: (n: number) => void;
  step?: number;
}) {
  return (
    <label className="block text-sm">
      <span className="font-semibold">{label}</span>
      <input
        type="number"
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2"
      />
    </label>
  );
}

function Result({ children }: { children: React.ReactNode }) {
  return <div className="rounded-xl bg-primary-soft px-4 py-3 text-sm font-semibold">{children}</div>;
}

function BudgetSim() {
  const [income, setIncome] = useState(3000);
  const [needs, setNeeds] = useState(1500);
  const [wants, setWants] = useState(700);
  const left = income - needs - wants;
  return (
    <Panel title="🧾 Monthly budget">
      <Field label="Monthly income" value={income} onChange={setIncome} step={50} />
      <Field label="Needs (rent, food, bills)" value={needs} onChange={setNeeds} step={50} />
      <Field label="Wants" value={wants} onChange={setWants} step={50} />
      <Result>
        Left to save: {money(left)} ({income > 0 ? Math.round((left / income) * 100) : 0}% of income)
        {left < 0 ? " — you're overspending." : ""}
      </Result>
    </Panel>
  );
}

function CompoundSim() {
  const [start, setStart] = useState(1000);
  const [monthly, setMonthly] = useState(100);
  const [rate, setRate] = useState(7);
  const [years, setYears] = useState(20);
  const r = rate / 100 / 12;
  const n = years * 12;
  const future = start * Math.pow(1 + r, n) + (r ? monthly * ((Math.pow(1 + r, n) - 1) / r) : monthly * n);
  const contributed = start + monthly * n;
  return (
    <Panel title="📈 Compound growth">
      <Field label="Starting amount" value={start} onChange={setStart} step={100} />
      <Field label="Monthly contribution" value={monthly} onChange={setMonthly} step={25} />
      <Field label="Annual return %" value={rate} onChange={setRate} step={0.5} />
      <Field label="Years" value={years} onChange={setYears} />
      <Result>
        After {years} years: {money(future)} — you put in {money(contributed)}, growth added{" "}
        {money(future - contributed)}.
      </Result>
    </Panel>
  );
}

function DebtSim() {
  const [balance, setBalance] = useState(3000);
  const [apr, setApr] = useState(22);
  const [payment, setPayment] = useState(150);
  const r = apr / 100 / 12;
  let bal = balance;
  let months = 0;
  let interest = 0;
  while (bal > 0 && months < 600) {
    const i = bal * r;
    if (payment <= i) {
      months = -1;
      break;
    }
    interest += i;
    bal = bal + i - payment;
    months++;
  }
  return (
    <Panel title="💳 Debt payoff">
      <Field label="Balance" value={balance} onChange={setBalance} step={100} />
      <Field label="APR %" value={apr} onChange={setApr} step={0.5} />
      <Field label="Monthly payment" value={payment} onChange={setPayment} step={25} />
      <Result>
        {months < 0
          ? "That payment is smaller than the monthly interest — the debt never goes away."
          : `Paid off in ${months} months (${(months / 12).toFixed(1)} years), interest paid ${money(interest)}.`}
      </Result>
    </Panel>
  );
}

function EmergencySim() {
  const [expenses, setExpenses] = useState(1800);
  const [saved, setSaved] = useState(1200);
  const [monthly, setMonthly] = useState(200);
  const target = expenses * 3;
  const gap = Math.max(0, target - saved);
  const months = monthly > 0 ? Math.ceil(gap / monthly) : Infinity;
  return (
    <Panel title="🛟 Emergency fund">
      <Field label="Monthly essential expenses" value={expenses} onChange={setExpenses} step={50} />
      <Field label="Already saved" value={saved} onChange={setSaved} step={50} />
      <Field label="Saving per month" value={monthly} onChange={setMonthly} step={25} />
      <Result>
        3-month target: {money(target)}.{" "}
        {gap === 0
          ? "You're there — consider extending to 6 months."
          : `${money(gap)} to go — about ${Number.isFinite(months) ? months : "∞"} months at this rate.`}
      </Result>
    </Panel>
  );
}
