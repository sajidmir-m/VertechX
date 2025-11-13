ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "email" text;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "supabase_user_id" text;

UPDATE "users" SET "email" = "username" WHERE "email" IS NULL;
UPDATE "users" SET "supabase_user_id" = "id" WHERE "supabase_user_id" IS NULL;

ALTER TABLE "users" ALTER COLUMN "email" SET NOT NULL;
ALTER TABLE "users" ALTER COLUMN "supabase_user_id" SET NOT NULL;

DO $$
BEGIN
  ALTER TABLE "users" ADD CONSTRAINT "users_email_unique" UNIQUE ("email");
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE "users" ADD CONSTRAINT "users_supabase_user_id_unique" UNIQUE ("supabase_user_id");
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

