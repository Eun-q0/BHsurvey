create extension if not exists pgcrypto;

create table if not exists public.surveys (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  short_description text not null,
  background text not null,
  purpose text not null,
  target text not null,
  duration text not null,
  deadline date not null,
  usage_plan text not null,
  category text not null check (category in ('과학·탐구', '학교생활', '진로·교육', '사회·문화', '기타')),
  naver_form_url text not null,
  author_grade text not null default '',
  author_student_id text not null default '',
  author_name text not null default '',
  author_display text not null default '익명',
  management_code text not null unique,
  manual_status text not null default 'active' check (manual_status in ('active', 'closed')),
  approval_status text not null default 'pending' check (approval_status in ('pending', 'approved', 'rejected')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  survey_id uuid not null references public.surveys(id) on delete cascade,
  reason text not null check (reason in ('부적절한 내용', '개인정보 요구', '광고 또는 홍보', '장난성 설문', '기타')),
  description text not null default '',
  created_at timestamptz not null default now()
);

create index if not exists idx_surveys_approval_created on public.surveys (approval_status, created_at desc);
create index if not exists idx_surveys_deadline on public.surveys (deadline);
create index if not exists idx_reports_survey_id on public.reports (survey_id);

alter table public.surveys enable row level security;
alter table public.reports enable row level security;

create policy "approved surveys are readable"
on public.surveys for select
using (approval_status = 'approved');

create policy "students can submit pending surveys"
on public.surveys for insert
with check (approval_status = 'pending');

create policy "reports can be submitted"
on public.reports for insert
with check (exists (select 1 from public.surveys where surveys.id = survey_id and surveys.approval_status = 'approved'));
