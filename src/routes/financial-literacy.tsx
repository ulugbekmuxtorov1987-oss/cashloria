import { createFileRoute } from "@tanstack/react-router";
import { Guide } from "@/components/finly/Guide";

const TITLE = "What Is Financial Literacy? A Plain-English Guide";
const DESC =
  "Financial literacy means understanding income, budgeting, saving, debt, investing and risk well enough to make confident money decisions.";

export const Route = createFileRoute("/financial-literacy")({
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
      title="What is financial literacy?"
      intro={DESC}
      sections={[
        {
          heading: "The core skills",
          body: [
            "Financial literacy is made of a handful of practical skills: knowing where your money goes, spending less than you earn, keeping a buffer for emergencies, understanding how interest works both for and against you, and investing patiently for long-term goals.",
            "None of these require advanced maths. They require repetition — which is exactly why Finly teaches them in short daily lessons.",
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
        },
      ]}
      faqs={[
        { q: "How long does it take to become financially literate?", a: "A few weeks of short daily lessons is enough to cover the basics; the habits take longer." },
        { q: "Do I need a lot of money to start?", a: "No. The skills matter most when money is tight, because every decision counts more." },
      ]}
    />
  ),
});
