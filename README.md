# 백합 Survey

청주여고 학생들이 수행평가, 탐구활동, 생기부 활동에 필요한 설문을 발견하고 네이버 폼 참여자를 연결할 수 있는 설문 공유 웹앱입니다. 앱 안에서 설문지를 제작하지 않고, 네이버 폼 링크와 조사 정보를 등록하는 데 집중합니다.

## 구현된 기능

- 설문 검색, 카테고리 필터, 최신순·마감 임박순 정렬
- 마감일 기반 `진행 중`·`마감 임박`·`종료` 자동 표시
- 상세 정보와 새 탭 네이버 폼 연결
- 필수값·URL 검증이 적용된 설문 등록 및 승인 대기 처리
- 최대 8명의 공동 작성자 학번·이름 등록과 공개 표시
- 랜덤 관리 코드 발급, 작성자 수정·종료·삭제
- 관리자 비밀번호 로그인, 승인·거절·상태 변경·삭제
- 신고 접수와 관리자 신고 목록
- 모바일 우선 반응형 UI, 로딩·빈 상태·완료 알림
- 검색과 등록 시작을 위한 WebMCP 도구

## 실행 방법

Node.js 22.13 이상과 pnpm이 필요합니다.

```bash
pnpm install
pnpm db:generate
pnpm build
pnpm dev
```

로컬 D1을 처음 사용할 때는 빌드 후 마이그레이션을 적용합니다.

```bash
node --import ./scripts/sites-env.mjs ./node_modules/wrangler/bin/wrangler.js d1 execute DB --local --config dist/server/wrangler.json --persist-to .wrangler/state --file drizzle/0000_minor_the_order.sql
node --import ./scripts/sites-env.mjs ./node_modules/wrangler/bin/wrangler.js d1 execute DB --local --config dist/server/wrangler.json --persist-to .wrangler/state --file drizzle/0001_giant_thundra.sql
```

## 환경변수

관리자 비밀번호는 소스 코드에 두지 않습니다. 로컬에서는 개발 서버를 시작하기 전에 `ADMIN_PASSWORD`를 설정하고, 배포 환경에서는 호스팅 서비스의 비밀 환경변수로 등록하세요.

```env
ADMIN_PASSWORD=충분히-긴-관리자-비밀번호
```

## 데이터베이스

이 저장소의 바로 실행 가능한 Sites 배포본은 Cloudflare D1을 사용합니다. 스키마는 `db/schema.ts`, 생성된 마이그레이션은 `drizzle/`에 있습니다. 첫 조회 시 데이터베이스가 비어 있으면 승인된 샘플 설문 5개가 추가됩니다.

요청한 Supabase 구조는 `supabase/schema.sql`에도 같은 필드로 제공됩니다. Supabase 프로젝트의 SQL Editor에서 실행하면 `surveys`, `reports` 테이블과 인덱스, 기본 RLS 정책을 만들 수 있습니다. Supabase를 실제 운영 저장소로 선택할 경우 서버 전용 환경변수에 프로젝트 URL과 service role key를 설정하고, service role key는 절대 브라우저에 노출하지 마세요.

```env
SUPABASE_URL=https://YOUR_PROJECT.supabase.co
SUPABASE_SERVICE_ROLE_KEY=YOUR_SERVER_ONLY_KEY
```

## 주요 구조

```text
app/
  api/surveys/route.ts   설문 조회·등록·승인·관리 API
  api/reports/route.ts   신고 접수 API
  survey-app.tsx         전체 사용자·관리자 UI
db/
  schema.ts              D1/SQLite 스키마
drizzle/                 배포 마이그레이션
lib/surveys.ts           타입, 샘플 데이터, 마감 상태 계산
supabase/schema.sql      Supabase용 호환 스키마
```

## 운영 전 확인

- 관리자 비밀번호를 강한 값으로 변경
- 실제 네이버 폼 URL로 샘플 URL 교체
- 학교 내부 개인정보 처리 기준과 신고 대응 절차 확인
- 공개 배포 전 관리자 페이지와 API에 별도 접근 제한을 추가하는 것을 권장
