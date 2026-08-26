CREATE TABLE `members` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(120) NOT NULL,
	`email` varchar(320) NOT NULL,
	`phone` varchar(32) NOT NULL,
	`plan` enum('flex','unlimited','coach') NOT NULL,
	`status` enum('active','paused','expired') NOT NULL DEFAULT 'active',
	`joinedAt` timestamp NOT NULL,
	`expiresAt` timestamp NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `members_id` PRIMARY KEY(`id`),
	CONSTRAINT `members_email_unique` UNIQUE(`email`)
);
