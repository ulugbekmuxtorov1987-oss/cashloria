import { createFileRoute } from "@tanstack/react-router";
import { Guide } from "@/components/finly/Guide";
import { publicSeo } from "@/lib/seo";

const TITLE = "How to Budget: A Simple Monthly System That Sticks";
const DESC =
  "Build a monthly budget in four steps: count your income, list fixed costs, cap flexible spending, and pay savings first.";

export const Route = createFileRoute("/how-to-budget")({
  head: () => {
    const seo = publicSeo("/how-to-budget", TITLE, DESC, "article");
    return {
      meta: [
        { title: TITLE },
        { name: "description", content: DESC },
        { property: "og:title", content: TITLE },
        { property: "og:description", content: DESC },
        ...seo.meta,
      ],
      links: seo.links,
    };
  },
  component: () => (
    <Guide
      title="How to budget"
      intro={DESC}
      sections={[
        {
          heading: "Step 1 — Know your real income",
          body: ["Use take-home pay after tax and deductions. If your income varies, budget on your lowest recent month."],
        },
        {
          heading: "Step 2 — List fixed costs",
          body: ["Rent, utilities, transport, insurance, subscriptions, minimum debt payments. These are predictable and easiest to cut once a year."],
        },
        {
          heading: "Step 3 — Cap flexible spending",
          body: ["Food out, shopping, entertainment. Give each a monthly ceiling instead of tracking every receipt.", "The 50/30/20 rule (needs / wants / savings) is a good starting shape — adjust it to your rent."],
        },
        {
          heading: "Step 4 — Pay savings first",
          body: ["Automate a transfer on payday so saving isn't a decision you make when tired. Review the budget once a month, not every day."],
        },
      ]}
      faqs={[
        { q: "What if I overspend?", a: "Adjust next month's caps instead of abandoning the budget. Budgets are estimates you refine." },
        { q: "Which categories should I cut first?", a: "Recurring subscriptions and interest charges — they cost you every month without a decision." },
      ]}
    />
  ),
});
