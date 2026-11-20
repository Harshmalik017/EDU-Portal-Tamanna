import { buildProfile } from "@/lib/tamanna/profile";
import type { ReportLanguage, ReportStudent } from "@/lib/tamanna/report-language";
import { ReportMeanings } from "@/components/report/ReportMeanings";
import { ReportRemarks } from "@/components/report/ReportRemarks";
import { ReportSummary } from "@/components/report/ReportSummary";

/** A 3-page personal report. Content comes only from the Tamanna booklet. */
export function ReportPages({ s, language = "en" }: { s: ReportStudent; language?: ReportLanguage }) {
  const profile = buildProfile(s);
  return <>
    <ReportSummary student={s} language={language} profile={profile} />
    <ReportMeanings student={s} language={language} profile={profile} />
    <ReportRemarks student={s} language={language} profile={profile} />
  </>;
}
