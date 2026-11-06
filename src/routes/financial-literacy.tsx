import { createFileRoute } from "@tanstack/react-router";
import { Guide } from "@/components/finly/Guide";
import { publicSeo } from "@/lib/seo";

const TITLE = "What Is Financial Literacy? A Plain-English Guide";
const DESC =
  "Financial literacy means understanding income, budgeting, saving, debt, investing and risk well enough to make confident money decisions.";

export const Route = createFileRoute("/financial-literacy")({
  head: () => {
    const seo = publicSeo("/financial-literacy", TITLE, DESC, "article");
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
      title="What is financial literacy?"
      intro={DESC}
      sections={[
        {
          heading: "The core skills",
          body: [
            "Financial literacy is made of a handful of practical skills: knowing where your money goes, spending less than you earn, keeping a buffer for emergencies, understanding how interest works both for and against you, and investing patiently for long-term goals.",
            "None of these require advanced maths. They require repetition — which is exactly why Cashloria teaches them in short daily lessons.",
          ],
        },
        {
          heading: "Budgeting and saving",
          body: [
            "A budget is simply a plan that gives every unit of income a job before the month begins. Start by separating needs from wants, then track one full month of spending to find the hidden leaks — small recurring charges usually matter more than occasional big ones.",
            "Saving works best when it is automatic and small: a fixed transfer on payday beats an occasional large deposit, because it removes the decision. An emergency fund of three to six months of essential expenses is the first goal, because it turns a surprise bill from a crisis into an inconvenience.",
          ],
          links: [
            { to: "/learn/$lessonId", lessonId: "budgeting", label: "Lesson: Budgeting" },
            { to: "/learn/$lessonId", lessonId: "emergency-funds", label: "Lesson: Emergency Funds" },
            { to: "/tools", label: "Try the 50/30/20 budget calculator" },
          ],
        },
        {
          heading: "Debt and credit",
          body: [
            "Interest is the price of borrowing, and it compounds against you just as it compounds for you when you invest. Making only minimum payments on a credit card can stretch a small balance into years of repayments, so the most expensive debt — usually the highest interest rate — deserves the first extra payment.",
            "Your credit history follows you across lenders. Keeping utilisation low and paying on time are the two habits that matter most, and both are free.",
          ],
          links: [
            { to: "/learn/$lessonId", lessonId: "debt", label: "Lesson: Debt" },
            { to: "/learn/$lessonId", lessonId: "credit", label: "Lesson: Credit" },
            { to: "/tools", label: "Compare debt payoff strategies" },
          ],
        },
        {
          heading: "Investing and risk",
          body: [
            "Compound growth rewards time more than timing: starting earlier with smaller amounts usually beats starting later with larger ones. Inflation quietly erodes cash, which is why long-term money needs to grow faster than prices rise.",
            "Risk is managed, not avoided. Diversification — spreading money across different assets — means one bad outcome cannot sink the whole plan.",
          ],
          links: [
            { to: "/learn/$lessonId", lessonId: "compound-interest", label: "Lesson: Compound Interest" },
            { to: "/learn/$lessonId", lessonId: "diversification", label: "Lesson: Diversification" },
            { to: "/simulators", label: "Run the compound growth simulator" },
          ],
        },
        {
          heading: "Why it matters",
          body: [
            "People who understand compound interest, credit costs and diversification tend to carry less expensive debt and save more consistently. The gap usually comes from habits, not intelligence.",
          ],
        },
        {
          heading: "How to get started",
          body: [
            "Track one month of spending, write down every debt with its interest rate, then set a small automatic transfer to savings on payday. Those three actions cover most of the beginner curriculum.",
          ],
          links: [{ to: "/learn", label: "Start the full learning path" }],
        },
      ]}
      faqs={[
        { q: "How long does it take to become financially literate?", a: "A few weeks of short daily lessons is enough to cover the basics; the habits take longer." },
        { q: "Do I need a lot of money to start?", a: "No. The skills matter most when money is tight, because every decision counts more." },
      ]}
    />
  ),
});
