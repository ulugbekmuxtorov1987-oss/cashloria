import { Link } from "@tanstack/react-router";
import { AppShell, Disclaimer } from "@/components/finly/AppShell";

export type GuideLink =
  | { to: "/learn/$lessonId"; lessonId: string; label: string }
  | { to: "/learn" | "/tools" | "/simulators" | "/library"; label: string };

export type GuideSection = { heading: string; body: string[]; links?: GuideLink[] };

export function Guide({
  title,
  intro,
  sections,
  faqs,
}: {
  title: string;
  intro: string;
  sections: GuideSection[];
  faqs: { q: string; a: string }[];
}) {
  return (
    <AppShell>
      <article className="mx-auto max-w-3xl">
        <h1 className="font-display text-3xl font-extrabold md:text-4xl">{title}</h1>
        <p className="mt-3 text-muted-foreground">{intro}</p>

        {sections.map((s) => (
          <section key={s.heading} className="mt-8">
            <h2 className="font-display text-xl font-bold">{s.heading}</h2>
            {s.body.map((p, i) => (
              <p key={i} className="mt-2 text-sm leading-relaxed">
                {p}
              </p>
            ))}
            {s.links && (
              <ul className="mt-3 space-y-1.5">
                {s.links.map((l) => (
                  <li key={l.label}>
                    {"lessonId" in l ? (
                      <Link
                        to="/learn/$lessonId"
                        params={{ lessonId: l.lessonId }}
                        className="text-sm font-semibold text-primary hover:underline"
                      >
                        {l.label} →
                      </Link>
                    ) : (
                      <Link to={l.to} className="text-sm font-semibold text-primary hover:underline">
                        {l.label} →
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </section>
        ))}

        <section className="mt-10">
          <h2 className="font-display text-xl font-bold">FAQ</h2>
          <div className="mt-3 space-y-3">
            {faqs.map((f) => (
              <div key={f.q} className="rounded-2xl border border-border bg-card p-4">
                <p className="font-semibold">{f.q}</p>
                <p className="mt-1 text-sm text-muted-foreground">{f.a}</p>
              </div>
            ))}
          </div>
        </section>

        <div className="mt-8 rounded-2xl bg-primary-soft p-5">
          <p className="font-display font-bold">Want to practice this?</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Link to="/learn" className="rounded-full bg-primary px-5 py-2.5 font-bold text-primary-foreground">
              Start a lesson
            </Link>
            <Link to="/tools" className="rounded-full border border-border bg-background px-5 py-2.5 font-bold">
              Open calculators
            </Link>
          </div>
        </div>

        <Disclaimer className="mt-8" />
      </article>
    </AppShell>
  );
}
