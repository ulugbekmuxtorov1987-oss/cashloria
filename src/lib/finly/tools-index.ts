import type { CategoryId } from "./types";

// Searchable index of calculators and simulators (shared by library search and the tools page anchors).
export const TOOL_INDEX: { id: string; title: string; emoji: string; summary: string; category: CategoryId; page: "/tools" | "/simulators" }[] = [
  { id: "savings-goal", title: "Savings goal", emoji: "🎯", summary: "Months to reach a savings target with monthly deposits and interest.", category: "saving", page: "/tools" },
  { id: "emergency-fund", title: "Emergency fund", emoji: "🛟", summary: "Target cushion from monthly expenses and time to reach it.", category: "saving", page: "/tools" },
  { id: "debt-payoff", title: "Debt payoff planner", emoji: "🧾", summary: "Avalanche vs snowball for several debts: payoff time and total interest.", category: "credit-debt", page: "/tools" },
  { id: "cash-flow", title: "Monthly cash-flow calendar", emoji: "📅", summary: "Incomes and bills by date with running balance and low-balance warnings.", category: "budgeting", page: "/tools" },
  { id: "loan-compare", title: "Compare two loans", emoji: "🏦", summary: "Monthly payment, total paid and total cost including fees.", category: "credit-debt", page: "/tools" },
  { id: "inflation", title: "Inflation impact", emoji: "📉", summary: "Future buying power of money today.", category: "money-basics", page: "/tools" },
  { id: "net-worth", title: "Net worth", emoji: "⚖️", summary: "What you own minus what you owe.", category: "planning", page: "/tools" },
  { id: "budget-503020", title: "50/30/20 budget", emoji: "🥧", summary: "Needs, wants and savings against your take-home pay.", category: "budgeting", page: "/tools" },
  { id: "hourly-pay", title: "Hourly to yearly", emoji: "⏱️", summary: "Convert hourly pay to yearly and monthly before tax.", category: "money-basics", page: "/tools" },
  { id: "simulators", title: "Money simulators", emoji: "🧪", summary: "Compound interest, emergency scenarios and more interactive simulations.", category: "investing", page: "/simulators" },
];
