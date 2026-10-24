import { Link } from "@tanstack/react-router";
import { AccountMenu } from "@/components/finly/AccountMenu";
import { SiteMeta } from "@/components/finly/SiteMeta";
import { BookOpen, Calculator, FlaskConical, GraduationCap, LayoutDashboard, Library, House , Target } from "lucide-react";
import type { ReactNode } from "react";
import { useProgress, rankFor } from "@/lib/finly/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { CountryCode, LanguageCode } from "@/lib/finly/types";
import { useSiteSettings } from "@/lib/site-content";
import { safeEmail, safeHttpUrl } from "@/lib/finly/safe-url";


const NAV = [
  { to: "/", label: "Home", icon: House },
  { to: "/learn", label: "Learn", icon: GraduationCap },
  { to: "/plan", label: "My plan", icon: Target },
  { to: "/simulators", label: "Simulators", icon: FlaskConical },
  { to: "/tools", label: "Tools", icon: Calculator },
  { to: "/library", label: "Library", icon: Library },
  { to: "/dashboard", label: "Progress", icon: LayoutDashboard },
] as const;

const COUNTRIES: { code: CountryCode; label: string }[] = [
  { code: "US", label: "🇺🇸 United States" },
  { code: "GB", label: "🇬🇧 United Kingdom" },
  { code: "UZ", label: "🇺🇿 Uzbekistan" },
];

const LANGUAGES: { code: LanguageCode; label: string; ready: boolean }[] = [
  { code: "en", label: "English", ready: true },
  { code: "uz", label: "Oʻzbekcha (soon)", ready: false },
  { code: "ru", label: "Русский (soon)", ready: false },
];

export function AppShell({ children }: { children: ReactNode }) {
  const { state, setCountry, setLanguage } = useProgress();
  const rank = rankFor(state.xp);
  const { data: settings } = useSiteSettings();
  const siteName = settings?.site_name?.trim() || "Finly";
  const contactEmail = safeEmail(settings?.contact_email);
  const socials = [
    { label: "Instagram", url: settings?.instagram_url },
    { label: "Telegram", url: settings?.telegram_url },
    ...(settings?.extra_links ?? []),
  ].flatMap((link) => {
    const url = safeHttpUrl(link.url);
    return link.label && url ? [{ label: link.label, url }] : [];
  });

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SiteMeta />
      <a href="#main-content" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-2 focus:z-50 focus:bg-card focus:p-3">Skip to content</a>
      <header className="sticky top-0 z-40 border-b border-border/70 bg-background/85 backdrop-blur">
        <div className="mx-auto grid min-h-18 w-full max-w-6xl grid-cols-[minmax(0,1fr)_auto] items-center gap-2 px-4 md:flex md:gap-3">
          <Link to="/" className="flex min-w-0 items-center gap-2.5 font-display text-xl font-extrabold">
            {settings?.logo_url ? (
              <img src={settings.logo_url} alt={`${siteName} logo`} className="h-8 w-8 rounded-xl object-cover" />
            ) : (
              <span className="grid h-8 w-8 place-items-center shrink-0 rounded-lg bg-primary text-primary-foreground">₣</span>
            )}
            <span className="truncate">{siteName}<span className="hidden text-[10px] font-semibold text-muted-foreground lg:block">LEARN MONEY. MASTERED.</span></span>
          </Link>


          <nav aria-label="Main navigation" className="ml-4 hidden items-center gap-0.5 md:flex">
            {NAV.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className="rounded-md px-2.5 py-3 text-sm font-semibold text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                activeProps={{ className: "bg-primary-soft text-foreground" }}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="ml-auto flex shrink-0 items-center gap-1.5">
            <span className="hidden items-center gap-1 rounded-md bg-streak-soft sm:flex px-2.5 py-1 text-xs font-bold text-streak">
              🔥 {state.streak.count}
            </span>
            <span className="flex items-center gap-1 rounded-md bg-accent-soft px-2.5 py-1 text-xs font-bold text-accent-foreground">
              ⭐ {state.xp}
            </span>
            <span className="hidden rounded-md bg-primary-soft px-2.5 py-1 text-xs font-bold lg:inline">
              {rank.emoji} {rank.name}
            </span>
            <AccountMenu />
          </div>
        </div>
      </header>

      <main id="main-content" className="mx-auto w-full min-w-0 max-w-6xl flex-1 px-4 pb-28 pt-8 md:pb-16 md:pt-10">{children}</main>

      <footer className="border-t border-border bg-card/60 pb-24 pt-8 md:pb-8">
        <div className="mx-auto grid w-full max-w-6xl gap-6 px-4 md:grid-cols-[1.4fr_1fr_1fr]">
          <div>
            <p className="font-display text-base font-bold">
              {siteName} — {settings?.site_description?.trim() || "learn money, one lesson a day"}
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              {siteName} provides general educational information about personal finance. It is <strong>not</strong>{" "}
              personalized financial, investment, tax or legal advice. Rules and products differ by country — always
              check official sources for your own situation and consider a qualified professional.
            </p>
            {(contactEmail || socials.length > 0) && (
              <p className="mt-3 flex flex-wrap gap-x-3 gap-y-1 text-sm text-muted-foreground">
                {contactEmail && (
                  <a href={`mailto:${contactEmail}`} className="hover:text-foreground">
                    {contactEmail}
                  </a>
                )}
                {socials.map((l) => (
                  <a
                    key={l.url}
                    href={l.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-foreground"
                  >
                    {l.label}
                  </a>
                ))}
              </p>
            )}
          </div>

          <div className="text-sm">
            <p className="mb-2 font-semibold">Guides</p>
            <ul className="space-y-1 text-muted-foreground">
              <li><Link to="/financial-literacy" className="hover:text-foreground">Financial literacy</Link></li>
              <li><Link to="/how-to-budget" className="hover:text-foreground">How to budget</Link></li>
              <li><Link to="/what-is-compound-interest" className="hover:text-foreground">Compound interest</Link></li>
              <li><Link to="/how-to-save-money" className="hover:text-foreground">How to save money</Link></li>
            </ul>
          </div>
          <div className="space-y-3 text-sm">
            <div>
              <p className="mb-1 font-semibold">Country</p>
              <Select value={state.country} onValueChange={(v) => setCountry(v as CountryCode)}>
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {COUNTRIES.map((c) => (
                    <SelectItem key={c.code} value={c.code}>{c.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <p className="mb-1 font-semibold">Language</p>
              <Select value={state.language} onValueChange={(v) => setLanguage(v as LanguageCode)}>
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {LANGUAGES.map((l) => (
                    <SelectItem key={l.code} value={l.code} disabled={!l.ready}>{l.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </footer>

      <nav aria-label="Mobile navigation" className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 backdrop-blur md:hidden">
        <div className="mx-auto flex max-w-lg items-stretch justify-between px-1 pb-[max(0.375rem,env(safe-area-inset-bottom))] pt-1.5">
          {NAV.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className="flex flex-1 flex-col items-center gap-0.5 min-h-12 min-w-0 rounded-lg px-0.5 py-1.5 text-[10px] font-semibold text-muted-foreground"
              activeProps={{ className: "bg-primary-soft text-foreground" }}
            >
              <item.icon className="h-5 w-5" />
              {item.label}
            </Link>
          ))}
        </div>
      </nav>
    </div>
  );
}

export function Disclaimer({ className = "" }: { className?: string }) {
  return (
    <p className={`flex gap-2 rounded-xl bg-muted px-3 py-2 text-xs text-muted-foreground ${className}`}>
      <BookOpen className="mt-0.5 h-4 w-4 shrink-0" />
      <span>Educational information only — not personalized financial, investment, tax or legal advice.</span>
    </p>
  );
}
