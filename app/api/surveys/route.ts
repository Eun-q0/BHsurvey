import { getAdminPassword, getD1 } from "@/db";
import { categories, sampleSurveys, type Survey } from "@/lib/surveys";

const publicCategories = categories.filter((item) => item !== "전체");

function clean(value: unknown, max = 4000) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

function isAdmin(request: Request) {
  const expected = getAdminPassword();
  return Boolean(expected) && request.headers.get("x-admin-password") === expected;
}

function createManagementCode() {
  const letters = "ABCDEFGHJKLMNPQRSTUVWXYZ";
  const values = crypto.getRandomValues(new Uint8Array(4));
  const prefix = Array.from(values.slice(0, 4), (value) => letters[value % letters.length]).join("");
  const number = String(crypto.getRandomValues(new Uint16Array(1))[0] % 10000).padStart(4, "0");
  return `${prefix}-${number}`;
}

async function seedIfEmpty(db: D1Database) {
  const count = await db.prepare("SELECT COUNT(*) AS count FROM surveys").first<{ count: number }>();
  if ((count?.count ?? 0) > 0) return;
  const statements = sampleSurveys.map((survey, index) => db.prepare(`
    INSERT OR IGNORE INTO surveys (
      id, title, short_description, background, purpose, target, duration, deadline,
      usage_plan, category, naver_form_url, author_grade, author_student_id, author_name, author_display,
      management_code, manual_status, approval_status, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(
    survey.id, survey.title, survey.short_description, survey.background, survey.purpose,
    survey.target, survey.duration, survey.deadline, survey.usage_plan, survey.category,
    survey.naver_form_url, survey.author_grade, survey.author_student_id, survey.author_name, survey.author_display, `SAMP-${String(index + 1).padStart(4, "0")}`,
    survey.manual_status, survey.approval_status, survey.created_at, survey.updated_at,
  ));
  await db.batch(statements);
}

export async function GET(request: Request) {
  try {
    const db = getD1();
    const url = new URL(request.url);
    const code = clean(url.searchParams.get("code"), 20).toUpperCase();

    if (code) {
      const survey = await db.prepare("SELECT * FROM surveys WHERE management_code = ? LIMIT 1").bind(code).first<Survey>();
      return survey ? Response.json({ survey }) : Response.json({ error: "관리 코드와 일치하는 설문이 없습니다." }, { status: 404 });
    }

    if (url.searchParams.get("admin") === "1") {
      if (!isAdmin(request)) return Response.json({ error: "관리자 비밀번호가 올바르지 않습니다." }, { status: 401 });
      const [surveyRows, reportRows] = await Promise.all([
        db.prepare(`SELECT s.*, COUNT(r.id) AS reports_count FROM surveys s LEFT JOIN reports r ON r.survey_id = s.id GROUP BY s.id ORDER BY s.created_at DESC`).all(),
        db.prepare(`SELECT r.*, s.title AS survey_title FROM reports r JOIN surveys s ON s.id = r.survey_id ORDER BY r.created_at DESC`).all(),
      ]);
      return Response.json({ surveys: surveyRows.results, reports: reportRows.results });
    }

    const rows = await db.prepare("SELECT * FROM surveys WHERE approval_status = 'approved' AND id NOT LIKE 'sample-%' ORDER BY created_at DESC").all<Survey>();
    return Response.json({ surveys: rows.results.map(({ management_code, ...survey }) => survey) });
  } catch (error) {
    const message = error instanceof Error ? error.message : "설문을 불러오지 못했습니다.";
    return Response.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const payload = await request.json() as Record<string, unknown>;
    const submittedAuthors = Array.isArray(payload.authors) ? payload.authors.slice(0, 8) : [{ student_id: payload.author_student_id, name: payload.author_name }];
    const authors = submittedAuthors.map((entry) => {
      const author = typeof entry === "object" && entry !== null ? entry as Record<string, unknown> : {};
      return {
        student_id: clean(author.student_id, 10).replace(/\D/g, ""),
        name: clean(author.name, 40).replace(/[\r\n]+/g, " "),
      };
    });
    const values = {
      title: clean(payload.title, 120), short_description: clean(payload.short_description, 180),
      background: clean(payload.background), purpose: clean(payload.purpose), target: clean(payload.target, 120),
      duration: clean(payload.duration, 50), deadline: clean(payload.deadline, 10), usage_plan: clean(payload.usage_plan),
      category: clean(payload.category, 30), naver_form_url: clean(payload.naver_form_url, 600),
      author_grade: clean(payload.author_grade, 30), author_student_id: authors.map((author) => author.student_id).join("\n"),
      author_name: authors.map((author) => author.name).join("\n"), author_display: "",
    };
    values.author_display = authors.map((author) => `${author.student_id} ${author.name}`.trim()).join(", ");
    const required = [values.title, values.short_description, values.background, values.purpose, values.target, values.duration, values.deadline, values.usage_plan, values.category, values.naver_form_url];
    if (required.some((value) => !value)) return Response.json({ error: "필수 항목을 모두 입력해주세요." }, { status: 400 });
    if (!authors.length || authors.some((author) => !author.student_id || !author.name)) return Response.json({ error: "모든 작성자의 학번과 이름을 입력해주세요." }, { status: 400 });
    if (!publicCategories.includes(values.category as never)) return Response.json({ error: "카테고리를 확인해주세요." }, { status: 400 });
    try { new URL(values.naver_form_url); } catch { return Response.json({ error: "올바른 URL 형식이 아닙니다." }, { status: 400 }); }

    const id = crypto.randomUUID();
    const managementCode = createManagementCode();
    const now = new Date().toISOString();
    const db = getD1();
    await db.prepare(`
      INSERT INTO surveys (
        id, title, short_description, background, purpose, target, duration, deadline,
        usage_plan, category, naver_form_url, author_grade, author_student_id, author_name, author_display,
        management_code, manual_status, approval_status, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active', 'pending', ?, ?)
    `).bind(id, values.title, values.short_description, values.background, values.purpose, values.target, values.duration, values.deadline, values.usage_plan, values.category, values.naver_form_url, values.author_grade, values.author_student_id, values.author_name, values.author_display, managementCode, now, now).run();
    return Response.json({ id, management_code: managementCode, approval_status: "pending" }, { status: 201 });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "설문을 저장하지 못했습니다." }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const payload = await request.json() as Record<string, unknown>;
    const action = clean(payload.action, 40);
    const id = clean(payload.id, 80);
    const db = getD1();
    if (!id) return Response.json({ error: "설문 정보가 없습니다." }, { status: 400 });

    if (action.startsWith("admin_")) {
      if (!isAdmin(request)) return Response.json({ error: "관리자 비밀번호가 올바르지 않습니다." }, { status: 401 });
      if (action === "admin_delete") await db.prepare("DELETE FROM surveys WHERE id = ?").bind(id).run();
      else if (action === "admin_approve") await db.prepare("UPDATE surveys SET approval_status = 'approved', updated_at = ? WHERE id = ?").bind(new Date().toISOString(), id).run();
      else if (action === "admin_reject") await db.prepare("UPDATE surveys SET approval_status = 'rejected', updated_at = ? WHERE id = ?").bind(new Date().toISOString(), id).run();
      else if (action === "admin_toggle_status") await db.prepare("UPDATE surveys SET manual_status = CASE WHEN manual_status = 'active' THEN 'closed' ELSE 'active' END, updated_at = ? WHERE id = ?").bind(new Date().toISOString(), id).run();
      else return Response.json({ error: "지원하지 않는 작업입니다." }, { status: 400 });
      return Response.json({ ok: true });
    }

    const code = clean(payload.management_code, 20).toUpperCase();
    const owner = await db.prepare("SELECT id FROM surveys WHERE id = ? AND management_code = ?").bind(id, code).first();
    if (!owner) return Response.json({ error: "관리 코드가 올바르지 않습니다." }, { status: 403 });
    if (action === "owner_delete") await db.prepare("DELETE FROM surveys WHERE id = ?").bind(id).run();
    else if (action === "owner_close") await db.prepare("UPDATE surveys SET manual_status = 'closed', updated_at = ? WHERE id = ?").bind(new Date().toISOString(), id).run();
    else if (action === "owner_update") {
      const title = clean(payload.title, 120), description = clean(payload.short_description, 180), purpose = clean(payload.purpose), usage = clean(payload.usage_plan), deadline = clean(payload.deadline, 10), formUrl = clean(payload.naver_form_url, 600);
      if (![title, description, purpose, usage, deadline, formUrl].every(Boolean)) return Response.json({ error: "수정 항목을 모두 입력해주세요." }, { status: 400 });
      try { new URL(formUrl); } catch { return Response.json({ error: "올바른 URL 형식이 아닙니다." }, { status: 400 }); }
      await db.prepare("UPDATE surveys SET title = ?, short_description = ?, purpose = ?, usage_plan = ?, deadline = ?, naver_form_url = ?, approval_status = 'pending', updated_at = ? WHERE id = ?").bind(title, description, purpose, usage, deadline, formUrl, new Date().toISOString(), id).run();
    } else return Response.json({ error: "지원하지 않는 작업입니다." }, { status: 400 });
    return Response.json({ ok: true });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "요청을 처리하지 못했습니다." }, { status: 500 });
  }
}
