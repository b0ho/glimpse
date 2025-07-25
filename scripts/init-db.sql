-- Initial database setup for Glimpse Dating App

-- Create extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Set timezone
SET timezone = 'Asia/Seoul';

-- Create custom types if not exists
DO $$ BEGIN
    CREATE TYPE gender_type AS ENUM ('MALE', 'FEMALE', 'OTHER');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE group_type AS ENUM ('OFFICIAL', 'CREATED', 'INSTANCE', 'LOCATION');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE verification_method AS ENUM ('EMAIL_DOMAIN', 'OCR_VERIFICATION', 'INVITE_CODE', 'HR_APPROVAL');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE verification_status AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'EXPIRED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE payment_status AS ENUM ('PENDING', 'COMPLETED', 'FAILED', 'REFUNDED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE payment_method AS ENUM ('CARD', 'KAKAO_PAY', 'TOSS_PAY', 'NAVER_PAY');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE notification_type AS ENUM ('LIKE_RECEIVED', 'MATCH_CREATED', 'MESSAGE_RECEIVED', 'GROUP_INVITATION', 'VERIFICATION_APPROVED', 'VERIFICATION_REJECTED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_clerk_id ON "User"(clerkId);
CREATE INDEX IF NOT EXISTS idx_users_anonymous_id ON "User"(anonymousId);
CREATE INDEX IF NOT EXISTS idx_users_phone_number ON "User"(phoneNumber);
CREATE INDEX IF NOT EXISTS idx_users_last_active ON "User"(lastActive);
CREATE INDEX IF NOT EXISTS idx_users_is_premium ON "User"(isPremium);

CREATE INDEX IF NOT EXISTS idx_groups_type ON "Group"(type);
CREATE INDEX IF NOT EXISTS idx_groups_is_active ON "Group"(isActive);
CREATE INDEX IF NOT EXISTS idx_groups_creator_id ON "Group"(creatorId);

CREATE INDEX IF NOT EXISTS idx_group_members_user_id ON "GroupMember"(userId);
CREATE INDEX IF NOT EXISTS idx_group_members_group_id ON "GroupMember"(groupId);
CREATE INDEX IF NOT EXISTS idx_group_members_status ON "GroupMember"(status);

CREATE INDEX IF NOT EXISTS idx_likes_from_user ON "Like"(fromUserId);
CREATE INDEX IF NOT EXISTS idx_likes_to_user ON "Like"(toUserId);
CREATE INDEX IF NOT EXISTS idx_likes_group_id ON "Like"(groupId);
CREATE INDEX IF NOT EXISTS idx_likes_created_at ON "Like"(createdAt);

CREATE INDEX IF NOT EXISTS idx_matches_users ON "Match"(user1Id, user2Id);
CREATE INDEX IF NOT EXISTS idx_matches_is_active ON "Match"(isActive);
CREATE INDEX IF NOT EXISTS idx_matches_last_message ON "Match"(lastMessageAt);

CREATE INDEX IF NOT EXISTS idx_messages_match_id ON "ChatMessage"(matchId);
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON "ChatMessage"(senderId);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON "ChatMessage"(createdAt);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON "Notification"(userId);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON "Notification"(isRead);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON "Notification"(createdAt);

CREATE INDEX IF NOT EXISTS idx_payments_user_id ON "Payment"(userId);
CREATE INDEX IF NOT EXISTS idx_payments_status ON "Payment"(status);
CREATE INDEX IF NOT EXISTS idx_payments_created_at ON "Payment"(createdAt);

-- Insert sample data for development
INSERT INTO "Company" (id, name, domain, type, isVerified, createdAt, updatedAt)
VALUES 
    (gen_random_uuid(), '삼성전자', 'samsung.com', 'COMPANY', true, NOW(), NOW()),
    (gen_random_uuid(), 'LG전자', 'lge.com', 'COMPANY', true, NOW(), NOW()),
    (gen_random_uuid(), '네이버', 'naver.com', 'COMPANY', true, NOW(), NOW()),
    (gen_random_uuid(), '카카오', 'kakao.com', 'COMPANY', true, NOW(), NOW()),
    (gen_random_uuid(), '서울대학교', 'snu.ac.kr', 'UNIVERSITY', true, NOW(), NOW()),
    (gen_random_uuid(), '연세대학교', 'yonsei.ac.kr', 'UNIVERSITY', true, NOW(), NOW())
ON CONFLICT DO NOTHING;

-- Grant permissions (adjust as needed)
GRANT ALL PRIVILEGES ON DATABASE glimpse_dev TO glimpse_dev;
GRANT ALL ON ALL TABLES IN SCHEMA public TO glimpse_dev;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO glimpse_dev;