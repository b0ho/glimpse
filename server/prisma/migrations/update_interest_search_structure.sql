-- Update interest_searches table structure to remove metadata JSON column
-- and add structured columns for better performance and search capabilities

-- 1. Add new structured columns to existing table
ALTER TABLE "interest_searches" 
ADD COLUMN IF NOT EXISTS "relationshipIntent" "RelationshipIntent" DEFAULT 'ROMANTIC',
ADD COLUMN IF NOT EXISTS "primaryHash" TEXT,
ADD COLUMN IF NOT EXISTS "secondaryHash" TEXT,
ADD COLUMN IF NOT EXISTS "encryptedData" TEXT,
ADD COLUMN IF NOT EXISTS "encryptedIV" TEXT,
ADD COLUMN IF NOT EXISTS "encryptedTag" TEXT,
ADD COLUMN IF NOT EXISTS "displayValue" TEXT,
ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "phoneCountryCode" TEXT,
ADD COLUMN IF NOT EXISTS "phoneLastDigits" TEXT,
ADD COLUMN IF NOT EXISTS "emailDomain" TEXT,
ADD COLUMN IF NOT EXISTS "emailFirstChar" TEXT,
ADD COLUMN IF NOT EXISTS "socialPlatform" TEXT,
ADD COLUMN IF NOT EXISTS "birthYear" INTEGER,
ADD COLUMN IF NOT EXISTS "ageRange" TEXT,
ADD COLUMN IF NOT EXISTS "locationCity" TEXT,
ADD COLUMN IF NOT EXISTS "companyDomain" TEXT,
ADD COLUMN IF NOT EXISTS "schoolName" TEXT,
ADD COLUMN IF NOT EXISTS "partTimeCategory" TEXT,
ADD COLUMN IF NOT EXISTS "platformName" TEXT,
ADD COLUMN IF NOT EXISTS "gameTitle" TEXT;

-- 2. Add DELETED status to SearchStatus enum if not exists
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'DELETED' AND enumtypid = (
        SELECT oid FROM pg_type WHERE typname = 'SearchStatus'
    )) THEN
        ALTER TYPE "SearchStatus" ADD VALUE 'DELETED';
    END IF;
END $$;

-- 3. Migrate existing data from metadata JSON to structured columns
UPDATE "interest_searches"
SET 
  "relationshipIntent" = COALESCE((metadata->>'relationshipIntent')::text, 'ROMANTIC')::"RelationshipIntent",
  "phoneCountryCode" = CASE 
    WHEN type = 'PHONE' THEN COALESCE(metadata->>'countryCode', '+82')
    ELSE NULL
  END,
  "phoneLastDigits" = CASE 
    WHEN type = 'PHONE' THEN metadata->>'lastDigits'
    ELSE NULL
  END,
  "emailDomain" = CASE 
    WHEN type = 'EMAIL' THEN metadata->>'domain'
    ELSE NULL
  END,
  "socialPlatform" = CASE 
    WHEN type IN ('SOCIAL_ID', 'PLATFORM') THEN metadata->>'platform'
    ELSE NULL
  END,
  "birthYear" = CASE 
    WHEN type = 'BIRTHDATE' THEN (metadata->>'year')::INTEGER
    ELSE NULL
  END,
  "ageRange" = CASE 
    WHEN type = 'BIRTHDATE' THEN metadata->>'ageRange'
    ELSE NULL
  END,
  "locationCity" = CASE 
    WHEN type = 'LOCATION' THEN metadata->>'city'
    ELSE NULL
  END,
  "companyDomain" = CASE 
    WHEN type = 'COMPANY' THEN metadata->>'domain'
    ELSE NULL
  END,
  "schoolName" = CASE 
    WHEN type = 'SCHOOL' THEN metadata->>'name'
    ELSE NULL
  END,
  "partTimeCategory" = CASE 
    WHEN type = 'PART_TIME_JOB' THEN metadata->>'category'
    ELSE NULL
  END,
  "gameTitle" = CASE 
    WHEN type = 'GAME_ID' THEN metadata->>'gameTitle'
    ELSE NULL
  END,
  "displayValue" = COALESCE(metadata->>'displayValue', value)
WHERE metadata IS NOT NULL;

-- 4. Create new indexes for better performance
CREATE INDEX IF NOT EXISTS "interest_searches_type_primaryHash_status_idx" 
  ON "interest_searches"("type", "primaryHash", "status");
CREATE INDEX IF NOT EXISTS "interest_searches_relationshipIntent_status_idx" 
  ON "interest_searches"("relationshipIntent", "status");
CREATE INDEX IF NOT EXISTS "interest_searches_emailDomain_status_idx" 
  ON "interest_searches"("emailDomain", "status") WHERE "emailDomain" IS NOT NULL;
CREATE INDEX IF NOT EXISTS "interest_searches_companyDomain_status_idx" 
  ON "interest_searches"("companyDomain", "status") WHERE "companyDomain" IS NOT NULL;
CREATE INDEX IF NOT EXISTS "interest_searches_schoolName_status_idx" 
  ON "interest_searches"("schoolName", "status") WHERE "schoolName" IS NOT NULL;
CREATE INDEX IF NOT EXISTS "interest_searches_deletedAt_idx" 
  ON "interest_searches"("deletedAt") WHERE "deletedAt" IS NOT NULL;

-- 5. Note: The metadata column is kept for backward compatibility
-- It can be removed in a future migration after confirming all data is migrated
-- ALTER TABLE "interest_searches" DROP COLUMN "metadata";