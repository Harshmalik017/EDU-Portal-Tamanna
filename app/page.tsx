import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Box, Calculator, Cog, Languages, LogIn, MessageSquareText, ScanEye, Shapes, type LucideIcon } from "lucide-react";
import { Card } from "@/components/ui";
import { VersionBadge } from "@/components/VersionBadge";
import { ACRONYM, ADMIN_POINTS, CAREER_EXAMPLES, CAUTIONS, COMPONENTS, CREDITS, EXAMPLE, FACTS, HELPS, LEVELS, MATERIALS, SCORING_STEPS, SUBTESTS } from "@/lib/tamanna/program";

export const metadata: Metadata = {
  title: "Tamanna: An Aptitude Test for Senior School Students",
  description: "Tamanna: an NCERT aptitude test for classes IX and X. Seven sub-tests, Sten scores and an aptitude profile.",
};

const ICONS: Record<string, LucideIcon> = { LA: Languages, AR: Shapes, VR: MessageSquareText, MR: Cog, NA: Calculator, SA: Box, PA: ScanEye };
const NAV = [["about", "About"], ["subtests", "Sub-tests"], ["conduct", "Conducting"], ["scoring", "Scoring"], ["schools", "In schools"]];
const H2 = "mb-4 text-2xl font-bold sm:text-3xl";
const toneOf = (s: number) => (s <= 3 ? "bg-amber-500" : s <= 7 ? "bg-sky-600" : "bg-green-600");
const levelOf = (s: number) => (s <= 3 ? "Low" : s <= 7 ? "Average" : "High");

/** Section menu: a sticky left rail on large screens, a scrollable chip row on small ones. */
function Rail() {
  return (
    <>
      <nav aria-label="On this page" className="sticky top-6 hidden self-start lg:block">
        <p className="mb-3 px-3 text-xs font-bold uppercase tracking-wider text-ink/70">On this page</p>
        <ul className="space-y-1">{NAV.map(([id, label]) => <li key={id}><a href={`#${id}`} className="block rounded-xl px-3 py-2 text-sm font-semibold hover:bg-brand-50">{label}</a></li>)}</ul>
      </nav>
      <nav aria-label="On this page" className="-mx-1 mb-2 flex gap-2 overflow-x-auto px-1 pb-2 lg:hidden">
        {NAV.map(([id, label]) => <a key={id} href={`#${id}`} className="clay-btn-soft shrink-0 !min-h-9 !px-4 !py-1.5">{label}</a>)}
      </nav>
    </>
  );
}

export default function Landing() {
  const list = (items: string[]) => <ul className="space-y-2 text-sm">{items.map((t) => <li key={t} className="flex gap-2"><span aria-hidden className="mt-2 h-2 w-2 shrink-0 rounded-full bg-brand-600" />{t}</li>)}</ul>;
  return (
    <main className="mx-auto max-w-6xl px-4 py-6 sm:py-10">
      <header className="clay flex flex-wrap items-center justify-between gap-3 px-5 py-3">
        <Image src="/brand/logo.png" alt="Tamanna" width={120} height={26} priority />
        <nav className="hidden items-center gap-1 lg:flex" aria-label="Page sections">
          {NAV.map(([id, label]) => <a key={id} href={`#${id}`} className="rounded-xl px-3 py-2 text-sm font-semibold hover:bg-brand-50">{label}</a>)}
        </nav>
        <Link href="/login" className="clay-btn"><LogIn size={18} /> Admin login</Link>
      </header>

      <div className="mt-6 lg:grid lg:grid-cols-[12rem_minmax(0,1fr)] lg:gap-10">
        <Rail />
        <div>
          <section className="grid items-center gap-8 py-8 md:grid-cols-2 md:py-12">
            <div>
              <p className="mb-2 text-sm font-bold text-brand-700">An Aptitude Test for Senior School Students</p>
              <h1 className="text-4xl font-bold leading-tight sm:text-5xl">Know your strengths.</h1>
              <p className="mt-4 text-lg font-semibold" aria-label="Try And Measure Aptitude And Natural Abilities">
                {ACRONYM.map(([f, r], i) => <span key={i} className="mr-2 inline-block"><b className="text-2xl text-brand-600">{f}</b>{r}</span>)}
              </p>
              <p className="mt-4 max-w-md text-ink/85">An NCERT test for classes IX and X that measures seven aptitudes to guide subject and career choices.</p>
            </div>
            <Card className="overflow-hidden !p-3">
              <Image src="/brand/art.webp" alt="Head with gears surrounded by arrows labelled strengths, decisions, planning, careers, subjects and choices" width={760} height={725} sizes="(min-width: 768px) 520px, 100vw" priority className="h-auto w-full rounded-xl" />
            </Card>
          </section>

          <section className="grid grid-cols-2 gap-4 sm:grid-cols-4" aria-label="Key facts">
            {FACTS.map((f, i) => {
              const tones = ["border-amber-300 bg-amber-50", "border-sky-300 bg-sky-50", "border-green-300 bg-green-50", "border-violet-300 bg-violet-50"];
              return <Card key={f.label} className={`text-center !p-4 ${tones[i % tones.length]}`}><p className="text-xl font-bold text-brand-700">{f.value}</p><p className="text-sm">{f.label}</p></Card>;
            })}
          </section>

          <section id="about" className="scroll-mt-6 pt-14">
            <h2 className={H2}>What is aptitude?</h2>
            <div className="grid gap-5 lg:grid-cols-2">
              <Card><p>Aptitude is the ability to acquire a skill or knowledge in a particular area. It shows how likely a student is to do well in a course or occupation.</p>
                <p className="mt-3">Knowing it helps students, parents and schools make informed educational and career choices.</p></Card>
              <Card title="Results help students">{list(HELPS)}</Card>
            </div>
            <div className="mt-5 grid gap-5 md:grid-cols-3">{COMPONENTS.map((c) => <Card key={c.title} title={c.title}><p className="text-sm">{c.text}</p></Card>)}</div>
            <p className="mt-4 text-sm">Developed by NCERT and piloted by CBSE in its affiliated schools.</p>
          </section>

          <section id="subtests" className="scroll-mt-6 pt-14">
            <h2 className={H2}>Sub-tests</h2>
            <div className="grid gap-5 md:grid-cols-2">
              {SUBTESTS.map((s, i) => { const Icon = ICONS[s.code]; const colors = ["text-amber-700 bg-amber-100", "text-sky-700 bg-sky-100", "text-green-700 bg-green-100", "text-violet-700 bg-violet-100", "text-rose-700 bg-rose-100", "text-teal-700 bg-teal-100", "text-indigo-700 bg-indigo-100"]; return (
                <Card key={s.code} className="space-y-2">
                  <div className="flex items-center gap-3"><div className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl ${colors[i % colors.length]}`}><Icon size={22} /></div>
                    <div><h3 className="font-bold">{s.name} ({s.code})</h3><p className="text-xs">{s.items} items</p></div></div>
                  <p className="text-sm font-medium">{s.measures}</p>
                  <p className="text-sm"><b>Items:</b> {s.format}</p>
                  <p className="text-sm"><b>Related:</b> {s.areas}</p>
                </Card>); })}
            </div>
          </section>

          <section id="conduct" className="scroll-mt-6 pt-14">
            <h2 className={H2}>Conducting the test</h2>
            <div className="grid gap-5 lg:grid-cols-2">
              <Card title="Procedure">{list(ADMIN_POINTS)}</Card>
              <Card title="Materials">{list(MATERIALS)}</Card>
            </div>
          </section>

          <section id="scoring" className="scroll-mt-6 pt-14">
            <h2 className={H2}>Scoring</h2>
            <div className="grid gap-5 lg:grid-cols-2">
              <Card className="space-y-4">
                <ol className="space-y-3">{SCORING_STEPS.map((t, i) => <li key={t} className="flex gap-3"><span className="clay-inset grid h-8 w-8 shrink-0 place-items-center text-sm font-bold">{i + 1}</span><span className="pt-1 text-sm">{t}</span></li>)}</ol>
                <div className="flex flex-wrap gap-2">{LEVELS.map((l) => <span key={l.band} className={`rounded-full px-3 py-1 text-xs font-semibold ${l.tone}`}>{l.band}: {l.range}</span>)}</div>
              </Card>
              <Card title={`Example: ${EXAMPLE.name}`} description={EXAMPLE.detail}>
                <ul className="space-y-2">{EXAMPLE.rows.map((r) => (
                  <li key={r.code} className="flex items-center gap-3 text-sm">
                    <span className="w-7 font-bold">{r.code}</span>
                    <div className="clay-inset h-4 flex-1 overflow-hidden" role="img" aria-label={`${r.code}: score ${r.score}, Sten ${r.sten}, ${levelOf(r.sten)}`}><div className={`h-full ${toneOf(r.sten)}`} style={{ width: `${r.sten * 10}%` }} /></div>
                    <span className="w-28 text-right text-xs">{r.score} · Sten {r.sten} · {levelOf(r.sten)}</span>
                  </li>))}</ul>
              </Card>
            </div>
            <div className="mt-5 grid gap-5 lg:grid-cols-2">
              <Card title="Careers linked to aptitudes"><ul className="grid gap-2 sm:grid-cols-2">{CAREER_EXAMPLES.map(([o, a]) => <li key={o} className="clay-inset px-3 py-2 text-sm"><b>{o}</b> <span className="text-xs">({a})</span></li>)}</ul></Card>
              <Card title="Use scores with care">{list(CAUTIONS)}</Card>
            </div>
          </section>

          <section id="schools" className="scroll-mt-6 py-14">
            <h2 className={H2}>In schools</h2>
            <p className="mb-5 text-sm">This portal scores and reports Tamanna for schools, following the guide.</p>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {[["Scan", "Read both sides of the answer sheet.", "border-amber-300"], ["Score", "Sten scores from the class and gender norms.", "border-sky-300"], ["Report", "A 3-page report for each student.", "border-green-300"], ["Verify", "Check each batch of 10-20 by hand.", "border-violet-300"]].map(([t, d, c]) => (
                <Card key={t} title={t} className={c}><p className="text-sm">{d}</p></Card>))}
            </div>
            <Card className="mt-5 space-y-1 text-sm">
              <p>Principals can request the scoring key at <b>{CREDITS.key}</b>.</p>
              <p>Guide by {CREDITS.authors.join(", ")}. Foreword: {CREDITS.foreword}.</p>
            </Card>
          </section>
        </div>
      </div>

      <footer className="clay-inset px-5 py-4 text-center text-sm">Tamanna is an NCERT programme. Scores and reports here follow its Guide for Teachers and Parents.</footer>
      <p className="px-4 pt-4 text-center text-sm">© 2026 <a href="https://www.linkedin.com/in/harshmalik017" target="_blank" rel="noopener noreferrer" className="font-bold underline">Developer Details</a>, All Rights Reserved.</p>
      <VersionBadge />
    </main>
  );
}
