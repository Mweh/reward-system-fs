CREATE TABLE "logs" (
	"id" char(36) PRIMARY KEY NOT NULL,
	"userId" char(36) NOT NULL,
	"code" varchar(255) NOT NULL,
	"action" varchar(255) NOT NULL,
	"description" text,
	"data" json NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "rewards" (
	"id" char(36) PRIMARY KEY NOT NULL,
	"title" varchar(255) NOT NULL,
	"points" integer NOT NULL,
	"data" json,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" char(36) PRIMARY KEY NOT NULL,
	"fullname" varchar(255) NOT NULL,
	"username" varchar(255) NOT NULL,
	"email" varchar(255) NOT NULL,
	"phoneNumber" varchar(255) NOT NULL,
	"password" varchar(255) NOT NULL,
	"active" boolean DEFAULT false NOT NULL,
	"data" json,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_username_unique" UNIQUE("username"),
	CONSTRAINT "users_email_unique" UNIQUE("email"),
	CONSTRAINT "users_phoneNumber_unique" UNIQUE("phoneNumber")
);
--> statement-breakpoint
CREATE TABLE "users_rewards" (
	"id" char(36) PRIMARY KEY NOT NULL,
	"userId" char(36) NOT NULL,
	"rewardId" char(36) NOT NULL,
	"status" varchar(255) NOT NULL,
	"data" json,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "logs" ADD CONSTRAINT "logs_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users_rewards" ADD CONSTRAINT "users_rewards_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users_rewards" ADD CONSTRAINT "users_rewards_rewardId_rewards_id_fk" FOREIGN KEY ("rewardId") REFERENCES "public"."rewards"("id") ON DELETE no action ON UPDATE no action;