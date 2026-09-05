import { createFileRoute } from "@tanstack/react-router";
import { Guide } from "@/components/finly/Guide";
import { publicSeo } from "@/lib/seo";

const TITLE = "What Is Compound Interest? Examples and the Rule of 72";
const DESC =
  "Compound interest is interest earned on interest. See how it grows savings over time — and how it makes credit card debt expensive.";

export const Route = createFileRoute("/what-is-compound-interest")({
  head: () => {
    const seo = publicSeo("/what-is-compound-interest", TITLE, DESC, "article");
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
      title="What is compound interest?"
      intro={DESC}
      sections={[
        {
          heading: "Simple vs compound",
          body: [
            "Simple interest pays only on your original amount. Compound interest pays on your original amount plus all the interest already added, so growth accelerates.",
            "Save 1,000 at 7% a year: after 10 years you have about 1,967 — nearly double, without adding a cent.",
          ],
        },
        {
          heading: "The rule of 72",
          body: ["Divide 72 by the annual rate to estimate the years it takes money to double. At 6%, roughly 12 years. At 12%, roughly 6 years."],
        },
        {
          heading: "It works against you too",
          body: ["Credit cards compound monthly. A 22% APR balance grows fast when you only pay the minimum — which is why high-interest debt usually beats investing as a priority."],
        },
      ]}
      faqs={[
        { q: "Does frequency matter?", a: "Yes, but modestly. Monthly compounding beats annual at the same rate; the rate and the time horizon matter far more." },
        { q: "When should I start?", a: "As early as possible — years in the market matter more than the amount you start with." },
      ]}
    />
  ),
});
