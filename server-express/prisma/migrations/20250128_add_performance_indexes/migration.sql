-- AddPerformanceIndexes
-- Indexes for improved query performance

-- User likes queries
CREATE INDEX IF NOT EXISTS "idx_user_likes_created_at" ON "user_likes"("created_at");
CREATE INDEX IF NOT EXISTS "idx_user_likes_liker_created" ON "user_likes"("liker_id", "created_at");
CREATE INDEX IF NOT EXISTS "idx_user_likes_liked_created" ON "user_likes"("liked_user_id", "created_at");

-- Matches queries
CREATE INDEX IF NOT EXISTS "idx_matches_last_message_at" ON "matches"("last_message_at");
CREATE INDEX IF NOT EXISTS "idx_matches_user1_active" ON "matches"("user1_id", "is_active");
CREATE INDEX IF NOT EXISTS "idx_matches_user2_active" ON "matches"("user2_id", "is_active");
CREATE INDEX IF NOT EXISTS "idx_matches_created_at" ON "matches"("created_at" DESC);

-- Chat messages queries
CREATE INDEX IF NOT EXISTS "idx_chat_messages_match_created" ON "chat_messages"("match_id", "created_at");
CREATE INDEX IF NOT EXISTS "idx_chat_messages_sender_created" ON "chat_messages"("sender_id", "created_at");
CREATE INDEX IF NOT EXISTS "idx_chat_messages_type" ON "chat_messages"("type");

-- Notifications queries
CREATE INDEX IF NOT EXISTS "idx_notifications_user_read" ON "notifications"("user_id", "is_read");
CREATE INDEX IF NOT EXISTS "idx_notifications_user_created" ON "notifications"("user_id", "created_at" DESC);
CREATE INDEX IF NOT EXISTS "idx_notifications_type" ON "notifications"("type");

-- Payments queries
CREATE INDEX IF NOT EXISTS "idx_payments_user_status" ON "payments"("user_id", "status");
CREATE INDEX IF NOT EXISTS "idx_payments_created_at" ON "payments"("created_at" DESC);
CREATE INDEX IF NOT EXISTS "idx_payments_method_status" ON "payments"("payment_method", "status");

-- Stories queries
CREATE INDEX IF NOT EXISTS "idx_stories_active_expires" ON "stories"("is_active", "expires_at");
CREATE INDEX IF NOT EXISTS "idx_stories_user_active" ON "stories"("user_id", "is_active");
CREATE INDEX IF NOT EXISTS "idx_stories_created_at" ON "stories"("created_at" DESC);

-- Group members queries
CREATE INDEX IF NOT EXISTS "idx_group_members_group_status" ON "group_members"("group_id", "status");
CREATE INDEX IF NOT EXISTS "idx_group_members_user_status" ON "group_members"("user_id", "status");
CREATE INDEX IF NOT EXISTS "idx_group_members_joined" ON "group_members"("joined_at" DESC);

-- Groups queries
CREATE INDEX IF NOT EXISTS "idx_groups_type_active" ON "groups"("type", "is_active");
CREATE INDEX IF NOT EXISTS "idx_groups_matching_active" ON "groups"("is_matching_active", "is_active");
CREATE INDEX IF NOT EXISTS "idx_groups_created_at" ON "groups"("created_at" DESC);

-- User groups queries (for finding user's groups efficiently)
CREATE INDEX IF NOT EXISTS "idx_user_groups_user_id" ON "user_groups"("user_id");

-- Premium subscriptions queries
CREATE INDEX IF NOT EXISTS "idx_premium_subscriptions_user_active" ON "premium_subscriptions"("user_id", "is_active");
CREATE INDEX IF NOT EXISTS "idx_premium_subscriptions_expires" ON "premium_subscriptions"("expires_at");

-- Content queries
CREATE INDEX IF NOT EXISTS "idx_content_user_created" ON "content"("user_id", "created_at" DESC);
CREATE INDEX IF NOT EXISTS "idx_content_public_created" ON "content"("is_public", "created_at" DESC);

-- Company verifications queries
CREATE INDEX IF NOT EXISTS "idx_company_verifications_user" ON "company_verifications"("user_id");
CREATE INDEX IF NOT EXISTS "idx_company_verifications_status" ON "company_verifications"("status");

-- Analytics indexes for reporting
CREATE INDEX IF NOT EXISTS "idx_users_created_at" ON "users"("created_at");
CREATE INDEX IF NOT EXISTS "idx_users_last_active" ON "users"("last_active");
CREATE INDEX IF NOT EXISTS "idx_users_premium_verified" ON "users"("is_premium", "is_verified");