# Screen Files Organization Structure

## 새로운 폴더 구조

```
screens/
├── auth/                    # 인증 관련 (이미 존재)
│   ├── AuthScreen-NW.tsx
│   ├── PhoneVerificationScreen-NW.tsx
│   ├── SMSVerificationScreen-NW.tsx
│   ├── CompanyVerificationScreen-NW.tsx
│   └── NicknameSetupScreen-NW.tsx
│
├── home/                    # 홈 & 피드
│   ├── HomeScreen-NW.tsx
│   ├── CreateContentScreen-NW.tsx
│   ├── PostDetailScreen-NW.tsx
│   └── StoryUploadScreen-NW.tsx
│
├── groups/                  # 그룹 관련
│   ├── GroupsScreen-NW.tsx
│   ├── GroupDetailScreen-NW.tsx
│   ├── CreateGroupScreen-NW.tsx
│   ├── JoinGroupScreen-NW.tsx
│   ├── MyGroupsScreen-NW.tsx
│   ├── GroupInviteScreen-NW.tsx
│   ├── GroupManageScreen-NW.tsx
│   ├── QRGroupJoinScreen-NW.tsx
│   └── LocationGroupScreen-NW.tsx
│
├── chat/                    # 채팅 관련
│   ├── ChatScreen-NW.tsx
│   ├── ChatScreenSimple-NW.tsx
│   ├── MatchChatListScreen-NW.tsx
│   └── GroupChatListScreen-NW.tsx
│
├── matches/                 # 매칭 & 관심상대
│   ├── MatchesScreen-NW.tsx
│   ├── InterestSearchScreen-NW.tsx
│   ├── AddInterestScreen-NW.tsx
│   ├── LikeHistoryScreen-NW.tsx
│   └── WhoLikesYouScreen-NW.tsx
│
├── nearby/                  # 근처 기능
│   ├── NearbyUsersScreen-NW.tsx
│   ├── NearbyGroupsScreen-NW.tsx
│   └── MapScreen-NW.tsx
│
├── profile/                 # 프로필 관련
│   ├── ProfileScreen-NW.tsx
│   ├── ProfileEditScreen-NW.tsx
│   ├── ProfileSettingsScreen-NW.tsx
│   ├── ProfileModeScreen-NW.tsx
│   └── MyInfoScreen-NW.tsx
│
├── settings/                # 설정 관련
│   ├── NotificationSettingsScreen-NW.tsx
│   ├── AccountRestoreScreen-NW.tsx
│   ├── DeleteAccountScreen-NW.tsx
│   ├── PrivacyPolicyScreen-NW.tsx
│   ├── TermsOfServiceScreen-NW.tsx
│   └── SupportScreen-NW.tsx
│
├── premium/                 # 프리미엄 관련
│   ├── PremiumScreen-NW.tsx
│   └── CreateStoryScreen-NW.tsx
│
├── community/               # 커뮤니티 (이미 존재)
│   └── CommunityScreen-NW.tsx
│
├── instant/                 # 인스턴트 미팅 (이미 존재)
│   ├── InstantMeetingScreen-NW.tsx
│   └── JoinInstantMeetingScreen-NW.tsx
│
└── onboarding/             # 온보딩
    ├── OnboardingScreen-NW.tsx
    └── ModeSelectionScreen-NW.tsx
```

## 이동 명령어

```bash
# 홈 & 피드
mkdir -p screens/home
mv screens/HomeScreen-NW.tsx screens/home/
mv screens/CreateContentScreen-NW.tsx screens/home/
mv screens/PostDetailScreen-NW.tsx screens/home/
mv screens/StoryUploadScreen-NW.tsx screens/home/

# 그룹 관련
mkdir -p screens/groups
mv screens/GroupsScreen-NW.tsx screens/groups/
mv screens/GroupDetailScreen-NW.tsx screens/groups/
mv screens/CreateGroupScreen-NW.tsx screens/groups/
mv screens/JoinGroupScreen-NW.tsx screens/groups/
mv screens/MyGroupsScreen-NW.tsx screens/groups/
mv screens/GroupInviteScreen-NW.tsx screens/groups/
mv screens/GroupManageScreen-NW.tsx screens/groups/
mv screens/QRGroupJoinScreen-NW.tsx screens/groups/
mv screens/LocationGroupScreen-NW.tsx screens/groups/

# 채팅 관련
mkdir -p screens/chat
mv screens/ChatScreen-NW.tsx screens/chat/
mv screens/ChatScreenSimple-NW.tsx screens/chat/
mv screens/MatchChatListScreen-NW.tsx screens/chat/
mv screens/groupchat/GroupChatListScreen-NW.tsx screens/chat/

# 매칭 & 관심상대
mkdir -p screens/matches
mv screens/MatchesScreen-NW.tsx screens/matches/
mv screens/InterestSearchScreen-NW.tsx screens/matches/
mv screens/AddInterestScreen-NW.tsx screens/matches/
mv screens/LikeHistoryScreen-NW.tsx screens/matches/
mv screens/WhoLikesYouScreen-NW.tsx screens/matches/

# 근처 기능
mkdir -p screens/nearby
mv screens/NearbyUsersScreen-NW.tsx screens/nearby/
mv screens/NearbyGroupsScreen-NW.tsx screens/nearby/
mv screens/MapScreen-NW.tsx screens/nearby/

# 프로필 관련
mkdir -p screens/profile
mv screens/ProfileScreen-NW.tsx screens/profile/
mv screens/ProfileEditScreen-NW.tsx screens/profile/
mv screens/ProfileSettingsScreen-NW.tsx screens/profile/
mv screens/ProfileModeScreen-NW.tsx screens/profile/
mv screens/MyInfoScreen-NW.tsx screens/profile/

# 설정 관련
mkdir -p screens/settings
mv screens/NotificationSettingsScreen-NW.tsx screens/settings/
mv screens/AccountRestoreScreen-NW.tsx screens/settings/
mv screens/DeleteAccountScreen-NW.tsx screens/settings/
mv screens/PrivacyPolicyScreen-NW.tsx screens/settings/
mv screens/TermsOfServiceScreen-NW.tsx screens/settings/
mv screens/SupportScreen-NW.tsx screens/settings/

# 프리미엄 관련
mkdir -p screens/premium
mv screens/PremiumScreen-NW.tsx screens/premium/
mv screens/CreateStoryScreen-NW.tsx screens/premium/

# 온보딩
mkdir -p screens/onboarding
mv screens/OnboardingScreen-NW.tsx screens/onboarding/
mv screens/ModeSelectionScreen-NW.tsx screens/onboarding/
```