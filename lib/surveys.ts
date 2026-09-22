export type Category = "과학·탐구" | "학교생활" | "진로·교육" | "사회·문화" | "기타";
export type ApprovalStatus = "pending" | "approved" | "rejected";

export type Survey = {
  id: string;
  title: string;
  short_description: string;
  background: string;
  purpose: string;
  target: string;
  duration: string;
  deadline: string;
  usage_plan: string;
  category: Category;
  naver_form_url: string;
  author_grade: string;
  author_student_id: string;
  author_name: string;
  author_display: string;
  management_code?: string;
  manual_status: "active" | "closed";
  approval_status: ApprovalStatus;
  created_at: string;
  updated_at: string;
  reports_count?: number;
};

export type Report = {
  id: string;
  survey_id: string;
  survey_title?: string;
  reason: string;
  description: string;
  created_at: string;
};

export const categories: Array<"전체" | Category> = ["전체", "과학·탐구", "학교생활", "진로·교육", "사회·문화", "기타"];

const isoDate = (offset: number) => {
  const date = new Date();
  date.setDate(date.getDate() + offset);
  return date.toISOString().slice(0, 10);
};

export const sampleSurveys: Survey[] = [
  {
    id: "sample-caffeine",
    title: "청소년의 카페인 음료 섭취 실태 조사",
    short_description: "카페인 음료 섭취 습관과 수면의 관계를 알아봅니다.",
    background: "시험 기간에 카페인 음료를 찾는 학생이 많아 실제 섭취 습관과 수면에 미치는 영향을 살펴보고자 합니다.",
    purpose: "카페인 음료의 섭취 빈도와 수면 시간, 다음 날 피로도의 관계를 알아봅니다.",
    target: "청주여고 전교생",
    duration: "약 3분",
    deadline: isoDate(2),
    usage_plan: "개인 탐구활동 보고서의 기초 자료로 활용",
    category: "과학·탐구",
    naver_form_url: "https://form.naver.com/response/example-caffeine",
    author_grade: "2학년",
    author_student_id: "2101",
    author_name: "김백합",
    author_display: "2101 김백합",
    manual_status: "active",
    approval_status: "approved",
    created_at: new Date(Date.now() - 86400000).toISOString(),
    updated_at: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: "sample-sleep",
    title: "시험 기간 수면시간과 집중도의 관계",
    short_description: "시험 기간 수면 습관이 수업 집중도에 어떤 영향을 주는지 조사합니다.",
    background: "시험을 준비하며 수면을 줄이는 것이 실제 학습 집중도에 도움이 되는지 궁금했습니다.",
    purpose: "수면 시간과 주관적인 집중도 사이의 경향을 확인합니다.",
    target: "청주여고 1·2학년",
    duration: "약 2분",
    deadline: isoDate(1),
    usage_plan: "학습 습관 개선을 위한 탐구 발표 자료로 활용",
    category: "과학·탐구",
    naver_form_url: "https://form.naver.com/response/example-sleep",
    author_grade: "1학년",
    author_student_id: "1207",
    author_name: "이나래",
    author_display: "1207 이나래",
    manual_status: "active",
    approval_status: "approved",
    created_at: new Date(Date.now() - 172800000).toISOString(),
    updated_at: new Date(Date.now() - 172800000).toISOString(),
  },
  {
    id: "sample-study-space",
    title: "학교 내 자습 공간 이용 만족도 조사",
    short_description: "더 편안한 자습 환경을 위해 학생들의 의견을 듣습니다.",
    background: "방과 후 자습 공간의 혼잡도와 이용 불편을 구체적으로 파악할 필요가 있었습니다.",
    purpose: "학생들이 선호하는 자습 공간과 개선이 필요한 요소를 확인합니다.",
    target: "청주여고 전교생",
    duration: "약 2분",
    deadline: isoDate(8),
    usage_plan: "교내 학생 의견 제안 자료로 활용",
    category: "학교생활",
    naver_form_url: "https://form.naver.com/response/example-space",
    author_grade: "2학년",
    author_student_id: "2312",
    author_name: "박하늘",
    author_display: "2312 박하늘",
    manual_status: "active",
    approval_status: "approved",
    created_at: new Date(Date.now() - 259200000).toISOString(),
    updated_at: new Date(Date.now() - 259200000).toISOString(),
  },
  {
    id: "sample-career",
    title: "고등학생의 진로 선택 기준 조사",
    short_description: "진로를 결정할 때 중요하게 생각하는 기준을 조사합니다.",
    background: "학생마다 진로 선택에서 중요하게 생각하는 기준이 다르다는 점에 주목했습니다.",
    purpose: "흥미, 적성, 안정성 등 진로 선택 요인의 우선순위를 알아봅니다.",
    target: "청주여고 전교생",
    duration: "약 4분",
    deadline: isoDate(12),
    usage_plan: "진로활동 포트폴리오와 모둠 토의 자료로 활용",
    category: "진로·교육",
    naver_form_url: "https://form.naver.com/response/example-career",
    author_grade: "3학년",
    author_student_id: "3108",
    author_name: "최다온",
    author_display: "3108 최다온",
    manual_status: "active",
    approval_status: "approved",
    created_at: new Date(Date.now() - 345600000).toISOString(),
    updated_at: new Date(Date.now() - 345600000).toISOString(),
  },
  {
    id: "sample-event",
    title: "학생들이 선호하는 교내 행사 조사",
    short_description: "학생들이 기대하는 교내 행사와 운영 방식을 알아봅니다.",
    background: "더 많은 학생이 즐겁게 참여할 수 있는 행사의 조건을 알아보고자 합니다.",
    purpose: "선호하는 행사 종류, 시기, 참여 방식을 조사합니다.",
    target: "청주여고 전교생",
    duration: "약 3분",
    deadline: isoDate(16),
    usage_plan: "학생자치 행사 기획과 학교생활 개선 제안에 활용",
    category: "학교생활",
    naver_form_url: "https://form.naver.com/response/example-event",
    author_grade: "1학년",
    author_student_id: "1415\n1416",
    author_name: "정가람\n윤채원",
    author_display: "1415 정가람, 1416 윤채원",
    manual_status: "active",
    approval_status: "approved",
    created_at: new Date(Date.now() - 432000000).toISOString(),
    updated_at: new Date(Date.now() - 432000000).toISOString(),
  },
];

export function getSurveyStatus(survey: Pick<Survey, "deadline" | "manual_status">) {
  if (survey.manual_status === "closed") return "종료" as const;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const end = new Date(`${survey.deadline}T23:59:59`);
  const days = Math.ceil((end.getTime() - today.getTime()) / 86400000);
  if (days < 0) return "종료" as const;
  if (days <= 3) return "마감 임박" as const;
  return "진행 중" as const;
}

export function formatDeadline(value: string) {
  return new Intl.DateTimeFormat("ko-KR", { month: "long", day: "numeric" }).format(new Date(`${value}T00:00:00`));
}
