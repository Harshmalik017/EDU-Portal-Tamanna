import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Box, Calculator, Cog, Languages, LogIn, MessageSquareText, ScanEye, Shapes, type LucideIcon } from "lucide-react";
import { Card } from "@/components/ui";
import { VersionBadge } from "@/components/VersionBadge";
import { ACRONYM, ADMIN_POINTS, CAREER_EXAMPLES, CAUTIONS, COMPONENTS, CREDITS, EXAMPLE, FACTS, HELPS, LEVELS, MATERIALS, SCORING_STEPS, SUBTESTS } from "@/lib/tamanna/program";

export const metadata: Metadata = {
  title: "Tamanna: Aptitude Test for Senior School Students",
  description: "Tamanna: NCERT aptitude test for Classes IX and X. Seven sub-tests, Sten scores and aptitude profiles.",
};

const ICONS: Record<string, LucideIcon> = { LA: Languages, AR: Shapes, VR: MessageSquareText, MR: Cog, NA: Calculator, SA: Box, PA: ScanEye };
const NAV = [["about", "About"], ["subtests", "Sub-tests"], ["conduct", "Conduct"], ["scoring", "Scoring"], ["schools", "Schools"]] as const;
const H2 = "mb-4 text-2xl font-bold sm:text-3xl";
const toneOf = (s: number) => (s <= 3 ? "bg-amber-500" : s <= 7 ? "bg-sky-600" : "bg-green-600");
const levelOf = (s: number) => (s <= 3 ? "Low" : s <= 7 ? "Average" : "High");

export default function Landing() {
  const list = (items: string[]) => (
    <ul className="space-y-2 text-sm">
      {items.map((t) => (
        <li key={t} className="flex gap-2.5">
          <span aria-hidden className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-brand-600" />
          <span>{t}</span>
        </li>
      ))}
    </ul>
  );

  return (
    <main className="mx-auto max-w-6xl space-y-8 px-4 py-4 sm:space-y-10 sm:py-6">
      <header className="clay sticky top-3 z-30 px-4 py-2.5 sm:px-5 sm:py-3">
        <div className="flex items-center justify-between gap-3">
          <Link href="/" aria-label="Tamanna home" className="shrink-0">
            <Image src="/brand/logo.png" alt="Tamanna" width={120} height={26} priority />
          </Link>
          <nav className="hidden items-center gap-1 md:flex" aria-label="Page sections">
            {NAV.map(([id, label]) => (
              <a key={id} href={`#${id}`} className="rounded-xl px-3.5 py-2 text-sm font-semibold text-ink/85 transition hover:bg-brand-100/70 hover:text-brand-700">
                {label}
              </a>
            ))}
          </nav>
          <Link href="/login" className="clay-btn !min-h-10 shrink-0 !px-4 !py-2">
            <LogIn size={18} /> Login
          </Link>
        </div>
        <nav aria-label="Page sections" className="mt-2.5 flex items-center gap-1.5 overflow-x-auto border-t border-(--line) pt-2 md:hidden">
          {NAV.map(([id, label]) => (
            <a key={id} href={`#${id}`} className="shrink-0 rounded-lg bg-brand-50 px-3 py-1.5 text-xs font-semibold text-brand-700 hover:bg-brand-100">
              {label}
            </a>
          ))}
        </nav>
      </header>

      <section className="grid items-center gap-6 md:grid-cols-2 lg:gap-10">
        <div className="space-y-4">
          <p className="inline-block rounded-full bg-brand-100 px-3 py-1 text-xs font-bold text-brand-700">
            NCERT Aptitude Test · Classes IX &amp; X
          </p>
          <h1 className="text-4xl font-bold leading-tight sm:text-5xl">Know your strengths.</h1>
          <p className="text-base font-semibold sm:text-lg" aria-label="Try And Measure Aptitude And Natural Abilities">
            {ACRONYM.map(([f, r], i) => (
              <span key={i} className="mr-2 inline-block">
                <b className="text-xl text-brand-600 sm:text-2xl">{f}</b>{r}
              </span>
            ))}
          </p>
          <p className="max-w-lg text-sm leading-relaxed text-ink/85 sm:text-base">
            Measures seven natural aptitudes to help students, parents and teachers make informed subject and career choices.
          </p>
          <div className="flex flex-wrap gap-3 pt-1">
            <Link href="/login" className="clay-btn"><LogIn size={18} /> Open portal</Link>
            <a href="#subtests" className="clay-btn-soft">View 7 sub-tests</a>
          </div>
        </div>
        <Card className="overflow-hidden !p-3">
          <Image
            src="/brand/art.webp"
            alt="Student aptitude illustration showing strengths, planning, subjects and careers"
            width={760}
            height={725}
            sizes="(min-width: 768px) 520px, 100vw"
            priority
            className="h-auto w-full rounded-xl"
          />
        </Card>
      </section>

      <section className="grid grid-cols-2 gap-4 sm:grid-cols-4" aria-label="Key facts">
        {FACTS.map((f, i) => {
          const tones = ["border-amber-300 bg-amber-50", "border-sky-300 bg-sky-50", "border-green-300 bg-green-50", "border-violet-300 bg-violet-50"];
          return (
            <Card key={f.label} className={`!p-4 text-center ${tones[i % tones.length]}`}>
              <p className="text-xl font-bold text-brand-700 sm:text-2xl">{f.value}</p>
              <p className="mt-0.5 text-xs font-medium sm:text-sm">{f.label}</p>
            </Card>
          );
        })}
      </section>

      <section id="about" className="scroll-mt-24 space-y-5">
        <h2 className={H2}>About Tamanna</h2>
        <div className="grid gap-5 lg:grid-cols-2">
          <Card title="What is aptitude?" className="h-full">
            <p className="text-sm leading-relaxed">
              Aptitude is the natural ability to learn a skill in a specific area. It shows where a student is likely to succeed with training.
            </p>
            <p className="mt-3 text-sm leading-relaxed">
              Developed by NCERT and piloted by CBSE across affiliated schools for Classes IX and X.
            </p>
          </Card>
          <Card title="How results help" className="h-full">{list(HELPS)}</Card>
        </div>
        <div className="grid gap-5 md:grid-cols-3">
          {COMPONENTS.map((c) => (
            <Card key={c.title} title={c.title} className="h-full">
              <p className="text-sm">{c.text}</p>
            </Card>
          ))}
        </div>
      </section>

      <section id="subtests" className="scroll-mt-24 space-y-5">
        <h2 className={H2}>Seven sub-tests</h2>
        <div className="grid gap-4 md:grid-cols-2">
          {SUBTESTS.map((s, i) => {
            const Icon = ICONS[s.code];
            const colors = ["text-amber-700 bg-amber-100", "text-sky-700 bg-sky-100", "text-green-700 bg-green-100", "text-violet-700 bg-violet-100", "text-rose-700 bg-rose-100", "text-teal-700 bg-teal-100", "text-indigo-700 bg-indigo-100"];
            const isLastOdd = i === SUBTESTS.length - 1 && SUBTESTS.length % 2 === 1;
            return (
              <Card key={s.code} className={`h-full space-y-2 ${isLastOdd ? "md:col-span-2" : ""}`}>
                <div className="flex items-center gap-3">
                  <div className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${colors[i % colors.length]}`}>
                    <Icon size={20} />
                  </div>
                  <div>
                    <h3 className="font-bold">{s.name} ({s.code})</h3>
                    <p className="text-xs text-ink/70">{s.items} items · 10 minutes</p>
                  </div>
                </div>
                <p className="text-sm font-medium">{s.measures}</p>
                <p className="text-sm"><b>Questions:</b> {s.format}</p>
                <p className="text-sm"><b>Fields:</b> {s.areas}</p>
              </Card>
            );
          })}
        </div>
      </section>

      <section id="conduct" className="scroll-mt-24 space-y-5">
        <h2 className={H2}>Conducting the test</h2>
        <div className="grid gap-5 lg:grid-cols-2">
          <Card title="Test rules" className="h-full">{list(ADMIN_POINTS)}</Card>
          <Card title="Materials needed" className="h-full">{list(MATERIALS)}</Card>
        </div>
      </section>

      <section id="scoring" className="scroll-mt-24 space-y-5">
        <h2 className={H2}>Scoring</h2>
        <div className="grid gap-5 lg:grid-cols-2">
          <Card title="Steps" className="h-full space-y-4">
            <ol className="space-y-2.5">
              {SCORING_STEPS.map((t, i) => (
                <li key={t} className="flex items-center gap-3">
                  <span className="clay-inset grid h-7 w-7 shrink-0 place-items-center text-xs font-bold">{i + 1}</span>
                  <span className="text-sm">{t}</span>
                </li>
              ))}
            </ol>
            <div className="flex flex-wrap gap-2 pt-1">
              {LEVELS.map((l) => (
                <span key={l.band} className={`rounded-full px-3 py-1 text-xs font-semibold ${l.tone}`}>
                  {l.band}: {l.range}
                </span>
              ))}
            </div>
          </Card>
          <Card title={`Example: Roll ${EXAMPLE.roll}`} description={EXAMPLE.detail} className="h-full">
            <ul className="space-y-2.5">
              {EXAMPLE.rows.map((r) => (
                <li key={r.code} className="flex items-center gap-3 text-sm">
                  <span className="w-7 font-bold">{r.code}</span>
                  <div className="clay-inset h-4 flex-1 overflow-hidden" role="img" aria-label={`${r.code}: score ${r.score}, Sten ${r.sten}, ${levelOf(r.sten)}`}>
                    <div className={`h-full ${toneOf(r.sten)}`} style={{ width: `${r.sten * 10}%` }} />
                  </div>
                  <span className="w-32 text-right text-xs font-medium">{r.score} · Sten {r.sten} · {levelOf(r.sten)}</span>
                </li>
              ))}
            </ul>
          </Card>
        </div>
        <div className="grid gap-5 lg:grid-cols-2">
          <Card title="Careers linked to aptitudes" className="h-full">
            <ul className="grid gap-2 sm:grid-cols-2">
              {CAREER_EXAMPLES.map(([o, a]) => (
                <li key={o} className="clay-inset px-3 py-2 text-sm">
                  <b>{o}</b> <span className="text-xs text-ink/75">({a})</span>
                </li>
              ))}
            </ul>
          </Card>
          <Card title="Use scores with care" className="h-full">{list(CAUTIONS)}</Card>
        </div>
      </section>

      <section id="schools" className="scroll-mt-24 space-y-5">
        <h2 className={H2}>In schools</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            ["1. Scan", "Scan both sides of the answer sheet.", "border-amber-300"],
            ["2. Score", "Convert raw marks to Sten scores using norms.", "border-sky-300"],
            ["3. Verify", "Hand-check batches of 10–20 sheets.", "border-violet-300"],
            ["4. Report", "Print the 3-page report by roll number.", "border-green-300"],
          ].map(([t, d, c]) => (
            <Card key={t} title={t} className={`h-full ${c}`}>
              <p className="text-sm">{d}</p>
            </Card>
          ))}
        </div>
        <Card className="flex flex-wrap items-center justify-between gap-2 text-sm">
          <p>Scoring key requests (Principals): <b>{CREDITS.key}</b></p>
          <p className="text-xs text-ink/75">Guide: {CREDITS.authors.join(", ")} · Foreword: {CREDITS.foreword}</p>
        </Card>
      </section>

      <footer className="space-y-3 pt-2">
        <div className="clay-inset px-5 py-3.5 text-center text-sm">
          Tamanna is an NCERT programme. All scores and reports follow the Guide for Teachers and Parents.
        </div>
        <p className="text-center text-sm">
          © 2026 <a href="https://www.linkedin.com/in/harshmalik017" target="_blank" rel="noopener noreferrer" className="font-bold underline">Developer Details</a>, All Rights Reserved.
        </p>
        <VersionBadge />
      </footer>
    </main>
  );
}
