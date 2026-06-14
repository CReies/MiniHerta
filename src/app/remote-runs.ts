import type { RawRun } from "../domain/types.js";
import { fetchJson } from "./json-file.js";

const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpYXQiOjE3NzU1MjUyNTgsImV4cCI6MTg5MzQ1NjAwMCwicm9sZSI6ImFub24iLCJpc3MiOiJzdXBhYmFzZSJ9.PMipr3UPfgIiO2KHvsBcW2OcF3hPTIcncvxoWZ5_qP4";

const RUNS_URL =
  "https://db.shingetsu.space/rest/v1/submissions?select=*&season=eq.4.3&mode=eq.aa&boss_name=eq.Skaracabaz";

export function fetchRemoteRuns(): Promise<RawRun[]> {
  return fetchJson<RawRun[]>(RUNS_URL, {
    headers: {
      accept: "*/*",
      "accept-profile": "public",
      apikey: SUPABASE_ANON_KEY,
      authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      "x-client-info": "supabase-js-web/2.104.1",
    },
  });
}
