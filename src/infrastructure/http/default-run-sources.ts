import type { RunsRepository } from "../../app/ports.js";
import { HttpRunsRepository } from "./runs-repository.js";

const supabaseAnonKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpYXQiOjE3NzU1MjUyNTgsImV4cCI6MTg5MzQ1NjAwMCwicm9sZSI6ImFub24iLCJpc3MiOiJzdXBhYmFzZSJ9.PMipr3UPfgIiO2KHvsBcW2OcF3hPTIcncvxoWZ5_qP4";

const remoteRunsUrl =
  "https://db.shingetsu.space/rest/v1/submissions?select=*&season=eq.4.3&mode=eq.aa&boss_name=eq.Skaracabaz";

export function createDefaultRunsRepositories(): RunsRepository[] {
  return [
    new HttpRunsRepository("scrapped.json"),
    new HttpRunsRepository(remoteRunsUrl, {
      headers: {
        accept: "*/*",
        "accept-profile": "public",
        apikey: supabaseAnonKey,
        authorization: `Bearer ${supabaseAnonKey}`,
        "x-client-info": "supabase-js-web/2.104.1",
      },
    }),
  ];
}
