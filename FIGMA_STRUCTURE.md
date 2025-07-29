# Glimpse 피그마 파일 구조

## 🎯 피그마 프로젝트 구성

### 1. 파일 구조
```
Glimpse Design System/
├── 📁 1. Design System
│   ├── 📄 Colors & Typography
│   ├── 📄 Components Library
│   ├── 📄 Icons & Assets
│   └── 📄 Design Tokens
├── 📁 2. User Flows
│   ├── 📄 Onboarding Flow
│   ├── 📄 Matching Flow
│   ├── 📄 Premium Flow
│   └── 📄 Chat Flow
├── 📁 3. Screens
│   ├── 📄 Auth & Onboarding
│   ├── 📄 Main Screens
│   ├── 📄 Group Screens
│   ├── 📄 Chat & Matching
│   ├── 📄 Premium & Payment
│   └── 📄 Settings & Others
└── 📁 4. Prototypes
    ├── 📄 Interactive Prototype
    ├── 📄 Component States
    └── 📄 Micro-interactions
```

## 📐 디자인 시스템 페이지

### Page 1: Colors & Typography
```
Frame 구조:
1. Color Palette
   - Primary Colors
     * Main Pink (#FF6B6B)
     * Dark Pink (#FA5252)
     * Light Pink (#FFE0E0)
   - Neutral Colors
     * Gray Scale (9단계)
   - Semantic Colors
     * Success, Warning, Error, Info
   - Premium Colors
     * Gold gradients

2. Typography System
   - Font Families
   - Type Scale (H1-H6, Body, Caption)
   - Line Heights
   - Font Weights
   - Usage Examples

3. Color Usage Guidelines
   - Background colors
   - Text colors
   - Interactive states
   - Accessibility contrast ratios
```

### Page 2: Components Library
```
1. Basic Components
   - Buttons
     * Primary / Secondary / Ghost
     * Sizes: Small / Medium / Large
     * States: Default / Hover / Active / Disabled
   
   - Input Fields
     * Text Input
     * Phone Number Input
     * OTP Input
     * Search Input
     * States: Default / Focus / Error / Success
   
   - Cards
     * Profile Card (Anonymous)
     * Group Card
     * Match Card
     * Chat Preview Card

2. Navigation Components
   - Tab Bar (4 tabs)
   - Top Navigation Bar
   - Back Navigation
   - Step Indicators

3. Special Components
   - Like Button (with animation states)
   - Super Like Button
   - Match Animation
   - Profile Blur Overlay
   - Premium Badge
   - Online Indicator
   - Typing Indicator
   - Message Bubble (sent/received)
```

### Page 3: Icons & Assets
```
1. Navigation Icons (24x24)
   - Home (filled/outline)
   - Groups (filled/outline)
   - Matches (filled/outline)
   - Profile (filled/outline)

2. Action Icons
   - Like / Unlike
   - Super Like
   - Pass
   - Chat
   - Call
   - Video
   - Share
   - Settings

3. Status Icons
   - Verified
   - Premium
   - Online/Offline
   - Encrypted
   - Location

4. Illustrations
   - Empty states
   - Onboarding
   - Success states
   - Error states
```

## 📱 화면 디자인 페이지

### Page 4: Auth & Onboarding
```
Frames:
1. Splash Screen (375x812)
2. Onboarding Screens (3 frames)
3. Phone Verification
4. SMS Verification
5. Profile Setup (4 steps)
6. Terms & Conditions
7. Permissions Request
```

### Page 5: Main Screens
```
Frames:
1. Home Screen
   - Story carousel
   - Profile card stack
   - Action buttons
   
2. Groups Screen
   - Tab navigation
   - Group list
   - Search/Filter
   
3. Matches Screen
   - Active matches
   - Chat list
   - Empty state
   
4. Profile Screen
   - User info
   - Statistics
   - Menu items
```

### Page 6: Group Screens
```
Frames:
1. Group Detail
2. Group Members Grid
3. Create Group
4. Join Group
5. Group Settings
6. Company Verification
7. Location Group
8. QR Scanner
```

### Page 7: Chat & Matching
```
Frames:
1. Chat Screen
   - Message list
   - Input area
   - Media picker
   
2. Match Success Animation
3. Profile View (Matched)
4. Voice Call Screen
5. Video Call Screen
6. Media Viewer
7. Location Share
```

### Page 8: Premium & Payment
```
Frames:
1. Premium Landing
2. Plan Selection
3. Payment Methods
4. Payment Process
5. Success Screen
6. Subscription Management
7. Credit Purchase
```

## 🎬 프로토타입 페이지

### Interactive Flows
```
1. Onboarding Flow
   Start → Onboarding → Phone Auth → Profile → Home

2. First Match Flow
   Home → Like → Match Animation → Chat

3. Premium Purchase Flow
   Profile → Premium → Select Plan → Payment → Success

4. Group Join Flow
   Groups → Select Group → Join → Member View

5. Story Flow
   Home → View Story → React → Reply
```

### Micro-interactions
```
1. Like Animation
   - Heart particle effect
   - Card swipe physics
   
2. Match Success
   - Confetti animation
   - Profile reveal effect
   
3. Message Send
   - Bubble appear animation
   - Read receipt transition
   
4. Pull to Refresh
   - Elastic animation
   - Loading states
```

## 🎨 디자인 토큰

### Spacing System
```
Space tokens:
- space-xs: 4px
- space-sm: 8px
- space-md: 16px
- space-lg: 24px
- space-xl: 32px
- space-xxl: 48px
```

### Border Radius
```
Radius tokens:
- radius-sm: 8px
- radius-md: 12px
- radius-lg: 16px
- radius-full: 9999px
```

### Shadows
```
Shadow tokens:
- shadow-sm: 0 2px 8px rgba(0,0,0,0.08)
- shadow-md: 0 4px 16px rgba(0,0,0,0.12)
- shadow-lg: 0 8px 24px rgba(0,0,0,0.16)
```

## 📋 체크리스트

### 디자인 시스템
- [ ] Color system with semantic naming
- [ ] Typography scale and usage
- [ ] Component library with all states
- [ ] Icon set (custom or library)
- [ ] Spacing and grid system

### 화면 디자인
- [ ] All screens from user flow
- [ ] Empty states
- [ ] Loading states
- [ ] Error states
- [ ] Success states

### 프로토타입
- [ ] Main user flows connected
- [ ] Micro-interactions defined
- [ ] Gestures documented
- [ ] Transitions specified

### 핸드오프
- [ ] Design tokens exported
- [ ] Assets exported (1x, 2x, 3x)
- [ ] Component documentation
- [ ] Interaction specifications

## 🚀 피그마 플러그인 추천

1. **Design System**
   - Figma Tokens
   - Design System Organizer

2. **Workflow**
   - Figmotion (animations)
   - Stark (accessibility)
   - Lorem Ipsum generator

3. **Export**
   - Figma to Code
   - Design Tokens Exporter

4. **Collaboration**
   - FigJam for flows
   - Brandfetch (logos)

---

이 구조를 따라 피그마에서 체계적으로 디자인 시스템과 화면을 구성하면, 개발팀과 효율적으로 협업할 수 있습니다.