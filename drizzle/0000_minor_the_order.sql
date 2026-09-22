CREATE TABLE `reports` (
	`id` text PRIMARY KEY NOT NULL,
	`survey_id` text NOT NULL,
	`reason` text NOT NULL,
	`description` text DEFAULT '' NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`survey_id`) REFERENCES `surveys`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_reports_survey_id` ON `reports` (`survey_id`);--> statement-breakpoint
CREATE TABLE `surveys` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`short_description` text NOT NULL,
	`background` text NOT NULL,
	`purpose` text NOT NULL,
	`target` text NOT NULL,
	`duration` text NOT NULL,
	`deadline` text NOT NULL,
	`usage_plan` text NOT NULL,
	`category` text NOT NULL,
	`naver_form_url` text NOT NULL,
	`author_grade` text DEFAULT '' NOT NULL,
	`author_display` text DEFAULT '익명' NOT NULL,
	`management_code` text NOT NULL,
	`manual_status` text DEFAULT 'active' NOT NULL,
	`approval_status` text DEFAULT 'pending' NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `surveys_management_code_unique` ON `surveys` (`management_code`);--> statement-breakpoint
CREATE INDEX `idx_surveys_approval_created` ON `surveys` (`approval_status`,`created_at`);--> statement-breakpoint
CREATE INDEX `idx_surveys_deadline` ON `surveys` (`deadline`);