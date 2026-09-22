import { getD1 } from "@/db";

const allowed = ["부적절한 내용", "개인정보 요구", "광고 또는 홍보", "장난성 설문", "기타"];

export async function POST(request: Request) {
  try {
    const payload = await request.json() as { survey_id?: string; reason?: string; description?: string };
    const surveyId = payload.survey_id?.trim() ?? "";
    const reason = payload.reason?.trim() ?? "";
    const description = payload.description?.trim().slice(0, 1000) ?? "";
    if (!surveyId || !allowed.includes(reason)) return Response.json({ error: "신고 사유를 확인해주세요." }, { status: 400 });
    const db = getD1();
    const exists = await db.prepare("SELECT id FROM surveys WHERE id = ? AND approval_status = 'approved'").bind(surveyId).first();
    if (!exists) return Response.json({ error: "신고할 설문을 찾지 못했습니다." }, { status: 404 });
    await db.prepare("INSERT INTO reports (id, survey_id, reason, description, created_at) VALUES (?, ?, ?, ?, ?)").bind(crypto.randomUUID(), surveyId, reason, description, new Date().toISOString()).run();
    return Response.json({ ok: true }, { status: 201 });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "신고를 접수하지 못했습니다." }, { status: 500 });
  }
}
