CREATE TABLE `sms_log` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`student_id` integer NOT NULL,
	`package_id` integer NOT NULL,
	`notify_type` text NOT NULL,
	`phone` text NOT NULL,
	`content` text NOT NULL,
	`status` text NOT NULL,
	`error` text,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`student_id`) REFERENCES `students`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`package_id`) REFERENCES `class_packages`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `sms_log_sent_once_idx` ON `sms_log` (`package_id`,`notify_type`) WHERE status = 'sent';