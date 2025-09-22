# PRODUCT.md

> 🎯 **Glimpse**: Privacy-focused Korean dating app  
> 📋 Product specifications and business requirements

## 📱 Product Overview

**Glimpse** is an anonymous matching dating app for the Korean market. Users join interest-based groups and express anonymous interest. Only mutual matches reveal identities for chat.

### Core Features

#### 1. Anonymous Matching System
- Identity hidden until mutual interest
- Nickname-only system before matching
- Progressive disclosure after match

#### 2. Group-Based Discovery
- **Official Groups** (공식): Companies, universities
- **Created Groups** (생성): User-created communities  
- **Instance Groups** (인스턴스): Time-limited events
- **Location Groups** (위치): Proximity-based matching

#### 3. Real-time Features
- Encrypted chat with Socket.IO
- Online status indicators
- Read receipts for premium users
- Push notifications (FCM)

#### 4. Premium Features
- Unlimited likes (무제한 좋아요)
- See who liked you (좋아요 받은 사람 확인)
- Priority matching (우선 매칭)
- Undo likes (좋아요 되돌리기)
- Super likes (슈퍼 좋아요)
- Premium badge (프리미엄 배지)

## 💰 Business Model

### Freemium Pricing (KRW)

| Tier | Price | Features |
|------|-------|----------|
| **Free** | ₩0 | 1 daily like, basic chat |
| **Credits** | ₩2,500-19,000 | 5-50 likes bundle |
| **Premium Monthly** | ₩9,900 | All premium features |
| **Premium Yearly** | ₩99,000 | 17% discount |

### Revenue Streams
1. **Subscriptions**: Recurring monthly/yearly
2. **Credits**: One-time purchases
3. **Boost Features**: Profile visibility
4. **Virtual Gifts**: In-chat purchases (planned)

## 🎯 Target Market

### Primary Demographics
- **Age**: 25-35 years
- **Location**: Seoul, Gyeonggi, major cities
- **Profile**: Young professionals, university students
- **Income**: Middle to upper-middle class

### Market Positioning
- **Differentiation**: Privacy-first, group-based
- **Competition**: Tinder, Bumble, Amanda
- **Advantage**: Korean-specific features, anonymity

## 🔒 Privacy & Security

### Data Protection
- Minimal data collection
- GDPR/PIPA compliant
- End-to-end encryption for sensitive data
- Regular security audits

### Anonymity Features
- No real names until match
- Blurred photos option
- Private mode for browsing
- Incognito group joining

## 📊 Success Metrics

### Key Performance Indicators
- **MAU Target**: 100,000+ users
- **Conversion Rate**: 5-8% free to premium
- **ARPU**: ₩15,000-25,000
- **Retention**: 40% at 3 months
- **Match Rate**: 15-20% of likes

### Growth Strategy
1. University campus marketing
2. Corporate partnerships
3. Influencer collaborations
4. Referral programs

## 🚀 Development Roadmap

### Current Phase (Completed)
- ✅ Core matching algorithm
- ✅ Group system implementation
- ✅ Real-time chat
- ✅ Payment integration
- ✅ Mobile app (React Native)
- ✅ Admin dashboard

### Next Phase (Q1 2025)
- 🔄 Production deployment
- 🔄 Analytics integration
- 🔄 A/B testing framework
- 🔄 Performance optimization

### Future Plans (Q2-Q3 2025)
- 📅 AI-powered matching
- 📅 Video profiles
- 📅 Voice/video calls
- 📅 Events feature
- 📅 Gamification elements

## 🇰🇷 Korean Market Specifics

### Localization
- Full Korean language support
- Korean payment gateways (TossPay, KakaoPay)
- Korean social login (Kakao, Naver)
- Local dating culture considerations

### Compliance
- PIPA (Personal Information Protection Act)
- KISA guidelines
- Age verification (19+)
- Content moderation for Korean standards

### Marketing Channels
- Naver Blog/Cafe
- Instagram/YouTube
- KakaoTalk channels
- University communities

---

*Last updated: 2025-01-21*