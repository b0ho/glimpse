-- CreateEnum
CREATE TYPE "PremiumLevel" AS ENUM ('FREE', 'BASIC', 'UPPER');

-- AlterTable
ALTER TABLE "users" ADD COLUMN "premiumLevel" "PremiumLevel" NOT NULL DEFAULT 'FREE';

-- Update existing premium users to BASIC level
UPDATE "users" SET "premiumLevel" = 'BASIC' WHERE "isPremium" = true;