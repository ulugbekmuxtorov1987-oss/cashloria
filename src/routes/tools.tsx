import { publicSeo } from "@/lib/seo";
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell, Disclaimer } from "@/components/finly/AppShell";

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
      <h1 className="font-display text-3xl font-extrabold">Calculators</h1>
      <p className="mt-2 text-muted-foreground">Small tools for everyday money decisions.</p>
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

function SavingsGoal() {
  const [goal, setGoal] = useState(5000);
  const [monthly, setMonthly] = useState(250);
  const months = monthly > 0 ? Math.ceil(goal / monthly) : Infinity;
  return (
    <Panel title="🎯 Savings goal">
      <Field label="Goal amount" value={goal} onChange={setGoal} step={100} />
      <Field label="Saving per month" value={monthly} onChange={setMonthly} step={25} />
      <Result>{Number.isFinite(months) ? `${months} months (${(months / 12).toFixed(1)} years)` : "Add a monthly amount"}</Result>
    </Panel>
  );
}

function LoanCalc() {
  const [amount, setAmount] = useState(15000);
  const [apr, setApr] = useState(9);
  const [years, setYears] = useState(5);
  const r = apr / 100 / 12;
  const n = years * 12;
  const payment = r ? (amount * r) / (1 - Math.pow(1 + r, -n)) : amount / n;
  return (
    <Panel title="🏦 Loan payment">
      <Field label="Loan amount" value={amount} onChange={setAmount} step={500} />
      <Field label="APR %" value={apr} onChange={setApr} step={0.25} />
      <Field label="Years" value={years} onChange={setYears} />
      <Result>
        {money(payment)} / month · total interest {money(payment * n - amount)}
      </Result>
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
      <Field label="Inflation %" value={rate} onChange={setRate} step={0.5} />
      <Field label="Years" value={years} onChange={setYears} />
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

function Rule503020() {
  const [income, setIncome] = useState(3000);
  return (
    <Panel title="🥧 50/30/20 split">
      <Field label="Monthly take-home pay" value={income} onChange={setIncome} step={50} />
      <Result>
        Needs {money(income * 0.5)} · Wants {money(income * 0.3)} · Savings {money(income * 0.2)}
      </Result>
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
