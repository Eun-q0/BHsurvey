import { env } from "cloudflare:workers";

type RuntimeEnv = Cloudflare.Env & { ADMIN_PASSWORD?: string };

export function getD1() {
  const database = (env as RuntimeEnv).DB;
  if (!database) throw new Error("설문 저장소를 사용할 수 없습니다.");
  return database;
}

export function getAdminPassword() {
  return (env as RuntimeEnv).ADMIN_PASSWORD?.trim() ?? "";
}
