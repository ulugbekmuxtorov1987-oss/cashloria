import { createFileRoute } from "@tanstack/react-router";
import { Guide } from "@/components/finly/Guide";

const TITLE = "How to Save Money: Practical Habits That Actually Work";
const DESC =
  "Save more by automating transfers, building an emergency fund, cutting recurring costs and using a 24-hour rule on impulse buys.";

export const Route = createFileRoute("/how-to-save-money")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESC },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESC },
    ],
  }),
  component: () => (
    <Guide
      title="How to save money"
      intro={DESC}
      sections={[
        {
          heading: "Automate before you decide",
          body: ["Set a transfer to savings for the day after payday. Money you never see in your spending account is money you rarely miss."],
        },
        {
          heading: "Build the emergency fund first",
          body: ["Aim for one month of essential expenses, then three, then six. It's what stops a surprise bill from turning into expensive debt."],
        },
        {
          heading: "Attack recurring costs",
          body: ["A subscription audit, a cheaper phone plan and an insurance re-quote take one afternoon and keep paying you every month."],
        },
        {
          heading: "Slow down impulse buys",
          body: ["Put non-essential purchases over a set amount on a 24-hour wait. Most urges fade; the ones that don't are usually worth it."],
        },
      ]}
      faqs={[
        { q: "How much should I save each month?", a: "Start with any amount you can keep up. 20% of take-home pay is a good target once your essentials are covered." },
        { q: "Save or pay off debt first?", a: "Keep a small emergency buffer, then prioritise debt with interest higher than your savings rate." },
      ]}
    />
  ),
});
