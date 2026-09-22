"use client";

import { useCallback, useEffect, useMemo, useState, type FormEvent, type ReactNode } from "react";
import {
  AlertTriangle, ArrowLeft, CalendarDays, Check, ChevronRight, Clock3, ExternalLink,
  FilePenLine, Flag, KeyRound, Loader2, LockKeyhole, Search, ShieldCheck,
  Plus, Sparkles, Trash2, UserRound, X,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Toaster } from "@/components/ui/sonner";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  categories, formatDeadline, getSurveyStatus, sampleSurveys, type Report, type Survey,
} from "@/lib/surveys";

type View = "home" | "detail" | "register" | "manage" | "admin";
type AuthorDraft = { student_id: string; name: string };
type SurveyDraft = Pick<Survey, "title" | "short_description" | "background" | "purpose" | "target" | "duration" | "deadline" | "usage_plan" | "category" | "naver_form_url" | "author_grade"> & { authors: AuthorDraft[] };

const emptyDraft: SurveyDraft = {
  title: "", short_description: "", background: "", purpose: "", target: "", duration: "",
  deadline: "", usage_plan: "", category: "기타", naver_form_url: "", author_grade: "", authors: [{ student_id: "", name: "" }],
};

function routeFromHash() {
  if (typeof window === "undefined") return { view: "home" as View, id: "" };
  const value = window.location.hash.slice(1);
  if (value.startsWith("survey=")) return { view: "detail" as View, id: decodeURIComponent(value.slice(7)) };
  if (["register", "manage", "admin"].includes(value)) return { view: value as View, id: "" };
  return { view: "home" as View, id: "" };
}

function statusClasses(status: ReturnType<typeof getSurveyStatus>) {
  if (status === "종료") return "bg-[#eef0f3] text-[#6c7480]";
  if (status === "마감 임박") return "bg-[#fff0ec] text-[#a63d2e]";
  return "bg-[#eaf5ef] text-[#276b50]";
}

function authorLabel(survey: Pick<Survey, "author_student_id" | "author_name" | "author_display">) {
  const studentIds = (survey.author_student_id ?? "").split(/\r?\n/).filter(Boolean);
  const names = (survey.author_name ?? "").split(/\r?\n/).filter(Boolean);
  const authors = Array.from({ length: Math.max(studentIds.length, names.length) }, (_, index) => [studentIds[index], names[index]].filter(Boolean).join(" ")).filter(Boolean);
  return authors.join(", ") || survey.author_display || "작성자 정보 없음";
}

function Field({ label, required, hint, children }: { label: string; required?: boolean; hint?: string; children: ReactNode }) {
  return <div className="space-y-2"><Label className="text-[0.94rem] font-semibold text-[#263a56]">{label}{required && <span className="ml-1 text-[#b42318]">*</span>}</Label>{children}{hint && <p className="text-sm leading-relaxed text-[#718096]">{hint}</p>}</div>;
}

function Header({ navigate }: { navigate: (view: View, id?: string) => void }) {
  return (
    <header className="sticky top-0 z-30 border-b border-[#dce2eb] bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-8 sm:py-4">
        <button onClick={() => navigate("home")} className="flex min-h-11 items-center gap-3 rounded-md text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#526b8e]">
          <span className="grid size-10 place-items-center overflow-hidden rounded-full border border-[#b9c4d5] bg-white p-1.5">
            <img src="/school-symbol.png" alt="" aria-hidden="true" className="size-full object-contain" />
          </span>
          <div><div className="font-bold tracking-[-0.02em] text-[#13294b]">백합 Survey</div><div className="hidden text-sm text-[#66738a] md:block">청주여고 학생들의 탐구와 의견 조사를 위한 설문 공간</div></div>
        </button>
        <nav className="flex items-center gap-2">
          <Button variant="ghost" className="hidden min-h-11 text-[#42536d] sm:inline-flex" onClick={() => navigate("manage")}><KeyRound /> 내 설문 관리</Button>
          <Button className="min-h-11 bg-[#13294b] px-4 hover:bg-[#1f3b68]" onClick={() => navigate("register")}><FilePenLine /> <span className="hidden sm:inline">설문 등록하기</span><span className="sm:hidden">등록</span></Button>
        </nav>
      </div>
    </header>
  );
}

function SurveyCard({ survey, open }: { survey: Survey; open: () => void }) {
  const status = getSurveyStatus(survey);
  const ended = status === "종료";
  return (
    <article role="button" tabIndex={0} onClick={open} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") open(); }} className={`group flex min-h-[292px] cursor-pointer flex-col rounded-xl border border-[#d7dee8] bg-white p-5 text-left shadow-[0_2px_12px_rgba(25,42,70,0.035)] transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#526b8e] ${ended ? "opacity-60" : "hover:-translate-y-0.5 hover:border-[#a9b7ca] hover:shadow-[0_8px_24px_rgba(25,42,70,0.08)]"}`}>
      <div className="mb-5 flex items-center justify-between gap-3"><Badge variant="secondary" className="bg-[#edf1f6] text-[#365476]">{survey.category}</Badge><span className={`rounded-full px-2.5 py-1 text-sm font-semibold ${statusClasses(status)}`}>{status}</span></div>
      <h3 className="text-xl font-bold leading-snug tracking-[-0.025em] text-[#162b4a]">{survey.title}</h3>
      <p className="mt-2 line-clamp-2 leading-relaxed text-[#66738a]">{survey.short_description}</p>
      <div className="mt-auto grid grid-cols-2 gap-3 border-t border-[#e4e8ef] pt-5 text-sm text-[#58667b]"><span className="col-span-2 font-medium">대상 · {survey.target}</span><span className="col-span-2 flex items-center gap-1.5"><UserRound className="size-4" />작성자 · {authorLabel(survey)}</span><span className="flex items-center gap-1.5"><Clock3 className="size-4" />{survey.duration}</span><span className="flex items-center justify-end gap-1.5"><CalendarDays className="size-4" />{formatDeadline(survey.deadline)}</span></div>
      <Button variant="ghost" className="mt-4 min-h-11 w-full border border-[#d7dee8] text-[#13294b] group-hover:bg-[#13294b] group-hover:text-white">자세히 보기 <ChevronRight /></Button>
    </article>
  );
}

function HomeView({ surveys, loading, navigate }: { surveys: Survey[]; loading: boolean; navigate: (view: View, id?: string) => void }) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("전체");
  const [sort, setSort] = useState("latest");
  const visible = useMemo(() => surveys.filter((survey) => {
    const queryMatch = `${survey.title} ${survey.short_description} ${survey.purpose}`.toLowerCase().includes(query.toLowerCase());
    return queryMatch && (category === "전체" || survey.category === category);
  }).sort((a, b) => sort === "deadline" ? a.deadline.localeCompare(b.deadline) : b.created_at.localeCompare(a.created_at)), [surveys, query, category, sort]);
  const recommended = useMemo(() => surveys.filter((survey) => getSurveyStatus(survey) !== "종료").sort((a, b) => a.deadline.localeCompare(b.deadline) || b.created_at.localeCompare(a.created_at)).slice(0, 3), [surveys]);

  return (
    <main className="mx-auto max-w-6xl px-4 py-7 sm:px-8 sm:py-10">
      <section className="grid gap-6 border-b border-[#dce2eb] pb-8 lg:grid-cols-[1fr_0.72fr] lg:items-end">
        <div><p className="mb-3 flex items-center gap-2 text-sm font-semibold text-[#35557f]"><Sparkles className="size-4" /> 학생들의 질문이 모이는 곳</p><h1 className="max-w-2xl text-[clamp(1.9rem,6vw,3.35rem)] font-bold leading-[1.15] tracking-[-0.045em] text-[#13294b]">궁금한 마음이<br />좋은 탐구가 되도록</h1></div>
        <div className="relative"><Search className="absolute left-4 top-1/2 size-5 -translate-y-1/2 text-[#738097]" /><Input value={query} onChange={(event) => setQuery(event.target.value)} className="h-14 border-[#cbd4e1] bg-white pl-12 text-base shadow-none placeholder:text-[#8a95a7]" placeholder="제목이나 주제로 설문 검색" aria-label="설문 검색" /></div>
      </section>

      {recommended.length > 0 && <section className="my-7 rounded-xl border border-[#cfd9e7] bg-[#eaf0f8] p-5 sm:p-6">
        <div className="mb-4 flex items-center justify-between"><div><p className="text-sm font-semibold text-[#35557f]">지금 응답이 필요한 설문</p><h2 className="mt-1 text-xl font-bold tracking-[-0.025em] text-[#13294b]">새로운 의견을 기다리고 있어요</h2></div><span className="hidden rounded-full bg-white px-3 py-1 text-sm text-[#5e6c82] sm:block">최대 3개 추천</span></div>
        <div className="grid gap-2 lg:grid-cols-3">{recommended.map((survey) => <button key={survey.id} onClick={() => navigate("detail", survey.id)} className="flex min-h-[88px] items-center justify-between gap-4 rounded-lg border border-[#d2dcea] bg-white p-4 text-left transition hover:border-[#96a8c0]"><div><p className="line-clamp-1 font-bold text-[#193252]">{survey.title}</p><p className="mt-1 text-sm text-[#66738a]">{formatDeadline(survey.deadline)} 마감 · {survey.duration}</p></div><ChevronRight className="size-5 shrink-0 text-[#58708f]" /></button>)}</div>
      </section>}

      <section>
        <div className="mb-5 flex flex-col gap-4 border-b border-[#dce2eb] pb-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex gap-2 overflow-x-auto pb-1" aria-label="카테고리 필터">{categories.map((item) => <button key={item} onClick={() => setCategory(item)} aria-pressed={category === item} className={`min-h-11 shrink-0 rounded-full border px-4 text-sm font-semibold transition ${category === item ? "border-[#13294b] bg-[#13294b] text-white" : "border-[#ccd5e2] bg-white text-[#516078] hover:border-[#7d8da4]"}`}>{item}</button>)}</div>
          <Select value={sort} onValueChange={setSort}><SelectTrigger className="h-11 w-full border-[#ccd5e2] bg-white lg:w-[150px]"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="latest">최신순</SelectItem><SelectItem value="deadline">마감 임박순</SelectItem></SelectContent></Select>
        </div>
        <div className="mb-4 flex items-end justify-between gap-3"><div><p className="text-sm text-[#6a778c]">승인된 설문</p><h2 className="text-2xl font-bold tracking-[-0.035em] text-[#13294b]">참여할 설문을 골라보세요</h2></div><span className="shrink-0 text-sm font-semibold text-[#6a778c]">총 {visible.length}개</span></div>
        {loading ? <div className="grid gap-4 lg:grid-cols-3">{[0, 1, 2].map((item) => <Skeleton key={item} className="h-[292px] rounded-xl bg-[#e7ebf1]" />)}</div> : visible.length > 0 ? <div className="grid gap-4 lg:grid-cols-3">{visible.map((survey) => <SurveyCard key={survey.id} survey={survey} open={() => navigate("detail", survey.id)} />)}</div> : <div className="rounded-xl border border-dashed border-[#c7d0dd] bg-white px-6 py-14 text-center"><Search className="mx-auto mb-3 size-8 text-[#8995a7]" /><h3 className="font-bold text-[#233b5c]">조건에 맞는 설문이 없어요</h3><p className="mt-1 text-[#6d7a8e]">검색어나 카테고리를 바꿔보세요.</p></div>}
      </section>
    </main>
  );
}

function DetailView({ survey, navigate, refresh }: { survey?: Survey; navigate: (view: View, id?: string) => void; refresh: () => void }) {
  const [reportOpen, setReportOpen] = useState(false);
  const [reason, setReason] = useState("부적절한 내용");
  const [description, setDescription] = useState("");
  const [sending, setSending] = useState(false);
  if (!survey) return <main className="mx-auto max-w-4xl px-4 py-16 text-center"><h1 className="text-xl font-bold">설문을 찾지 못했습니다.</h1><Button className="mt-5" onClick={() => navigate("home")}>홈으로 돌아가기</Button></main>;
  const status = getSurveyStatus(survey);
  const ended = status === "종료";
  async function report() {
    setSending(true);
    try {
      const response = await fetch("/api/reports", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ survey_id: survey!.id, reason, description }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      toast.success("신고가 접수되었습니다."); setReportOpen(false); setDescription(""); refresh();
    } catch (error) { toast.error(error instanceof Error ? error.message : "신고를 접수하지 못했습니다."); } finally { setSending(false); }
  }
  return (
    <main className="mx-auto max-w-5xl px-4 py-7 sm:px-8 sm:py-10">
      <button onClick={() => navigate("home")} className="mb-6 flex min-h-11 items-center gap-2 rounded-md px-1 font-semibold text-[#526078] hover:text-[#13294b]"><ArrowLeft /> 설문 목록으로</button>
      <div className="grid gap-6 lg:grid-cols-[1fr_320px] lg:items-start">
        <article className="rounded-xl border border-[#d7dee8] bg-white p-5 sm:p-8">
          <div className="flex flex-wrap items-center gap-2"><Badge className="bg-[#edf1f6] text-[#365476]">{survey.category}</Badge><span className={`rounded-full px-2.5 py-1 text-sm font-semibold ${statusClasses(status)}`}>{status}</span></div>
          <h1 className="mt-5 text-[clamp(1.7rem,5vw,2.6rem)] font-bold leading-tight tracking-[-0.04em] text-[#13294b]">{survey.title}</h1><p className="mt-3 text-lg leading-relaxed text-[#5f6f85]">{survey.short_description}</p>
          <div className="mt-8 grid gap-x-8 gap-y-7 border-t border-[#e0e5ed] pt-8 sm:grid-cols-2">
            {[ ["조사 배경", survey.background], ["조사 목적", survey.purpose], ["조사 대상", survey.target], ["예상 소요 시간", survey.duration], ["응답 마감일", `${survey.deadline} (${formatDeadline(survey.deadline)})`], ["활용 계획", survey.usage_plan], ["작성자", authorLabel(survey)] ].map(([label, value]) => <section key={label} className={label === "조사 배경" || label === "조사 목적" || label === "활용 계획" ? "sm:col-span-2" : ""}><h2 className="mb-2 text-sm font-bold text-[#345273]">{label}</h2><p className="whitespace-pre-wrap leading-7 text-[#34445b]">{value}</p></section>)}
          </div>
        </article>
        <aside className="rounded-xl border border-[#d7dee8] bg-white p-5 lg:sticky lg:top-24">
          <p className="text-sm font-semibold text-[#5d6d83]">참여 전 확인해주세요</p><p className="mt-2 leading-relaxed text-[#2f4058]">설문 응답 시 개인정보 제공 여부를 반드시 확인하세요.</p>
          {ended ? <Button disabled className="mt-5 min-h-12 w-full">종료된 설문입니다</Button> : <Button asChild className="mt-5 min-h-12 w-full bg-[#13294b] hover:bg-[#1f3b68]"><a href={survey.naver_form_url} target="_blank" rel="noopener noreferrer">설문 참여하기 <ExternalLink /></a></Button>}
          <Button variant="ghost" className="mt-2 min-h-11 w-full text-[#6b7480]" onClick={() => setReportOpen(true)}><Flag /> 신고하기</Button>
        </aside>
      </div>
      <Dialog open={reportOpen} onOpenChange={setReportOpen}><DialogContent><DialogHeader><DialogTitle>설문 신고하기</DialogTitle><DialogDescription>관리자가 내용을 확인할 수 있도록 신고 사유를 알려주세요.</DialogDescription></DialogHeader><Field label="신고 사유" required><Select value={reason} onValueChange={setReason}><SelectTrigger className="h-11 w-full"><SelectValue /></SelectTrigger><SelectContent>{["부적절한 내용", "개인정보 요구", "광고 또는 홍보", "장난성 설문", "기타"].map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}</SelectContent></Select></Field><Field label="상세 내용"><Textarea value={description} onChange={(event) => setDescription(event.target.value)} className="min-h-28" placeholder="관리자가 확인할 내용을 적어주세요." /></Field><DialogFooter><Button variant="outline" onClick={() => setReportOpen(false)}>취소</Button><Button onClick={report} disabled={sending} className="bg-[#13294b]">{sending && <Loader2 className="animate-spin" />} 신고 접수</Button></DialogFooter></DialogContent></Dialog>
    </main>
  );
}

function RegisterView({ navigate, refresh }: { navigate: (view: View, id?: string) => void; refresh: () => void }) {
  const [draft, setDraft] = useState<SurveyDraft>(emptyDraft);
  const [submitting, setSubmitting] = useState(false);
  const [code, setCode] = useState("");
  const set = (key: Exclude<keyof SurveyDraft, "authors">, value: string) => setDraft((current) => ({ ...current, [key]: value }));
  const gradeOptions = ["1학년", "2학년", "3학년"];
  const selectedGrades = draft.target === "전교생" ? gradeOptions : draft.target.split(", ").filter((grade) => gradeOptions.includes(grade));
  const toggleGrade = (grade: string, checked: boolean) => {
    const next = checked ? [...selectedGrades, grade] : selectedGrades.filter((item) => item !== grade);
    const ordered = gradeOptions.filter((item) => next.includes(item));
    set("target", ordered.length === gradeOptions.length ? "전교생" : ordered.join(", "));
  };
  const setAuthor = (index: number, key: keyof AuthorDraft, value: string) => setDraft((current) => ({ ...current, authors: current.authors.map((author, authorIndex) => authorIndex === index ? { ...author, [key]: value } : author) }));
  const addAuthor = () => setDraft((current) => current.authors.length >= 8 ? current : ({ ...current, authors: [...current.authors, { student_id: "", name: "" }] }));
  const removeAuthor = (index: number) => setDraft((current) => current.authors.length === 1 ? current : ({ ...current, authors: current.authors.filter((_, authorIndex) => authorIndex !== index) }));
  const requiredFilled = [draft.title, draft.short_description, draft.background, draft.purpose, draft.target, draft.duration, draft.deadline, draft.usage_plan, draft.category, draft.naver_form_url].every((value) => value.trim()) && draft.authors.every((author) => author.student_id.trim() && author.name.trim());
  const validUrl = (() => { try { return ["https:", "http:"].includes(new URL(draft.naver_form_url.trim()).protocol); } catch { return false; } })();
  async function submit(event: FormEvent) {
    event.preventDefault(); if (!requiredFilled || !validUrl) return;
    setSubmitting(true);
    try { const response = await fetch("/api/surveys", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(draft) }); const data = await response.json(); if (!response.ok) throw new Error(data.error); setCode(data.management_code); toast.success("설문이 승인 대기 상태로 등록되었습니다."); refresh(); }
    catch (error) { toast.error(error instanceof Error ? error.message : "설문을 등록하지 못했습니다."); } finally { setSubmitting(false); }
  }
  if (code) return <main className="mx-auto max-w-2xl px-4 py-12 sm:px-8"><div className="rounded-xl border border-[#cfd9e7] bg-white p-6 text-center sm:p-10"><span className="mx-auto grid size-14 place-items-center rounded-full bg-[#eaf5ef] text-[#277052]"><Check className="size-7" /></span><h1 className="mt-5 text-2xl font-bold text-[#13294b]">승인 대기 상태로 등록됐어요</h1><p className="mt-2 leading-relaxed text-[#66738a]">관리자 승인 후 홈 화면에 공개됩니다. 아래 코드는 수정과 삭제에 필요하니 꼭 보관해주세요.</p><div className="mx-auto mt-6 max-w-sm rounded-lg border border-dashed border-[#91a4be] bg-[#f5f8fc] px-5 py-5"><p className="text-sm font-semibold text-[#607088]">내 설문 관리 코드</p><p className="mt-1 text-3xl font-black tracking-[0.08em] text-[#13294b]">{code}</p></div><div className="mt-7 flex flex-col justify-center gap-2 sm:flex-row"><Button variant="outline" onClick={() => navigate("manage")}>내 설문 관리</Button><Button className="bg-[#13294b]" onClick={() => navigate("home")}>홈으로 돌아가기</Button></div></div></main>;
  return (
    <main className="mx-auto max-w-3xl px-4 py-7 sm:px-8 sm:py-10"><button onClick={() => navigate("home")} className="mb-5 flex min-h-11 items-center gap-2 font-semibold text-[#526078]"><ArrowLeft /> 홈으로</button><div className="mb-7"><p className="text-sm font-semibold text-[#496584]">새 설문 등록</p><h1 className="mt-1 text-3xl font-bold tracking-[-0.04em] text-[#13294b]">설문지를 학생들과 공유하세요</h1><p className="mt-2 leading-relaxed text-[#67758a]">설문 도구에서 만든 설문지의 공유 링크와 조사 정보를 입력해주세요.</p></div>
      <form onSubmit={submit} className="space-y-7 rounded-xl border border-[#d7dee8] bg-white p-5 sm:p-8">
        <Field label="설문 제목" required><Input value={draft.title} onChange={(e) => set("title", e.target.value)} maxLength={120} className="h-11" placeholder="예: 시험 기간 수면시간과 집중도의 관계" /></Field>
        <Field label="한 줄 소개" required><Input value={draft.short_description} onChange={(e) => set("short_description", e.target.value)} maxLength={180} className="h-11" placeholder="설문의 핵심 내용을 한 문장으로 적어주세요." /></Field>
        <Field label="조사 배경" required><Textarea value={draft.background} onChange={(e) => set("background", e.target.value)} className="min-h-28" placeholder="이 설문을 시작하게 된 이유를 적어주세요." /></Field>
        <Field label="조사 목적" required><Textarea value={draft.purpose} onChange={(e) => set("purpose", e.target.value)} className="min-h-28" placeholder="무엇을 알아보고 싶은지 적어주세요." /></Field>
        <div className="grid gap-6 sm:grid-cols-2"><Field label="조사 대상" required hint="대상 학년을 하나 이상 선택해주세요. 세 학년을 모두 선택하면 전교생으로 표시됩니다."><div className="flex min-h-11 flex-wrap items-center gap-x-5 gap-y-3 rounded-md border border-input px-3 py-2.5">{gradeOptions.map((grade) => <label key={grade} htmlFor={`target-${grade}`} className="flex cursor-pointer items-center gap-2 text-sm font-medium text-[#263a56]"><Checkbox id={`target-${grade}`} checked={selectedGrades.includes(grade)} onCheckedChange={(checked) => toggleGrade(grade, checked === true)} />{grade}</label>)}</div>{draft.target && <p className="text-sm font-semibold text-[#496584]">선택 대상: {draft.target}</p>}</Field><Field label="예상 소요 시간" required><Input value={draft.duration} onChange={(e) => set("duration", e.target.value)} className="h-11" placeholder="예: 약 3분" /></Field></div>
        <div className="grid gap-6 sm:grid-cols-2"><Field label="응답 마감일" required><Input type="date" min={new Date().toISOString().slice(0, 10)} value={draft.deadline} onChange={(e) => set("deadline", e.target.value)} className="h-11" /></Field><Field label="카테고리" required><Select value={draft.category} onValueChange={(value) => set("category", value)}><SelectTrigger className="h-11 w-full"><SelectValue /></SelectTrigger><SelectContent>{categories.slice(1).map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}</SelectContent></Select></Field></div>
        <Field label="활용 계획" required><Textarea value={draft.usage_plan} onChange={(e) => set("usage_plan", e.target.value)} className="min-h-24" placeholder="예: 수행평가, 동아리 탐구, 진로활동 또는 학생자치 제안 자료로 활용" /></Field>
        <Field label="설문지 링크" required hint="네이버 폼(naver.me), 구글 폼 등 설문지의 응답용 공유 링크를 붙여넣어주세요."><Input type="url" value={draft.naver_form_url} onChange={(e) => set("naver_form_url", e.target.value)} className="h-11" placeholder="예: https://naver.me/..." />{draft.naver_form_url && !validUrl && <p className="flex items-center gap-1.5 text-sm text-[#b42318]"><AlertTriangle className="size-4" /> https:// 또는 http://로 시작하는 설문지 링크를 입력해주세요.</p>}</Field>
        <Field label="작성자" required hint="공동으로 만든 설문이라면 작성자를 최대 8명까지 추가할 수 있습니다. 입력한 학번과 이름은 설문 카드와 상세 화면에 공개됩니다."><div className="space-y-3">{draft.authors.map((author, index) => <div key={index} className="grid grid-cols-[minmax(0,0.8fr)_minmax(0,1fr)_44px] gap-2"><Input aria-label={`작성자 ${index + 1} 학번`} inputMode="numeric" value={author.student_id} onChange={(e) => setAuthor(index, "student_id", e.target.value.replace(/\D/g, "").slice(0, 10))} className="h-11" placeholder="학번" /><Input aria-label={`작성자 ${index + 1} 이름`} value={author.name} onChange={(e) => setAuthor(index, "name", e.target.value.slice(0, 30))} className="h-11" placeholder="이름" /><Button type="button" variant="outline" size="icon" className="size-11 text-[#6b7480]" onClick={() => removeAuthor(index)} disabled={draft.authors.length === 1} aria-label={`작성자 ${index + 1} 삭제`}><Trash2 /></Button></div>)}<Button type="button" variant="outline" className="min-h-11" onClick={addAuthor} disabled={draft.authors.length >= 8}><Plus /> 작성자 추가</Button></div></Field>
        <Field label="학년 (선택)"><Select value={draft.author_grade || "none"} onValueChange={(value) => set("author_grade", value === "none" ? "" : value)}><SelectTrigger className="h-11 w-full sm:max-w-xs"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="none">선택하지 않음</SelectItem>{["1학년", "2학년", "3학년"].map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}</SelectContent></Select></Field>
        <div className="rounded-lg border border-[#e1d6ba] bg-[#fffbef] p-4 text-sm leading-relaxed text-[#6c5930]"><p className="font-bold">개인정보를 안전하게 지켜주세요</p><p className="mt-1">전화번호, 집 주소, 주민등록번호 등 불필요한 개인정보를 요구하는 설문은 등록하지 마세요.</p></div>
        <Button type="submit" disabled={!requiredFilled || !validUrl || submitting} className="min-h-12 w-full bg-[#13294b] text-base hover:bg-[#1f3b68]">{submitting && <Loader2 className="animate-spin" />} 승인 요청하고 등록하기</Button>
      </form>
    </main>
  );
}

function ManageView({ navigate, refresh }: { navigate: (view: View, id?: string) => void; refresh: () => void }) {
  const [code, setCode] = useState(""); const [survey, setSurvey] = useState<Survey | null>(null); const [loading, setLoading] = useState(false); const [saving, setSaving] = useState(false);
  const [edit, setEdit] = useState({ title: "", short_description: "", purpose: "", usage_plan: "", deadline: "", naver_form_url: "" });
  async function find(event: FormEvent) { event.preventDefault(); setLoading(true); try { const response = await fetch(`/api/surveys?code=${encodeURIComponent(code.trim().toUpperCase())}`); const data = await response.json(); if (!response.ok) throw new Error(data.error); setSurvey(data.survey); setEdit({ title: data.survey.title, short_description: data.survey.short_description, purpose: data.survey.purpose, usage_plan: data.survey.usage_plan, deadline: data.survey.deadline, naver_form_url: data.survey.naver_form_url }); } catch (error) { toast.error(error instanceof Error ? error.message : "설문을 찾지 못했습니다."); } finally { setLoading(false); } }
  async function act(action: string) { if (!survey) return; setSaving(true); try { const response = await fetch("/api/surveys", { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ action, id: survey.id, management_code: code.trim().toUpperCase(), ...edit }) }); const data = await response.json(); if (!response.ok) throw new Error(data.error); toast.success(action === "owner_update" ? "수정 후 다시 승인 대기 상태가 되었습니다." : action === "owner_close" ? "설문을 종료했습니다." : "설문을 삭제했습니다."); refresh(); if (action === "owner_delete") setSurvey(null); else setSurvey({ ...survey, ...edit, approval_status: action === "owner_update" ? "pending" : survey.approval_status, manual_status: action === "owner_close" ? "closed" : survey.manual_status }); } catch (error) { toast.error(error instanceof Error ? error.message : "요청을 처리하지 못했습니다."); } finally { setSaving(false); } }
  return (
    <main className="mx-auto max-w-3xl px-4 py-7 sm:px-8 sm:py-10"><button onClick={() => navigate("home")} className="mb-5 flex min-h-11 items-center gap-2 font-semibold text-[#526078]"><ArrowLeft /> 홈으로</button><div className="mb-7"><p className="text-sm font-semibold text-[#496584]">내 설문 관리</p><h1 className="mt-1 text-3xl font-bold tracking-[-0.04em] text-[#13294b]">관리 코드로 설문을 찾아보세요</h1><p className="mt-2 text-[#67758a]">등록 완료 시 발급된 코드로 수정, 종료, 삭제할 수 있습니다.</p></div>
      {!survey ? <form onSubmit={find} className="rounded-xl border border-[#d7dee8] bg-white p-5 sm:p-8"><Field label="관리 코드" required hint="예: ABCD-7281"><div className="flex flex-col gap-2 sm:flex-row"><Input value={code} onChange={(event) => setCode(event.target.value.toUpperCase())} className="h-12 flex-1 text-lg font-bold tracking-[0.08em]" placeholder="ABCD-0000" /><Button disabled={!code.trim() || loading} className="h-12 bg-[#13294b] sm:w-32">{loading && <Loader2 className="animate-spin" />} 조회하기</Button></div></Field></form> : <div className="space-y-5 rounded-xl border border-[#d7dee8] bg-white p-5 sm:p-8"><div className="flex flex-wrap items-center justify-between gap-3 border-b pb-5"><div><p className="text-sm text-[#6b788c]">승인 상태</p><p className="font-bold text-[#203a5d]">{{ pending: "승인 대기", approved: "승인됨", rejected: "거절됨" }[survey.approval_status]}</p><p className="mt-1 text-sm text-[#6b788c]">작성자 · {authorLabel(survey)}</p></div><Button variant="outline" onClick={() => setSurvey(null)}>다른 코드 조회</Button></div>{([ ["제목", "title", "input"], ["한 줄 소개", "short_description", "input"], ["조사 목적", "purpose", "textarea"], ["활용 계획", "usage_plan", "textarea"], ["마감일", "deadline", "date"], ["설문지 링크", "naver_form_url", "url"] ] as const).map(([label, key, type]) => <Field key={key} label={label} required>{type === "textarea" ? <Textarea className="min-h-24" value={edit[key]} onChange={(e) => setEdit({ ...edit, [key]: e.target.value })} /> : <Input type={type} className="h-11" value={edit[key]} onChange={(e) => setEdit({ ...edit, [key]: e.target.value })} />}</Field>)}<Button onClick={() => act("owner_update")} disabled={saving} className="min-h-12 w-full bg-[#13294b]">수정 내용 저장하기</Button><div className="grid gap-2 border-t pt-5 sm:grid-cols-2"><AlertDialog><AlertDialogTrigger asChild><Button variant="outline" disabled={survey.manual_status === "closed"}>설문 종료하기</Button></AlertDialogTrigger><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>설문을 종료할까요?</AlertDialogTitle><AlertDialogDescription>종료 후에는 참여 버튼이 비활성화됩니다.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>취소</AlertDialogCancel><AlertDialogAction onClick={() => act("owner_close")}>종료하기</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog><AlertDialog><AlertDialogTrigger asChild><Button variant="outline" className="text-[#b42318]"><Trash2 /> 삭제하기</Button></AlertDialogTrigger><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>설문을 삭제할까요?</AlertDialogTitle><AlertDialogDescription>삭제된 설문과 신고 내역은 복구할 수 없습니다.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>취소</AlertDialogCancel><AlertDialogAction className="bg-[#b42318]" onClick={() => act("owner_delete")}>삭제하기</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog></div></div>}
    </main>
  );
}

function AdminView({ navigate, refresh }: { navigate: (view: View, id?: string) => void; refresh: () => void }) {
  const [password, setPassword] = useState(""); const [surveys, setSurveys] = useState<Survey[]>([]); const [reports, setReports] = useState<Report[]>([]); const [loading, setLoading] = useState(false); const [authed, setAuthed] = useState(false);
  const load = useCallback(async (passwordValue = password) => { setLoading(true); try { const response = await fetch("/api/surveys?admin=1", { headers: { "x-admin-password": passwordValue } }); const data = await response.json(); if (!response.ok) throw new Error(data.error); setSurveys(data.surveys); setReports(data.reports); setAuthed(true); } catch (error) { toast.error(error instanceof Error ? error.message : "관리자 정보를 불러오지 못했습니다."); } finally { setLoading(false); } }, [password]);
  async function act(id: string, action: string) { try { const response = await fetch("/api/surveys", { method: "PATCH", headers: { "content-type": "application/json", "x-admin-password": password }, body: JSON.stringify({ id, action }) }); const data = await response.json(); if (!response.ok) throw new Error(data.error); toast.success("처리되었습니다."); await load(); refresh(); } catch (error) { toast.error(error instanceof Error ? error.message : "처리하지 못했습니다."); } }
  const pending = surveys.filter((survey) => survey.approval_status === "pending");
  return (
    <main className="mx-auto max-w-6xl px-4 py-7 sm:px-8 sm:py-10"><button onClick={() => navigate("home")} className="mb-5 flex min-h-11 items-center gap-2 font-semibold text-[#526078]"><ArrowLeft /> 홈으로</button>{!authed ? <div className="mx-auto max-w-md rounded-xl border border-[#d7dee8] bg-white p-6 sm:p-8"><span className="grid size-12 place-items-center rounded-full bg-[#edf1f6] text-[#13294b]"><LockKeyhole /></span><h1 className="mt-4 text-2xl font-bold text-[#13294b]">관리자 확인</h1><p className="mt-2 leading-relaxed text-[#68768a]">승인 대기 설문과 신고 내역은 관리자만 확인할 수 있습니다.</p><form onSubmit={(e) => { e.preventDefault(); load(); }} className="mt-6 space-y-3"><Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="h-12" placeholder="관리자 비밀번호" /><Button disabled={!password || loading} className="h-12 w-full bg-[#13294b]">{loading && <Loader2 className="animate-spin" />} 관리자 페이지 열기</Button></form></div> : <div><div className="mb-7 flex flex-wrap items-end justify-between gap-3"><div><p className="text-sm font-semibold text-[#496584]">관리자 페이지</p><h1 className="mt-1 text-3xl font-bold tracking-[-0.04em] text-[#13294b]">설문 승인과 신고 관리</h1></div><Button variant="outline" onClick={() => { setAuthed(false); setPassword(""); }}>로그아웃</Button></div><section className="rounded-xl border border-[#d7dee8] bg-white"><div className="flex items-center justify-between border-b p-5"><div><h2 className="text-xl font-bold text-[#183353]">승인 대기 설문</h2><p className="mt-1 text-sm text-[#6c798c]">내용과 링크를 확인한 뒤 공개 여부를 정해주세요.</p></div><Badge>{pending.length}개</Badge></div><div className="divide-y">{pending.length ? pending.map((survey) => <div key={survey.id} className="grid gap-4 p-5 lg:grid-cols-[1fr_auto] lg:items-center"><div><p className="text-sm font-semibold text-[#52708f]">{survey.category} · {authorLabel(survey)}</p><h3 className="mt-1 text-lg font-bold text-[#183353]">{survey.title}</h3><p className="mt-1 text-[#657287]">{survey.short_description}</p><a href={survey.naver_form_url} target="_blank" rel="noreferrer" className="mt-2 inline-flex items-center gap-1 text-sm font-semibold text-[#355d8d] underline">폼 링크 확인 <ExternalLink className="size-4" /></a></div><div className="flex flex-wrap gap-2"><Button variant="outline" onClick={() => act(survey.id, "admin_reject")}><X /> 거절</Button><Button className="bg-[#13294b]" onClick={() => act(survey.id, "admin_approve")}><Check /> 승인</Button></div></div>) : <p className="p-8 text-center text-[#6c798c]">승인을 기다리는 설문이 없습니다.</p>}</div></section><section className="mt-6 rounded-xl border border-[#d7dee8] bg-white"><div className="border-b p-5"><h2 className="text-xl font-bold text-[#183353]">전체 설문</h2></div><div className="divide-y">{surveys.map((survey) => <div key={survey.id} className="flex flex-col gap-3 p-5 lg:flex-row lg:items-center lg:justify-between"><div><div className="flex flex-wrap gap-2"><Badge variant="secondary">{{ pending: "승인 대기", approved: "승인됨", rejected: "거절됨" }[survey.approval_status]}</Badge><span className="text-sm text-[#6d798c]">작성자 {authorLabel(survey)} · 신고 {survey.reports_count ?? 0}건</span></div><h3 className="mt-2 font-bold text-[#213a5b]">{survey.title}</h3></div><div className="flex flex-wrap gap-2">{survey.approval_status !== "approved" && <Button size="sm" onClick={() => act(survey.id, "admin_approve")}>승인</Button>}<Button size="sm" variant="outline" onClick={() => act(survey.id, "admin_toggle_status")}>{survey.manual_status === "active" ? "종료" : "재개"}</Button><AlertDialog><AlertDialogTrigger asChild><Button size="sm" variant="outline" className="text-[#b42318]"><Trash2 /> 삭제</Button></AlertDialogTrigger><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>설문을 삭제할까요?</AlertDialogTitle><AlertDialogDescription>관련 신고 내역도 함께 삭제되며 복구할 수 없습니다.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>취소</AlertDialogCancel><AlertDialogAction className="bg-[#b42318]" onClick={() => act(survey.id, "admin_delete")}>삭제</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog></div></div>)}</div></section><section className="mt-6 rounded-xl border border-[#d7dee8] bg-white"><div className="border-b p-5"><h2 className="text-xl font-bold text-[#183353]">신고 내역</h2></div><div className="divide-y">{reports.length ? reports.map((report) => <div key={report.id} className="p-5"><p className="text-sm font-semibold text-[#a33e30]">{report.reason}</p><h3 className="mt-1 font-bold text-[#233b5b]">{report.survey_title}</h3><p className="mt-1 whitespace-pre-wrap text-[#657287]">{report.description || "추가 설명 없음"}</p></div>) : <p className="p-8 text-center text-[#6c798c]">접수된 신고가 없습니다.</p>}</div></section></div>}</main>
  );
}

export function SurveyApp() {
  const [view, setView] = useState<View>("home"); const [selectedId, setSelectedId] = useState(""); const [surveys, setSurveys] = useState<Survey[]>([]); const [loading, setLoading] = useState(true);
  const loadSurveys = useCallback(async () => { setLoading(true); try { const response = await fetch("/api/surveys"); const data = await response.json(); if (!response.ok) throw new Error(data.error); setSurveys(data.surveys); } catch { setSurveys([]); toast.error("설문을 불러오지 못했습니다. 잠시 후 새로고침해주세요."); } finally { setLoading(false); } }, []);
  useEffect(() => { loadSurveys(); }, [loadSurveys]);
  useEffect(() => { const sync = () => { const route = routeFromHash(); setView(route.view); setSelectedId(route.id); window.scrollTo({ top: 0 }); }; sync(); window.addEventListener("hashchange", sync); return () => window.removeEventListener("hashchange", sync); }, []);
  const navigate = useCallback((next: View, id = "") => { const hash = next === "home" ? "" : next === "detail" ? `survey=${encodeURIComponent(id)}` : next; if (window.location.hash.slice(1) === hash) { setView(next); setSelectedId(id); window.scrollTo({ top: 0 }); } else window.location.hash = hash; }, []);

  useEffect(() => {
    const modelContext = (document as Document & { modelContext?: { registerTool: (tool: unknown, options?: { signal?: AbortSignal }) => void | Promise<void> } }).modelContext;
    if (!modelContext?.registerTool) return;
    const controller = new AbortController();
    void Promise.resolve(modelContext.registerTool({ name: "search_surveys", title: "설문 검색", description: "백합 Survey 홈에서 키워드에 맞는 승인된 설문을 찾습니다.", inputSchema: { type: "object", properties: { query: { type: "string" } }, required: ["query"], additionalProperties: false }, annotations: { readOnlyHint: true, untrustedContentHint: true }, execute(input: unknown) { const query = typeof input === "object" && input && "query" in input ? String((input as { query: unknown }).query).trim().toLowerCase() : ""; if (!query) throw new Error("검색어가 필요합니다."); const results = surveys.filter((survey) => `${survey.title} ${survey.short_description} ${survey.purpose}`.toLowerCase().includes(query)).slice(0, 10).map(({ id, title, short_description, deadline, category }) => ({ id, title, short_description, deadline, category })); navigate("home"); return { count: results.length, results }; } }, { signal: controller.signal })).catch(() => undefined);
    void Promise.resolve(modelContext.registerTool({ name: "start_survey_registration", title: "설문 등록 시작", description: "새 설문 등록 화면을 엽니다. 이 단계만으로 설문이 저장되지는 않습니다.", inputSchema: { type: "object", properties: {}, additionalProperties: false }, annotations: { readOnlyHint: false, untrustedContentHint: false }, execute() { navigate("register"); return { view: "registration", saved: false }; } }, { signal: controller.signal })).catch(() => undefined);
    return () => controller.abort();
  }, [navigate, surveys]);

  const selected = surveys.find((survey) => survey.id === selectedId);
  return <div className="min-h-screen bg-[#f6f8fb] text-[#152036]"><Header navigate={navigate} />{view === "home" && <HomeView surveys={surveys} loading={loading} navigate={navigate} />}{view === "detail" && <DetailView survey={selected} navigate={navigate} refresh={loadSurveys} />}{view === "register" && <RegisterView navigate={navigate} refresh={loadSurveys} />}{view === "manage" && <ManageView navigate={navigate} refresh={loadSurveys} />}{view === "admin" && <AdminView navigate={navigate} refresh={loadSurveys} />}<footer className="mt-10 border-t border-[#dce2eb] bg-white px-4 py-7 text-center text-sm leading-relaxed text-[#7a8698]"><p>본 서비스는 학생이 제작한 비공식 교내 설문 공유 서비스이며 청주여자고등학교 공식 서비스가 아닙니다.</p><button onClick={() => navigate("admin")} className="mt-3 text-xs text-[#a1a9b5] opacity-0 transition focus:opacity-100 focus-visible:underline" aria-label="관리자 페이지">관리</button></footer><Toaster position="top-center" richColors /></div>;
}
