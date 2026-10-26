import { version } from "../package.json";

export function VersionBadge() {
  return <p className="print:hidden py-6 text-center text-xs font-semibold text-ink/80">Tamanna Portal v{version}</p>;
}
