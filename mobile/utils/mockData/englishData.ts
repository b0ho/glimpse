/**
 * English Mock Data for Development and Testing
 * @description English language test data for UI development and i18n testing
 */

import { User, Group, Match, Message, Story, GroupType } from '@/types';

// English mock users
export const mockUsersEn: User[] = [
  {
    id: '1',
    phone: '+821012345678',
    nickname: 'John_Smith',
    bio: 'Software engineer from SF | Coffee enthusiast ☕',
    age: 28,
    gender: 'MALE',
    profileImageUrl: 'https://i.pravatar.cc/150?img=1',
    isVerified: true,
    isPremium: false,
    createdAt: new Date('2024-01-01'),
    lastActiveAt: new Date(),
  },
  {
    id: '2',
    phone: '+821087654321',
    nickname: 'Emily_Johnson',
    bio: 'Product designer | Hiking lover 🥾 | Dog mom 🐕',
    age: 26,
    gender: 'FEMALE',
    profileImageUrl: 'https://i.pravatar.cc/150?img=2',
    isVerified: true,
    isPremium: true,
    createdAt: new Date('2024-01-05'),
    lastActiveAt: new Date(),
  },
  {
    id: '3',
    phone: '+821077777777',
    nickname: 'Michael_Brown',
    bio: 'Startup founder | Tech enthusiast | Always learning 📚',
    age: 32,
    gender: 'MALE',
    profileImageUrl: 'https://i.pravatar.cc/150?img=3',
    isVerified: true,
    isPremium: true,
    createdAt: new Date('2024-01-10'),
    lastActiveAt: new Date(),
  },
  {
    id: '4',
    phone: '+821044444444',
    nickname: 'Sarah_Davis',
    bio: 'Marketing manager | Yoga instructor 🧘‍♀️ | Travel addict ✈️',
    age: 29,
    gender: 'FEMALE',
    profileImageUrl: 'https://i.pravatar.cc/150?img=4',
    isVerified: true,
    isPremium: false,
    createdAt: new Date('2024-01-15'),
    lastActiveAt: new Date(),
  },
  {
    id: '5',
    phone: '+821055555555',
    nickname: 'David_Wilson',
    bio: 'Photographer 📸 | Capturing Seoul moments | Art lover',
    age: 27,
    gender: 'MALE',
    profileImageUrl: 'https://i.pravatar.cc/150?img=5',
    isVerified: true,
    isPremium: false,
    createdAt: new Date('2024-01-20'),
    lastActiveAt: new Date(),
  },
];

// English mock groups
export const mockGroupsEn: Group[] = [
  {
    id: '1',
    code: 'google-korea',
    name: 'Google Korea',
    description: 'Official Google Korea employees group',
    type: GroupType.OFFICIAL,
    memberCount: 156,
    imageUrl: 'https://www.google.com/images/branding/googlelogo/2x/googlelogo_color_272x92dp.png',
    isActive: true,
    tags: ['tech', 'googlers', 'seoul'],
    createdAt: new Date('2024-01-01'),
  },
  {
    id: '2',
    code: 'seoul-book-club',
    name: 'Seoul Book Club',
    description: 'Monthly book discussions in English for book lovers',
    type: GroupType.CREATED,
    memberCount: 89,
    imageUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d',
    isActive: true,
    tags: ['books', 'reading', 'english', 'literature'],
    createdAt: new Date('2024-01-05'),
  },
  {
    id: '3',
    code: 'hiking-seoul',
    name: 'Seoul Hiking Group',
    description: 'Weekend hiking adventures around Seoul and beyond',
    type: GroupType.CREATED,
    memberCount: 124,
    imageUrl: 'https://images.unsplash.com/photo-1551632811-561732d1e306',
    isActive: true,
    tags: ['hiking', 'outdoors', 'nature', 'fitness'],
    createdAt: new Date('2024-01-10'),
  },
  {
    id: '4',
    code: 'tech-conf-2024',
    name: 'Tech Conference 2024',
    description: 'Annual tech conference - Network with professionals',
    type: GroupType.INSTANCE,
    memberCount: 512,
    imageUrl: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87',
    isActive: true,
    tags: ['conference', 'tech', 'networking', 'event'],
    startDate: new Date('2024-03-15'),
    endDate: new Date('2024-03-17'),
    createdAt: new Date('2024-01-15'),
  },
  {
    id: '5',
    code: 'gangnam-cowork',
    name: 'Gangnam Coworking',
    description: 'Connect with professionals at Gangnam coworking spaces',
    type: GroupType.LOCATION,
    memberCount: 78,
    imageUrl: 'https://images.unsplash.com/photo-1497366216548-37526070297c',
    isActive: true,
    tags: ['coworking', 'gangnam', 'professionals', 'networking'],
    latitude: 37.4979,
    longitude: 127.0276,
    radius: 500,
    createdAt: new Date('2024-01-20'),
  },
];

// English mock matches
export const mockMatchesEn: Match[] = [
  {
    id: '1',
    user1Id: '1',
    user2Id: '2',
    groupId: '1',
    matchedAt: new Date('2024-02-01'),
    isActive: true,
    lastMessageAt: new Date(),
    unreadCount: 2,
    otherUser: mockUsersEn[1],
    group: mockGroupsEn[0],
  },
  {
    id: '2',
    user1Id: '1',
    user2Id: '3',
    groupId: '2',
    matchedAt: new Date('2024-02-05'),
    isActive: true,
    lastMessageAt: new Date(Date.now() - 3600000),
    unreadCount: 0,
    otherUser: mockUsersEn[2],
    group: mockGroupsEn[1],
  },
  {
    id: '3',
    user1Id: '1',
    user2Id: '4',
    groupId: '3',
    matchedAt: new Date('2024-02-10'),
    isActive: true,
    lastMessageAt: new Date(Date.now() - 7200000),
    unreadCount: 5,
    otherUser: mockUsersEn[3],
    group: mockGroupsEn[2],
  },
];

// English mock messages
export const mockMessagesEn: Message[] = [
  {
    id: '1',
    chatRoomId: '1',
    senderId: '2',
    content: "Hi! Nice to match with you 😊",
    createdAt: new Date(Date.now() - 3600000),
    isRead: true,
  },
  {
    id: '2',
    chatRoomId: '1',
    senderId: '1',
    content: "Hey! Great to connect! I saw we're both at Google",
    createdAt: new Date(Date.now() - 3500000),
    isRead: true,
  },
  {
    id: '3',
    chatRoomId: '1',
    senderId: '2',
    content: "Yes! Are you in the Seoul office?",
    createdAt: new Date(Date.now() - 3400000),
    isRead: true,
  },
  {
    id: '4',
    chatRoomId: '1',
    senderId: '1',
    content: "I am! Working on the Cloud team. What about you?",
    createdAt: new Date(Date.now() - 3300000),
    isRead: true,
  },
  {
    id: '5',
    chatRoomId: '1',
    senderId: '2',
    content: "Product design team here! Would love to grab coffee sometime ☕",
    createdAt: new Date(Date.now() - 3200000),
    isRead: false,
  },
];

// English mock stories
export const mockStoriesEn: Story[] = [
  {
    id: '1',
    userId: '2',
    user: mockUsersEn[1],
    mediaUrl: 'https://images.unsplash.com/photo-1554080353-a576cf803bda',
    mediaType: 'image',
    caption: 'Beautiful sunset at Namsan Tower 🌅',
    viewCount: 45,
    createdAt: new Date(Date.now() - 7200000),
    expiresAt: new Date(Date.now() + 79200000),
  },
  {
    id: '2',
    userId: '3',
    user: mockUsersEn[2],
    mediaUrl: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4',
    mediaType: 'image',
    caption: 'Coffee time at my favorite cafe in Gangnam ☕',
    viewCount: 32,
    createdAt: new Date(Date.now() - 14400000),
    expiresAt: new Date(Date.now() + 72000000),
  },
  {
    id: '3',
    userId: '4',
    user: mockUsersEn[3],
    mediaUrl: 'https://images.unsplash.com/photo-1544025162-d76694265947',
    mediaType: 'image',
    caption: 'Weekend yoga session 🧘‍♀️ #selfcare',
    viewCount: 28,
    createdAt: new Date(Date.now() - 21600000),
    expiresAt: new Date(Date.now() + 64800000),
  },
];

// English notification messages
export const mockNotificationsEn = {
  newMatch: "You have a new match! Start chatting now",
  newLike: "Someone liked you! Check who it is",
  newMessage: "New message from {{name}}",
  superLike: "You received a super like! 🌟",
  groupJoined: "Welcome to {{groupName}}!",
  premiumExpiring: "Your premium subscription expires in 3 days",
  dailyLikesRefreshed: "Your daily likes have been refreshed!",
  profileViewed: "Someone viewed your profile",
};

// English UI text samples
export const uiTextEn = {
  onboarding: {
    welcome: "Welcome to Glimpse",
    tagline: "Anonymous connections that matter",
    getStarted: "Get Started",
    signIn: "Sign In",
    signUp: "Sign Up",
  },
  profile: {
    editProfile: "Edit Profile",
    viewProfile: "View Profile",
    stats: {
      likes: "Likes",
      matches: "Matches",
      views: "Profile Views",
    },
    settings: "Settings",
    premium: "Go Premium",
    help: "Help & Support",
  },
  matching: {
    like: "Like",
    superLike: "Super Like",
    skip: "Skip",
    undo: "Undo",
    noMoreProfiles: "No more profiles in this group",
    cooldownMessage: "You've already liked this person recently",
  },
  chat: {
    typeMessage: "Type a message...",
    send: "Send",
    online: "Online",
    offline: "Offline",
    typing: "is typing...",
    delivered: "Delivered",
    read: "Read",
  },
  premium: {
    title: "Upgrade to Premium",
    benefits: [
      "Unlimited likes",
      "See who likes you",
      "Priority matching",
      "Super likes",
      "Read receipts",
      "Advanced filters",
    ],
    monthly: "Monthly",
    yearly: "Yearly (Save 17%)",
    subscribe: "Subscribe Now",
  },
};

// Sample conversation flows in English
export const conversationSamplesEn = [
  {
    topic: "Work",
    messages: [
      "What do you do for work?",
      "I'm a software engineer at a startup. How about you?",
      "Product designer at a tech company. Love the creative aspects!",
      "That's awesome! Must be exciting to see your designs come to life",
    ],
  },
  {
    topic: "Weekend Plans",
    messages: [
      "Any plans for the weekend?",
      "Thinking about hiking Bukhansan. The weather looks perfect!",
      "Nice! I was there last week. The views are amazing",
      "Any trail recommendations?",
    ],
  },
  {
    topic: "Food",
    messages: [
      "Have you tried any good restaurants lately?",
      "Just discovered this amazing Korean BBQ place in Hongdae",
      "Oh, I love Korean BBQ! What's it called?",
      "It's called 'Maple Tree House'. Definitely worth checking out!",
    ],
  },
];

export default {
  users: mockUsersEn,
  groups: mockGroupsEn,
  matches: mockMatchesEn,
  messages: mockMessagesEn,
  stories: mockStoriesEn,
  notifications: mockNotificationsEn,
  uiText: uiTextEn,
  conversations: conversationSamplesEn,
};