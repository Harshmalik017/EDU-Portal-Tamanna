import { makeClient, type Exec } from "./builder";

/** Browser side: sends each query to /api/demo, which runs it against the server's demo data. */
const exec: Exec = async (q) => {
  const res = await fetch("/api/demo", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(q) });
  return res.ok ? res.json() : { data: null, error: { message: "Demo data is not available" } };
};
export const createDemoBrowserClient = () => makeClient(exec);
export async function resetDemo() { await fetch("/api/demo", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ reset: true }) }); }
