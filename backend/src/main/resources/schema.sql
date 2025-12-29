-- Drop tables if they exist
DROP TABLE IF EXISTS user_like CASCADE;
DROP TABLE IF EXISTS group_tags CASCADE;
DROP TABLE IF EXISTS group_invite CASCADE;
DROP TABLE IF EXISTS group_like CASCADE;
DROP TABLE IF EXISTS group_member CASCADE;
DROP TABLE IF EXISTS message_reaction CASCADE;
DROP TABLE IF EXISTS chat_message CASCADE;
DROP TABLE IF EXISTS matches CASCADE;
DROP TABLE IF EXISTS notification CASCADE;
DROP TABLE IF EXISTS payment CASCADE;
DROP TABLE IF EXISTS subscription CASCADE;
DROP TABLE IF EXISTS groups CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Create users table
CREATE TABLE users (
    id VARCHAR(255) PRIMARY KEY,
    clerk_id VARCHAR(255) UNIQUE,
    email VARCHAR(255) UNIQUE,
    phone_number VARCHAR(255),
    real_name VARCHAR(255),
    nickname VARCHAR(255),
    anonymous_id VARCHAR(255) UNIQUE,
    gender VARCHAR(50),
    birthdate DATE,
    age INTEGER,
    bio TEXT,
    profile_image VARCHAR(500),
    height INTEGER,
    education VARCHAR(255),
    company_name VARCHAR(255),
    department VARCHAR(255),
    major VARCHAR(255),
    school VARCHAR(255),
    part_time_job VARCHAR(255),
    location VARCHAR(255),
    last_latitude DOUBLE PRECISION,
    last_longitude DOUBLE PRECISION,
    last_location_update_at TIMESTAMP,
    location_sharing_enabled BOOLEAN DEFAULT false,
    mbti VARCHAR(10),
    drinking VARCHAR(50),
    smoking VARCHAR(50),
    is_verified BOOLEAN DEFAULT false,
    is_premium BOOLEAN DEFAULT false,
    premium_level VARCHAR(50),
    premium_until TIMESTAMP,
    credits INTEGER DEFAULT 0,
    last_active TIMESTAMP,
    last_online TIMESTAMP,
    privacy_settings TEXT,
    notification_settings TEXT,
    persona_settings TEXT,
    persona_profile TEXT,
    social_ids TEXT,
    game_ids TEXT,
    platform_ids TEXT,
    deleted_at TIMESTAMP,
    deletion_reason VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create groups table
CREATE TABLE groups (
    id VARCHAR(255) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    type VARCHAR(50) NOT NULL,
    category VARCHAR(50),
    profile_image VARCHAR(500),
    cover_image VARCHAR(500),
    verification_required BOOLEAN DEFAULT false,
    verification_method VARCHAR(255),
    member_count INTEGER DEFAULT 0,
    max_members INTEGER,
    is_public BOOLEAN DEFAULT true,
    is_active BOOLEAN DEFAULT true,
    is_official BOOLEAN DEFAULT false,
    location VARCHAR(255),
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    radius DOUBLE PRECISION,
    invite_code VARCHAR(255) UNIQUE,
    invite_code_expires_at TIMESTAMP,
    settings TEXT,
    rules TEXT,
    metadata TEXT,
    total_likes INTEGER DEFAULT 0,
    total_matches INTEGER DEFAULT 0,
    daily_active_users INTEGER DEFAULT 0,
    weekly_active_users INTEGER DEFAULT 0,
    creator_id VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (creator_id) REFERENCES users(id)
);

-- Create matches table
CREATE TABLE matches (
    id VARCHAR(255) PRIMARY KEY,
    user1_id VARCHAR(255) NOT NULL,
    user2_id VARCHAR(255) NOT NULL,
    group_id VARCHAR(255),
    status VARCHAR(50) NOT NULL,
    is_anonymous BOOLEAN DEFAULT true,
    reveal_requested_by VARCHAR(255),
    reveal_requested_at TIMESTAMP,
    revealed_at TIMESTAMP,
    verification_code1 VARCHAR(255),
    verification_code2 VARCHAR(255),
    verification_expires_at TIMESTAMP,
    verified_at TIMESTAMP,
    last_message_at TIMESTAMP,
    last_message TEXT,
    unread_count1 INTEGER DEFAULT 0,
    unread_count2 INTEGER DEFAULT 0,
    message_count INTEGER DEFAULT 0,
    call_count INTEGER DEFAULT 0,
    video_call_count INTEGER DEFAULT 0,
    metadata TEXT,
    matched_at TIMESTAMP,
    unmatched_at TIMESTAMP,
    unmatch_reason VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user1_id) REFERENCES users(id),
    FOREIGN KEY (user2_id) REFERENCES users(id),
    FOREIGN KEY (group_id) REFERENCES groups(id)
);

-- Create other essential tables
CREATE TABLE group_member (
    id VARCHAR(255) PRIMARY KEY,
    group_id VARCHAR(255) NOT NULL,
    user_id VARCHAR(255) NOT NULL,
    role VARCHAR(50),
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (group_id) REFERENCES groups(id),
    FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE group_like (
    id VARCHAR(255) PRIMARY KEY,
    group_id VARCHAR(255) NOT NULL,
    user_id VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (group_id) REFERENCES groups(id),
    FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE group_invite (
    id VARCHAR(255) PRIMARY KEY,
    group_id VARCHAR(255) NOT NULL,
    inviter_id VARCHAR(255) NOT NULL,
    invitee_id VARCHAR(255),
    status VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (group_id) REFERENCES groups(id),
    FOREIGN KEY (inviter_id) REFERENCES users(id),
    FOREIGN KEY (invitee_id) REFERENCES users(id)
);

CREATE TABLE user_like (
    id VARCHAR(255) PRIMARY KEY,
    sender_id VARCHAR(255) NOT NULL,
    receiver_id VARCHAR(255) NOT NULL,
    group_id VARCHAR(255),
    status VARCHAR(50),
    liked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (sender_id) REFERENCES users(id),
    FOREIGN KEY (receiver_id) REFERENCES users(id),
    FOREIGN KEY (group_id) REFERENCES groups(id)
);

CREATE TABLE chat_message (
    id VARCHAR(255) PRIMARY KEY,
    match_id VARCHAR(255) NOT NULL,
    sender_id VARCHAR(255) NOT NULL,
    content TEXT,
    type VARCHAR(50),
    is_read BOOLEAN DEFAULT false,
    read_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (match_id) REFERENCES matches(id),
    FOREIGN KEY (sender_id) REFERENCES users(id)
);

CREATE TABLE notification (
    id VARCHAR(255) PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    type VARCHAR(50),
    title VARCHAR(255),
    message TEXT,
    data TEXT,
    is_read BOOLEAN DEFAULT false,
    read_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE payment (
    id VARCHAR(255) PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    amount DECIMAL(10,2),
    currency VARCHAR(10),
    status VARCHAR(50),
    payment_method VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE subscription (
    id VARCHAR(255) PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    type VARCHAR(50),
    status VARCHAR(50),
    start_date TIMESTAMP,
    end_date TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE group_tags (
    group_id VARCHAR(255) NOT NULL,
    tag VARCHAR(255),
    FOREIGN KEY (group_id) REFERENCES groups(id)
);

CREATE TABLE message_reaction (
    id VARCHAR(255) PRIMARY KEY,
    message_id VARCHAR(255) NOT NULL,
    user_id VARCHAR(255) NOT NULL,
    reaction VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (message_id) REFERENCES chat_message(id),
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- User ElementCollection tables
CREATE TABLE user_interests (
    user_id VARCHAR(255) NOT NULL,
    interest VARCHAR(255),
    FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE user_groups (
    user_id VARCHAR(255) NOT NULL,
    group_id VARCHAR(255),
    FOREIGN KEY (user_id) REFERENCES users(id)
);
