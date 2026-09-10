CREATE TABLE `teachers` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`username` text NOT NULL,
	`display_name` text NOT NULL,
	`password_hash` text NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `teacher_username_idx` ON `teachers` (`username`);
--> statement-breakpoint
CREATE TABLE `__new_students` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`teacher_id` integer NOT NULL,
	`name` text NOT NULL,
	`phone` text,
	`birth_date` text,
	`notes` text,
	`share_token` text NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`teacher_id`) REFERENCES `teachers`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_students` (`id`, `teacher_id`, `name`, `phone`, `birth_date`, `notes`, `share_token`, `created_at`, `updated_at`)
SELECT `id`, 1, `name`, `phone`, `birth_date`, `notes`, `share_token`, `created_at`, `updated_at` FROM `students`;
--> statement-breakpoint
DROP TABLE `students`;
--> statement-breakpoint
ALTER TABLE `__new_students` RENAME TO `students`;
--> statement-breakpoint
CREATE UNIQUE INDEX `share_token_idx` ON `students` (`share_token`);
