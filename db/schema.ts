import { sql } from "drizzle-orm";
import { index, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const surveys = sqliteTable("surveys", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  shortDescription: text("short_description").notNull(),
  background: text("background").notNull(),
  purpose: text("purpose").notNull(),
  target: text("target").notNull(),
  duration: text("duration").notNull(),
  deadline: text("deadline").notNull(),
  usagePlan: text("usage_plan").notNull(),
  category: text("category").notNull(),
  naverFormUrl: text("naver_form_url").notNull(),
  authorGrade: text("author_grade").notNull().default(""),
  authorStudentId: text("author_student_id").notNull().default(""),
  authorName: text("author_name").notNull().default(""),
  authorDisplay: text("author_display").notNull().default("익명"),
  managementCode: text("management_code").notNull().unique(),
  manualStatus: text("manual_status").notNull().default("active"),
  approvalStatus: text("approval_status").notNull().default("pending"),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
  index("idx_surveys_approval_created").on(table.approvalStatus, table.createdAt),
  index("idx_surveys_deadline").on(table.deadline),
]);

export const reports = sqliteTable("reports", {
  id: text("id").primaryKey(),
  surveyId: text("survey_id").notNull().references(() => surveys.id, { onDelete: "cascade" }),
  reason: text("reason").notNull(),
  description: text("description").notNull().default(""),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => [index("idx_reports_survey_id").on(table.surveyId)]);
